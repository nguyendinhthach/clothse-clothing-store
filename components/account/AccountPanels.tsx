"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { changePasswordAction, deleteAddressAction, saveAddressAction, setDefaultAddressAction, updateProfileAction, type AccountState } from "@/lib/actions/account";
import { PASSWORD_MIN } from "@/lib/auth-rules";
import type { AddressInput } from "@/lib/services/addresses";
import styles from "./account.module.css";

// ─── Profile ──────────────────────────────────────────────────────────────────

export function ProfilePanel({ user }: { user: { name: string; email: string; phone: string; initials: string } }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(updateProfileAction, {});
  return (
    <form action={action} className={styles.card}>
      <h2 className={styles.h2}>Profile</h2>
      <p className={styles.lead}>Your details are used for order confirmations and delivery notes.</p>
      <div className={styles.avatarRow}>
        <span className={styles.avatar}>{user.initials}</span>
        <span className={styles.hint}>Initials are shown in the header — a profile photo is not part of this release.</span>
      </div>
      <div className={styles.fields}>
        <label className={styles.field}><span className={styles.label}>Full name</span><input name="name" defaultValue={user.name} required autoComplete="name" className={styles.input} /></label>
        <label className={styles.field}><span className={styles.label}>Email</span><input name="email" type="email" defaultValue={user.email} required autoComplete="email" className={styles.input} /></label>
        <label className={styles.field}><span className={styles.label}>Phone number</span><input name="phone" type="tel" defaultValue={user.phone} placeholder="+84 90 000 0000" autoComplete="tel" className={styles.input} /></label>
      </div>
      <div className={styles.actions}>
        <button type="submit" disabled={pending} className={styles.primary}>{pending ? "Saving…" : "Save changes"}</button>
        <span className={`${styles.note} ${state.error ? styles.noteErr : state.done ? styles.noteOk : ""}`}>{state.error ?? state.done ?? "Changes apply to future orders"}</span>
      </div>
    </form>
  );
}

// ─── Addresses ────────────────────────────────────────────────────────────────

export interface AddressItem {
  id: number;
  label: string;
  name: string;
  phone: string;
  line: string;
  city: string;
  isDefault: boolean;
}

const EMPTY: AddressInput = { label: "", name: "", phone: "", line: "", city: "", isDefault: false };

export function AddressesPanel({ addresses, defaultName }: { addresses: AddressItem[]; defaultName: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<AddressInput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, onOk?: () => void) =>
    start(async () => {
      const r = await fn();
      setError(r.ok ? null : (r.error ?? "Something went wrong."));
      if (r.ok) onOk?.();
      router.refresh();
    });
  const openNew = () => { setForm({ ...EMPTY, name: defaultName, isDefault: addresses.length === 0 }); setError(null); };

  return (
    <div className={styles.stack}>
      <div className={`${styles.card} ${styles.cardRow}`}>
        <div>
          <h2 className={styles.h2}>Addresses</h2>
          <p className={styles.lead} style={{ margin: 0 }}>Saved destinations. The default is pre-selected at checkout.</p>
        </div>
        {addresses.length > 0 && <button type="button" onClick={openNew} className={styles.ghost}>+ Add address</button>}
      </div>
      {error && <div className={styles.error} role="alert">{error}</div>}

      {form && (
        <form
          className={`${styles.card} ${styles.cardRaised}`}
          onSubmit={(e) => { e.preventDefault(); run(() => saveAddressAction(form), () => setForm(null)); }}
        >
          <div className={styles.formHead}>
            <h3 className={styles.h3}>{form.id ? "Edit address" : "New address"}</h3>
            <button type="button" onClick={() => setForm(null)} aria-label="Close" className={styles.close}>✕</button>
          </div>
          <div className={styles.fields}>
            <label className={styles.field}><span className={styles.label}>Label</span><input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Home, Work, Studio…" className={styles.input} /></label>
            <label className={styles.field}><span className={styles.label}>Full name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={styles.input} /></label>
            <label className={styles.field}><span className={styles.label}>Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+84 90 000 0000" required inputMode="tel" className={styles.input} /></label>
            <label className={`${styles.field} ${styles.wide}`}><span className={styles.label}>Address line</span><input value={form.line} onChange={(e) => setForm({ ...form, line: e.target.value })} placeholder="Street, number, apartment" required className={styles.input} /></label>
            <label className={`${styles.field} ${styles.wide}`}><span className={styles.label}>City / province</span><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Phường 1, Đà Lạt 670000" required className={styles.input} /></label>
          </div>
          <label className={styles.check}>
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            Set as default address
          </label>
          <div className={styles.actions}>
            <button type="submit" disabled={pending} className={styles.primary}>{pending ? "Saving…" : form.id ? "Save address" : "Add address"}</button>
            <button type="button" onClick={() => setForm(null)} className={styles.ghost}>Cancel</button>
          </div>
        </form>
      )}

      {addresses.map((a) => (
        <div key={a.id} className={`${styles.card} ${styles.addressCard} ${a.isDefault ? styles.addressDefault : ""}`}>
          <div className={styles.addressLeft}>
            <div className={styles.addressTitle}>
              <span className={styles.addressLabel}>{a.label}</span>
              {a.isDefault && <span className={styles.defaultTag}>Default</span>}
            </div>
            <span className={styles.addressName}>{a.name}</span>
            <span className={styles.addressPhone}>{a.phone}</span>
          </div>
          <div className={styles.addressRight}>
            <p className={styles.addressFull}>{a.line} — {a.city}, Vietnam</p>
            <div className={styles.btnRow}>
              <button type="button" onClick={() => { setForm({ ...a }); setError(null); }} className={styles.small}>Edit</button>
              <button type="button" disabled={pending} onClick={() => { if (confirm(`Delete "${a.label}"?`)) run(() => deleteAddressAction(a.id)); }} className={`${styles.small} ${styles.smallDanger}`}>Delete</button>
              {!a.isDefault && <button type="button" disabled={pending} onClick={() => run(() => setDefaultAddressAction(a.id))} className={`${styles.small} ${styles.smallDashed}`}>Make default</button>}
            </div>
          </div>
        </div>
      ))}

      {addresses.length === 0 && !form && (
        <div className={styles.empty}>
          <span className={styles.emptyKicker}>No addresses saved</span>
          <h3 className={styles.emptyTitle}>Nowhere to ship yet</h3>
          <p className={styles.lead} style={{ margin: 0, textAlign: "center" }}>Add a delivery address and checkout gets a whole lot faster next time.</p>
          <button type="button" onClick={openNew} className={styles.primary} style={{ marginTop: 8 }}>Add your first address</button>
        </div>
      )}
    </div>
  );
}

// ─── Password ─────────────────────────────────────────────────────────────────

export function SecurityPanel() {
  const [state, action, pending] = useActionState<AccountState, FormData>(changePasswordAction, {});
  return (
    <form action={action} className={styles.card}>
      <h2 className={styles.h2}>Password &amp; security</h2>
      <p className={styles.lead}>Use at least {PASSWORD_MIN} characters. You stay signed in on this device after changing it.</p>
      <div className={styles.fields} style={{ maxWidth: 460 }}>
        <label className={`${styles.field} ${styles.wide}`}><span className={styles.label}>Current password</span><input name="current" type="password" required autoComplete="current-password" placeholder="••••••••" className={styles.input} /></label>
        <label className={`${styles.field} ${styles.wide}`}><span className={styles.label}>New password</span><input name="next" type="password" required minLength={PASSWORD_MIN} autoComplete="new-password" placeholder="••••••••" className={styles.input} /></label>
        <label className={`${styles.field} ${styles.wide}`}><span className={styles.label}>Confirm new password</span><input name="confirm" type="password" required minLength={PASSWORD_MIN} autoComplete="new-password" placeholder="••••••••" className={styles.input} /></label>
      </div>
      <div className={styles.actions}>
        <button type="submit" disabled={pending} className={styles.primary}>{pending ? "Updating…" : "Update password"}</button>
        <span className={`${styles.note} ${state.error ? styles.noteErr : state.done ? styles.noteOk : ""}`}>{state.error ?? state.done ?? "Pick something you don't use elsewhere"}</span>
      </div>
    </form>
  );
}
