# ClothSE

Cửa hàng quần áo streetwear — bài tập nhóm môn Phân tích & Thiết kế Phần mềm.
Nghiệp vụ và mọi quyết định nằm trong [SPEC.md](SPEC.md). Thiết kế gốc (đóng băng) nằm trong [design/](design/).

Stack: Next.js 16 (App Router, TypeScript) · Prisma 7 · PostgreSQL (Neon) · Auth.js · Cloudinary · Nodemailer · Vercel.

## Chạy local

Cần Node 20+. Không cần cài PostgreSQL — database nằm trên [Neon](https://neon.tech) (free tier), cả local lẫn Vercel dùng chung.

```bash
npm install                 # cũng chạy prisma generate
cp .env.example .env        # rồi điền theo hướng dẫn trong file (DATABASE_URL của Neon, Gmail, Cloudinary…)
npm run dev                 # web tại http://localhost:3000
```

Lần đầu (hoặc khi DB trống):

```bash
npm run db:migrate          # tạo bảng
npm run db:seed             # nạp dữ liệu mẫu + 2 tài khoản demo (từ .env)
```

Xem/sửa dữ liệu bằng giao diện: `npm run db:studio`.

## Lệnh hay dùng

| Lệnh | Việc |
|---|---|
| `npm run db:migrate` | Sau khi sửa `prisma/schema.prisma` — tạo migration mới và apply |
| `npm run db:seed` | Nạp lại dữ liệu mẫu (chạy lại bao nhiêu lần cũng ra cùng số liệu) |
| `npx prisma migrate reset` | Xoá sạch DB, chạy lại mọi migration, seed lại |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Kiểm tra type |

## Deploy (Vercel + Neon)

1. Trên [vercel.com](https://vercel.com) → Add New Project → import repo GitHub này.
2. Environment Variables: sao chép mọi biến trong `.env.example` (`DATABASE_URL` của Neon, `AUTH_SECRET` mới, `APP_URL` = domain Vercel, SMTP, Cloudinary, SEED_*).
3. Deploy. `npm run build` tự chạy `prisma migrate deploy` trước `next build`, nên bảng luôn khớp code.
4. Nếu DB còn trống, nạp dữ liệu mẫu **một lần** từ máy local: `npm run db:seed` (dùng cùng `DATABASE_URL`).

Từ đó mỗi lần push lên `main`, Vercel tự build và deploy.

## Cấu trúc

```
app/            routes (Next.js App Router): (site) khách hàng, (auth) đăng nhập, (admin) quản trị
components/     UI theo trang, CSS Modules
lib/routes.ts   mọi URL nội bộ
lib/services/   nghiệp vụ → Prisma
lib/actions/    server actions (gọi services, kiểm tra đăng nhập)
lib/prisma.ts   Prisma Client dùng chung
lib/generated/  Prisma Client sinh tự động (gitignored)
prisma/         schema, migrations, seed
design/         file thiết kế .dc.html — chỉ đọc, không sửa tay
SPEC.md         đặc tả nghiệp vụ
```
