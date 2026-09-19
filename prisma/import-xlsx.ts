/**
 * Import the team's product workbook (docs template `clothse-products.xlsx`) plus
 * the image folders that go with it.
 *
 *   npx tsx prisma/import-xlsx.ts <workbook.xlsx> <images-dir> [--dry-run] [--owner <name>]
 *
 * Workbook layout (see the README sheet): `products` and `batches`, headers in
 * row 1, hints in row 2, data from row 3. Images live in `<images-dir>/<id>/`,
 * sorted by file name — the first one is the cover.
 *
 * The script validates everything first and stops without writing if any row
 * has an error. Products whose name + brand already exist are skipped, so the
 * command can be re-run after fixing a workbook. Batches are written straight
 * to the ledger as opening stock: no "Restocked" badge and no alert emails.
 */
import "dotenv/config";
import ExcelJS from "exceljs";
import fs from "node:fs";
import path from "node:path";
import { uploadProductImage, cloudinaryConfigured, IMAGE_MAX_BYTES } from "../lib/cloudinary";
import { prisma } from "../lib/prisma";
import { nextSku } from "../lib/services/admin/products";

// ─── CLI ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const positional = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--owner");
const ownerFilter = args.includes("--owner") ? args[args.indexOf("--owner") + 1]?.toLowerCase() : null;
const dryRun = flags.has("--dry-run");
const [workbookPath, imagesDir] = positional;

if (!workbookPath || !imagesDir) {
  console.error("usage: npx tsx prisma/import-xlsx.ts <workbook.xlsx> <images-dir> [--dry-run] [--owner <name>]");
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORIES = ["Tops", "Bottoms", "Footwear", "Accessories"];
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const MIME: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif" };

/** Flatten whatever exceljs hands back (rich text, hyperlinks, formulas, dates) to a trimmed string. */
function text(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((r) => r.text).join("").trim();
    if ("text" in v) return String(v.text).trim();
    if ("result" in v) return text(v.result as ExcelJS.CellValue);
    if ("error" in v) return "";
  }
  return String(v).trim();
}

const int = (s: string) => (/^\d+$/.test(s.replace(/[.,\s]/g, "")) ? Number(s.replace(/[.,\s]/g, "")) : NaN);
const list = (s: string) => s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
const natural = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

function readSheet(wb: ExcelJS.Workbook, name: string): Record<string, string>[] {
  const ws = wb.getWorksheet(name);
  if (!ws) throw new Error(`Sheet "${name}" not found in the workbook.`);
  const headers: string[] = [];
  ws.getRow(1).eachCell((c, i) => { headers[i] = text(c.value).toLowerCase(); });
  const rows: Record<string, string>[] = [];
  ws.eachRow((row, n) => {
    if (n < 3) return;
    const r: Record<string, string> = { _row: String(n) };
    row.eachCell({ includeEmpty: false }, (c, i) => { if (headers[i]) r[headers[i]] = text(c.value); });
    if (Object.keys(r).length > 1) rows.push(r);
  });
  return rows;
}

// ─── Parse & validate ────────────────────────────────────────────────────────

interface ProductRow {
  row: number;
  id: string;
  name: string;
  brand: string;
  category: string;
  typeCode: string;
  typeId: number;
  price: number;
  salePrice: number | null;
  description: string;
  tags: string[];
  sizes: string[];
  details: { label: string; value: string }[];
  modelFitNote: string;
  owner: string;
  images: { file: string; size: number }[];
}
interface BatchRow { row: number; id: string; size: string; qty: number; unitCost: number; receivedAt: Date }

const errors: string[] = [];
const warnings: string[] = [];
const err = (where: string, msg: string) => errors.push(`${where}: ${msg}`);
const warn = (where: string, msg: string) => warnings.push(`${where}: ${msg}`);

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(workbookPath);
  const rawProducts = readSheet(wb, "products");
  const rawBatches = readSheet(wb, "batches");

  const sizesByCategory = new Map<string, Map<string, number>>();
  const categoryIds = new Map<string, number>();
  for (const c of await prisma.category.findMany({ include: { sizes: true } })) {
    categoryIds.set(c.name, c.id);
    sizesByCategory.set(c.name, new Map(c.sizes.filter((s) => s.active).map((s) => [s.label.toLowerCase(), s.id])));
  }
  // Item types come from Store Management → Loại món (matched by label or code, case-insensitive).
  const itemTypes = (await prisma.itemType.findMany({ include: { category: { select: { name: true } } } })).map((t) => ({ id: t.id, code: t.code, label: t.label, category: t.category.name }));

  // products
  const products: ProductRow[] = [];
  const seenIds = new Set<string>();
  for (const r of rawProducts) {
    const where = `products row ${r._row}`;
    if (/VÍ DỤ|VI DU/i.test(r.notes ?? "")) { warn(where, `example row "${r.id}" skipped — delete it from the sheet`); continue; }
    if (ownerFilter && (r.owner ?? "").toLowerCase() !== ownerFilter) continue;

    const id = (r.id ?? "").toLowerCase();
    if (!/^[a-z0-9]+-\d{2,}$/.test(id)) err(where, `id "${r.id}" must look like thach-07 (letters/digits, dash, number)`);
    if (seenIds.has(id)) err(where, `duplicate id "${id}"`);
    seenIds.add(id);

    const name = r.name ?? "";
    if (!name) err(where, "name is required");
    const brand = r.brand ?? "";
    if (!brand) err(where, "brand is required");
    const category = CATEGORIES.find((c) => c.toLowerCase() === (r.category ?? "").toLowerCase()) ?? "";
    if (!category) err(where, `category "${r.category}" must be one of ${CATEGORIES.join(" / ")}`);
    const type = itemTypes.find((t) => t.label.toLowerCase() === (r.type ?? "").toLowerCase() || t.code === (r.type ?? "").toUpperCase());
    if (!type) err(where, `type "${r.type}" is not in Store Management → Loại món (add it there first)`);
    else if (category && type.category !== category) err(where, `type ${type.label} belongs to ${type.category}, not ${category}`);

    const price = int(r.price ?? "");
    if (!Number.isInteger(price) || price <= 0) err(where, `price "${r.price}" must be a whole number of VND`);
    let salePrice: number | null = null;
    if (r.sale_price) {
      salePrice = int(r.sale_price);
      if (!Number.isInteger(salePrice) || salePrice <= 0) err(where, `sale_price "${r.sale_price}" must be a whole number of VND`);
      else if (salePrice >= price) err(where, `sale_price ${salePrice} must be below price ${price}`);
    }

    const description = r.description ?? "";
    if (!description) err(where, "description is required");
    else if (description.length < 60) warn(where, `description is short (${description.length} chars)`);

    const tags = list(r.tags ?? "");
    if (!tags.some((t) => /^(men|women|unisex)$/i.test(t))) err(where, "tags need at least one of Men / Women / Unisex");
    const banned = tags.filter((t) => /^(new|sale|best seller|restocked|low stock|sold out)$/i.test(t));
    if (banned.length) err(where, `tags ${banned.join(", ")} are badges, computed automatically — remove them`);

    const sizes = list(r.sizes ?? "");
    if (!sizes.length) err(where, "sizes is required");
    const known = sizesByCategory.get(category) ?? new Map();
    const badSizes = sizes.filter((s) => !known.has(s.toLowerCase()));
    if (category && badSizes.length) err(where, `sizes not defined for ${category}: ${badSizes.join(", ")} (add them in Store Management → Sizes first)`);

    // One "Label: value" per line (Alt+Enter in the cell); commas inside a value are fine.
    const details = (r.details ?? "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean).map((line) => {
      const i = line.indexOf(":");
      return i > 0 ? { label: line.slice(0, i).trim(), value: line.slice(i + 1).trim() } : { label: "", value: line };
    });
    const badDetails = details.filter((d) => !d.label || !d.value);
    if (badDetails.length) err(where, `details lines must be "Label: value" — check "${badDetails[0].value}"`);
    if (details.length < 3) warn(where, `only ${details.length} detail line(s); 3–5 expected`);

    // images
    const dir = path.join(imagesDir, id);
    const images: ProductRow["images"] = [];
    if (!fs.existsSync(dir)) err(where, `image folder not found: ${dir}`);
    else {
      for (const f of fs.readdirSync(dir).filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase())).sort(natural)) {
        const size = fs.statSync(path.join(dir, f)).size;
        if (size > IMAGE_MAX_BYTES) err(where, `${f} is ${(size / 1024 / 1024).toFixed(1)} MB — max 4 MB, resize it`);
        images.push({ file: path.join(dir, f), size });
      }
      if (!images.length) err(where, `no images in ${dir}`);
      else if (images.length < 4) warn(where, `only ${images.length} image(s); 4+ recommended`);
    }

    products.push({ row: Number(r._row), id, name, brand, category, typeCode: type?.code ?? "", typeId: type?.id ?? 0, price, salePrice, description, tags, sizes, details, modelFitNote: r.model_fit_note ?? "", owner: r.owner ?? "", images });
  }

  // batches
  const byId = new Map(products.map((p) => [p.id, p]));
  const batches: BatchRow[] = [];
  for (const r of rawBatches) {
    const where = `batches row ${r._row}`;
    if (/VÍ DỤ|VI DU/i.test(r.notes ?? "")) { warn(where, "example row skipped"); continue; }
    const id = (r.id ?? "").toLowerCase();
    const p = byId.get(id);
    if (!p) { if (!ownerFilter) err(where, `id "${r.id}" is not in the products sheet`); continue; }
    if (!r.qty && !r.unit_cost && !r.received_at) { warn(where, `empty line for ${id} ${r.size} skipped`); continue; }
    const size = p.sizes.find((s) => s.toLowerCase() === (r.size ?? "").toLowerCase());
    if (!size) err(where, `size "${r.size}" is not in ${id}'s sizes (${p.sizes.join(", ")})`);
    const qty = int(r.qty ?? "");
    if (!Number.isInteger(qty) || qty <= 0) err(where, `qty "${r.qty}" must be a whole number above 0`);
    const unitCost = int(r.unit_cost ?? "");
    if (!Number.isInteger(unitCost) || unitCost <= 0) err(where, `unit_cost "${r.unit_cost}" must be a whole number of VND`);
    else if (unitCost >= p.price) warn(where, `unit_cost ${unitCost} is not below the selling price ${p.price}`);
    const receivedAt = new Date(r.received_at ?? "");
    if (Number.isNaN(receivedAt.getTime())) err(where, `received_at "${r.received_at}" must be YYYY-MM-DD`);
    else if (receivedAt > new Date()) err(where, "received_at is in the future");
    batches.push({ row: Number(r._row), id, size: size ?? "", qty, unitCost, receivedAt });
  }
  for (const p of products) {
    const covered = new Set(batches.filter((b) => b.id === p.id).map((b) => b.size));
    const none = p.sizes.filter((s) => !covered.has(s));
    if (none.length === p.sizes.length) warn(`products row ${p.row}`, `${p.id} has no batches — every size will show Sold out`);
  }

  // already imported?
  const existing = await prisma.product.findMany({ select: { name: true, brand: { select: { name: true } } } });
  const existingKeys = new Set(existing.map((e) => `${e.brand.name}|${e.name}`.toLowerCase()));
  const skip = new Set(products.filter((p) => existingKeys.has(`${p.brand}|${p.name}`.toLowerCase())).map((p) => p.id));
  for (const id of skip) warn(`product ${id}`, "already in the database (same brand + name) — skipped");

  // ─── Report ────────────────────────────────────────────────────────────────
  const todo = products.filter((p) => !skip.has(p.id));
  console.log(`\n${products.length} product row(s), ${batches.length} batch line(s) read from ${path.basename(workbookPath)}${ownerFilter ? ` (owner ${ownerFilter})` : ""}`);
  for (const w of warnings) console.log(`  warn  ${w}`);
  for (const e of errors) console.log(`  ERROR ${e}`);
  if (errors.length) { console.log(`\n${errors.length} error(s) — nothing written. Fix the workbook and run again.`); process.exit(1); }
  if (!todo.length) { console.log("\nNothing new to import."); return; }
  if (!cloudinaryConfigured) { console.log("\nCloudinary is not configured (CLOUDINARY_* in .env) — cannot upload images."); process.exit(1); }
  if (dryRun) {
    console.log(`\nDry run — would import ${todo.length} product(s), ${todo.reduce((n, p) => n + p.images.length, 0)} image(s), ${batches.filter((b) => !skip.has(b.id)).length} batch line(s):`);
    for (const p of todo) console.log(`  ${p.id.padEnd(12)} ${p.brand} · ${p.name} · ${p.category}/${p.typeCode} · ${p.sizes.join(",")} · ${p.images.length} img · ${batches.filter((b) => b.id === p.id).reduce((n, b) => n + b.qty, 0)} units`);
    return;
  }

  // ─── Write ─────────────────────────────────────────────────────────────────
  for (const p of todo) {
    process.stdout.write(`${p.id.padEnd(12)} uploading ${p.images.length} image(s)… `);
    const images: { url: string; alt: string }[] = [];
    for (const [i, im] of p.images.entries()) {
      const ext = path.extname(im.file).toLowerCase();
      const file = new File([fs.readFileSync(im.file)], path.basename(im.file), { type: MIME[ext] ?? "image/jpeg" });
      const up = await uploadProductImage(file, `clothse/products/${p.id}`);
      images.push({ url: up.url, alt: i === 0 ? p.name : `${p.name} — view ${i + 1}` });
    }

    const brand = await prisma.brand.upsert({ where: { name: p.brand }, update: {}, create: { name: p.brand } });
    const categoryId = categoryIds.get(p.category)!;
    const sizeIds = sizesByCategory.get(p.category)!;
    const tagIds = await Promise.all(p.tags.map((n) => prisma.tag.upsert({ where: { name: n }, update: {}, create: { name: n }, select: { id: true } })));
    const sku = await nextSku(p.typeCode);

    const product = await prisma.product.create({
      data: {
        name: p.name,
        sku,
        typeId: p.typeId,
        brandId: brand.id,
        categoryId,
        price: p.price,
        salePrice: p.salePrice,
        onSale: p.salePrice !== null,
        description: p.description,
        details: p.details,
        modelFitNote: p.modelFitNote || null,
        tags: { create: tagIds.map((t) => ({ tagId: t.id })) },
        images: { create: images.map((im, i) => ({ url: im.url, alt: im.alt, sortOrder: i + 1 })) },
        variants: { create: p.sizes.map((s) => ({ sizeOptionId: sizeIds.get(s.toLowerCase())!, stock: 0 })) },
      },
      include: { variants: { include: { sizeOption: true } } },
    });

    // Opening stock straight into the ledger (FIFO by receivedAt), no restock flag.
    let units = 0;
    for (const b of batches.filter((b) => b.id === p.id)) {
      const v = product.variants.find((v) => v.sizeOption.label.toLowerCase() === b.size.toLowerCase())!;
      await prisma.batch.create({ data: { variantId: v.id, brandId: brand.id, categoryId, sizeOptionId: v.sizeOptionId, receivedAt: b.receivedAt, qtyReceived: b.qty, qtyRemaining: b.qty, unitCost: b.unitCost } });
      await prisma.variant.update({ where: { id: v.id }, data: { stock: { increment: b.qty } } });
      units += b.qty;
    }
    console.log(`${sku} · ${units} units`);
  }
  console.log(`\nImported ${todo.length} product(s).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
