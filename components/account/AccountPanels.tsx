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
      <h2 className={styles.h2}>Hồ sơ</h2>
      <p className={styles.lead}>Thông tin này dùng để xác nhận đơn và ghi chú giao hàng.</p>
      <div className={styles.avatarRow}>
        <span className={styles.avatar}>{user.initials}</span>
        <span className={styles.hint}>Chữ viết tắt hiện trên header — bản này chưa có ảnh đại diện.</span>
      </div>
      <div className={styles.fields}>
        <label className={styles.field}><span className={styles.label}>Họ tên</span><input name="name" defaultValue={user.name} required autoComplete="name" className={styles.input} /></label>
        <label className={styles.field}><span className={styles.label}>Email</span><input name="email" type="email" defaultValue={user.email} required autoComplete="email" className={styles.input} /></label>
        <label className={styles.field}><span className={styles.label}>Số điện thoại</span><input name="phone" type="tel" defaultValue={user.phone} placeholder="+84 90 000 0000" autoComplete="tel" className={styles.input} /></label>
      </div>
      <div className={styles.actions}>
        <button type="submit" disabled={pending} className={styles.primary}>{pending ? "Đang lưu…" : "Lưu thay đổi"}</button>
        <span className={`${styles.note} ${state.error ? styles.noteErr : state.done ? styles.noteOk : ""}`}>{state.error ?? state.done ?? "Áp dụng cho các đơn sau"}</span>
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
      setError(r.ok ? null : (r.error ?? "Có lỗi xảy ra, thử lại nhé."));
      if (r.ok) onOk?.();
      router.refresh();
    });
  const openNew = () => { setForm({ ...EMPTY, name: defaultName, isDefault: addresses.length === 0 }); setError(null); };

  return (
    <div className={styles.stack}>
      <div className={`${styles.card} ${styles.cardRow}`}>
        <div>
          <h2 className={styles.h2}>Địa chỉ</h2>
          <p className={styles.lead} style={{ margin: 0 }}>Địa chỉ đã lưu. Địa chỉ mặc định được điền sẵn khi thanh toán.</p>
        </div>
        {addresses.length > 0 && <button type="button" onClick={openNew} className={styles.ghost}>+ Thêm địa chỉ</button>}
      </div>
      {error && <div className={styles.error} role="alert">{error}</div>}

      {form && (
        <form
          className={`${styles.card} ${styles.cardRaised}`}
          onSubmit={(e) => { e.preventDefault(); run(() => saveAddressAction(form), () => setForm(null)); }}
        >
          <div className={styles.formHead}>
            <h3 className={styles.h3}>{form.id ? "Sửa địa chỉ" : "Địa chỉ mới"}</h3>
            <button type="button" onClick={() => setForm(null)} aria-label="Đóng" className={styles.close}>✕</button>
          </div>
          <div className={styles.fields}>
            <label className={styles.field}><span className={styles.label}>Tên gợi nhớ</span><input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Nhà, Công ty, Studio…" className={styles.input} /></label>
            <label className={styles.field}><span className={styles.label}>Họ tên</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={styles.input} /></label>
            <label className={styles.field}><span className={styles.label}>Số điện thoại</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+84 90 000 0000" required inputMode="tel" className={styles.input} /></label>
            <label className={`${styles.field} ${styles.wide}`}><span className={styles.label}>Địa chỉ</span><input value={form.line} onChange={(e) => setForm({ ...form, line: e.target.value })} placeholder="Số nhà, đường, căn hộ" required className={styles.input} /></label>
            <label className={`${styles.field} ${styles.wide}`}><span className={styles.label}>Phường/xã, tỉnh/thành</span><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Phường 1, Đà Lạt 670000" required className={styles.input} /></label>
          </div>
          <label className={styles.check}>
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            Đặt làm địa chỉ mặc định
          </label>
          <div className={styles.actions}>
            <button type="submit" disabled={pending} className={styles.primary}>{pending ? "Đang lưu…" : form.id ? "Lưu địa chỉ" : "Thêm địa chỉ"}</button>
            <button type="button" onClick={() => setForm(null)} className={styles.ghost}>Huỷ</button>
          </div>
        </form>
      )}

      {addresses.map((a) => (
        <div key={a.id} className={`${styles.card} ${styles.addressCard} ${a.isDefault ? styles.addressDefault : ""}`}>
          <div className={styles.addressLeft}>
            <div className={styles.addressTitle}>
              <span className={styles.addressLabel}>{a.label}</span>
              {a.isDefault && <span className={styles.defaultTag}>Mặc định</span>}
            </div>
            <span className={styles.addressName}>{a.name}</span>
            <span className={styles.addressPhone}>{a.phone}</span>
          </div>
          <div className={styles.addressRight}>
            <p className={styles.addressFull}>{a.line} — {a.city}</p>
            <div className={styles.btnRow}>
              <button type="button" onClick={() => { setForm({ ...a }); setError(null); }} className={styles.small}>Sửa</button>
              <button type="button" disabled={pending} onClick={() => { if (confirm(`Xoá địa chỉ "${a.label}"?`)) run(() => deleteAddressAction(a.id)); }} className={`${styles.small} ${styles.smallDanger}`}>Xoá</button>
              {!a.isDefault && <button type="button" disabled={pending} onClick={() => run(() => setDefaultAddressAction(a.id))} className={`${styles.small} ${styles.smallDashed}`}>Đặt mặc định</button>}
            </div>
          </div>
        </div>
      ))}

      {addresses.length === 0 && !form && (
        <div className={styles.empty}>
          <span className={styles.emptyKicker}>Chưa có địa chỉ</span>
          <h3 className={styles.emptyTitle}>Chưa biết giao đi đâu</h3>
          <p className={styles.lead} style={{ margin: 0, textAlign: "center" }}>Thêm một địa chỉ giao hàng, lần sau thanh toán nhanh hơn nhiều.</p>
          <button type="button" onClick={openNew} className={styles.primary} style={{ marginTop: 8 }}>Thêm địa chỉ đầu tiên</button>
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
      <h2 className={styles.h2}>Mật khẩu &amp; bảo mật</h2>
      <p className={styles.lead}>Ít nhất {PASSWORD_MIN} ký tự. Đổi xong bạn vẫn đăng nhập trên thiết bị này.</p>
      <div className={styles.fields} style={{ maxWidth: 460 }}>
        <label className={`${styles.field} ${styles.wide}`}><span className={styles.label}>Mật khẩu hiện tại</span><input name="current" type="password" required autoComplete="current-password" placeholder="••••••••" className={styles.input} /></label>
        <label className={`${styles.field} ${styles.wide}`}><span className={styles.label}>Mật khẩu mới</span><input name="next" type="password" required minLength={PASSWORD_MIN} autoComplete="new-password" placeholder="••••••••" className={styles.input} /></label>
        <label className={`${styles.field} ${styles.wide}`}><span className={styles.label}>Nhập lại mật khẩu mới</span><input name="confirm" type="password" required minLength={PASSWORD_MIN} autoComplete="new-password" placeholder="••••••••" className={styles.input} /></label>
      </div>
      <div className={styles.actions}>
        <button type="submit" disabled={pending} className={styles.primary}>{pending ? "Đang đổi…" : "Đổi mật khẩu"}</button>
        <span className={`${styles.note} ${state.error ? styles.noteErr : state.done ? styles.noteOk : ""}`}>{state.error ?? state.done ?? "Chọn mật khẩu bạn chưa dùng ở đâu khác"}</span>
      </div>
    </form>
  );
}
