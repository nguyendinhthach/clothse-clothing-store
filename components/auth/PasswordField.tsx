"use client";

import { useState } from "react";
import styles from "./auth.module.css";

interface Props {
  name: string;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  /** Show the strength meter (Reset Password). */
  meter?: boolean;
}

function score(pw: string) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}
const META = [
  { label: "Quá ngắn", color: "#8A83A0" },
  { label: "Yếu", color: "var(--orange)" },
  { label: "Tạm", color: "var(--orange)" },
  { label: "Khá", color: "var(--accent)" },
  { label: "Mạnh", color: "var(--accent)" },
];

export function PasswordField({ name, label, placeholder = "••••••••", autoComplete, minLength, meter }: Props) {
  const [reveal, setReveal] = useState(false);
  const [value, setValue] = useState("");
  const sc = score(value);
  const m = META[sc];

  return (
    <label className={styles.field}>
      <span className={styles.label}>
        <span>{label}</span>
        <button type="button" onClick={() => setReveal((v) => !v)} className={styles.reveal}>
          {reveal ? "Ẩn" : "Hiện"}
        </button>
      </span>
      <input
        type={reveal ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        required
        className={styles.input}
        onChange={meter ? (e) => setValue(e.target.value) : undefined}
      />
      {meter && (
        <span className={styles.meter}>
          <span className={styles.bars}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={styles.bar} style={i < sc ? { background: m.color } : undefined} />
            ))}
          </span>
          <span className={styles.meterLabel} style={{ color: value ? m.color : "#8A83A0" }}>
            {value ? m.label : "Độ mạnh"}
          </span>
        </span>
      )}
    </label>
  );
}
