"use client";

import { useState } from "react";
import type { FaqGroup } from "@/lib/content/faq";
import styles from "./static.module.css";

const pad = (n: number) => String(n).padStart(2, "0");

export function FaqList({ groups }: { groups: FaqGroup[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  return (
    <>
      {groups.map((g, gi) => (
        <section key={g.title} className={styles.faqGroup}>
          <div className={`${styles.sectionHead} ${styles.sectionSticky}`}>
            <span className={styles.index}>{pad(gi + 1)}</span>
            <h2 className={`${styles.h2} ${styles.h2Sm}`}>{g.title}</h2>
          </div>
          <div className={styles.faqList}>
            {g.items.map((it, ii) => {
              const key = `${gi}-${ii}`;
              const isOpen = !!open[key];
              return (
                <div key={key} className={styles.faqItem}>
                  <button type="button" onClick={() => toggle(key)} aria-expanded={isOpen} aria-controls={`faq-${key}`} className={styles.faqQ}>
                    <span>{it.q}</span>
                    <span className={`${styles.faqIcon} ${isOpen ? styles.faqIconOpen : ""}`} aria-hidden="true">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div id={`faq-${key}`} className={styles.faqA}>
                      {it.lines.map((line) => <p key={line}>{line}</p>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
