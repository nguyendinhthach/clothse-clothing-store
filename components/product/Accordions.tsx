"use client";

import { useState } from "react";
import styles from "./Accordions.module.css";

export interface AccordionSection {
  id: string;
  title: string;
  lines: { label: string; value: string }[];
}

export function Accordions({ sections, initial }: { sections: AccordionSection[]; initial?: string }) {
  const [open, setOpen] = useState<string | null>(initial ?? sections[0]?.id ?? null);
  return (
    <div className={styles.list}>
      {sections.map((s) => {
        const on = open === s.id;
        return (
          <div key={s.id} id={s.id} className={styles.item}>
            <button type="button" onClick={() => setOpen(on ? null : s.id)} aria-expanded={on} className={styles.head}>
              <span>{s.title}</span>
              <span className={`${styles.icon} ${on ? styles.iconOn : ""}`}>+</span>
            </button>
            {on && (
              <div className={styles.body}>
                {s.lines.map((l, i) => (
                  <div key={i} className={styles.line}>
                    <span className={styles.k}>{l.label}</span>
                    <span className={styles.v}>{l.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
