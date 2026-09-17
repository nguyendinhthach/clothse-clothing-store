import { v2 as cloudinary } from "cloudinary";

// SPEC §6.9 — product images live in object storage; the DB keeps the URL.
const name = process.env.CLOUDINARY_CLOUD_NAME;
const key = process.env.CLOUDINARY_API_KEY;
const secret = process.env.CLOUDINARY_API_SECRET;

export const cloudinaryConfigured = !!(name && key && secret);

if (cloudinaryConfigured) cloudinary.config({ cloud_name: name, api_key: key, api_secret: secret, secure: true });

export const IMAGE_MAX_BYTES = 4 * 1024 * 1024; // design: "max 4MB"

/** Upload one image file; returns the delivery URL (auto format/quality, 4:5 fill for cards is applied at render). */
export async function uploadProductImage(file: File, folder = "clothse/products"): Promise<{ url: string; publicId: string }> {
  if (!cloudinaryConfigured) throw new Error("Cloudinary is not configured (CLOUDINARY_* in .env).");
  if (file.size > IMAGE_MAX_BYTES) throw new Error("Image is over 4 MB.");
  if (!file.type.startsWith("image/")) throw new Error("Only image files are accepted.");
  const buf = Buffer.from(await file.arrayBuffer());
  const res = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder, resource_type: "image", transformation: [{ quality: "auto", fetch_format: "auto" }] }, (err, r) => (err || !r ? reject(err ?? new Error("Upload failed")) : resolve(r))).end(buf);
  });
  return { url: res.secure_url, publicId: res.public_id };
}

export async function deleteImage(publicId: string): Promise<void> {
  if (!cloudinaryConfigured) return;
  await cloudinary.uploader.destroy(publicId).catch(() => undefined);
}

/** Recover the public id from a delivery URL so removed images can be cleaned up. */
export function publicIdFromUrl(url: string): string | null {
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-z0-9]+$/i);
  return m ? m[1] : null;
}
