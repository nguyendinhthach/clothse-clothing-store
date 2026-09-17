"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addSizeAction, renameSizeAction, reorderSizesAction, setSizeActiveAction } from "@/lib/actions/admin-vocab";
import styles from "./admin.module.css";

interface Size {
  id: number;
  label: string;
  sortOrder: number;
  active: boolean;
  variants: number;
}
interface Group {
  id: number;
  name: string;
  sizes: Size[];
}

export function SizesPanel({ groups }: { groups: Group[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const total = groups.reduce((n, g) => n + g.sizes.length, 0);
  const off = groups.reduce((n, g) => n + g.sizes.filter((s) => !s.active).length, 0);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await fn();
      setError(r.ok ? null : (r.error ?? "Something went wrong."));
      router.refresh();
    });

  return (
    <div className={styles.stack}>
      <div className={styles.panelHead}>
        <div>
          <h2 className={styles.h2}>Sizes</h2>
          <p className={styles.note}>
            {total} sizes across {groups.length} categories · {total - off} active{off ? ` · ${off} inactive` : ""}
          </p>
        </div>
        <p className={styles.panelHint}>Each category keeps its own size list. Drag to set the order shoppers see; disable a size to hide it from new selections without touching past orders.</p>
      </div>
      {error && <div className={styles.error} role="alert">{error}</div>}

      <div className={styles.sizeGrid}>
        {groups.map((g) => (
          <SizeGroup key={g.id} group={g} pending={pending} run={run} />
        ))}
      </div>
    </div>
  );
}

function SizeGroup({ group: g, pending, run }: { group: Group; pending: boolean; run: (fn: () => Promise<{ ok: boolean; error?: string }>) => void }) {
  const [order, setOrder] = useState<number[] | null>(null); // local order while dragging
  const [dragId, setDragId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  // Fresh server data resets any local drag order.
  const serverKey = g.sizes.map((s) => s.id).join(",");
  const [seenKey, setSeenKey] = useState(serverKey);
  if (seenKey !== serverKey) {
    setSeenKey(serverKey);
    setOrder(null);
  }

  const ids = order ?? g.sizes.map((s) => s.id);
  const byId = new Map(g.sizes.map((s) => [s.id, s]));
  const active = g.sizes.filter((s) => s.active).length;

  function dropOn(targetId: number) {
    if (dragId === null || dragId === targetId) return;
    const next = ids.filter((id) => id !== dragId);
    next.splice(next.indexOf(targetId), 0, dragId);
    setOrder(next);
  }
  function commitOrder() {
    setDragId(null);
    if (order && order.join(",") !== serverKey) run(() => reorderSizesAction(g.id, order));
  }
  function submitAdd() {
    const label = draft.trim();
    if (!label) return;
    run(() => addSizeAction(g.id, label));
    setDraft("");
    setAdding(false);
  }

  return (
    <div className={styles.sizeCard}>
      <div className={styles.sizeCardHead}>
        <span className={styles.brandName}>{g.name}</span>
        <span className={styles.brandMeta}>{active} active · {g.sizes.length} total</span>
      </div>
      <div>
        {ids.map((id, i) => {
          const s = byId.get(id)!;
          return (
            <div
              key={s.id}
              draggable
              onDragStart={() => setDragId(s.id)}
              onDragOver={(e) => { e.preventDefault(); dropOn(s.id); }}
              onDrop={(e) => { e.preventDefault(); commitOrder(); }}
              onDragEnd={commitOrder}
              className={`${styles.sizeRow} ${dragId === s.id ? styles.sizeRowDrag : ""} ${s.active ? "" : styles.sizeRowOff}`}
            >
              <span className={styles.grip} aria-hidden="true" title="Drag to reorder">⋮⋮</span>
              <span className={styles.ord}>{String(i + 1).padStart(2, "0")}</span>
              <input
                defaultValue={s.label}
                aria-label="Size label"
                className={styles.sizeInput}
                onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== s.label) run(() => renameSizeAction(s.id, v)); else e.target.value = s.label; }}
                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              />
              <span className={styles.sizeUse} title="Products selling this size">{s.variants > 0 ? `${s.variants} var.` : ""}</span>
              <button type="button" disabled={pending} onClick={() => run(() => setSizeActiveAction(s.id, !s.active))} className={`${styles.togglePill} ${s.active ? styles.togglePillOn : ""}`}>
                {s.active ? "Active" : "Off"}
              </button>
            </div>
          );
        })}
      </div>
      <div className={styles.sizeCardFoot}>
        {adding ? (
          <div className={styles.addRow}>
            <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submitAdd(); if (e.key === "Escape") setAdding(false); }} placeholder="New size label…" aria-label="New size label" className={styles.input} />
            <button type="button" onClick={submitAdd} disabled={pending} className={styles.primaryBtn}>Add</button>
            <button type="button" onClick={() => setAdding(false)} aria-label="Cancel" className={styles.closeBtn}>✕</button>
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className={styles.smallBtn}>+ Add size</button>
        )}
      </div>
    </div>
  );
}
