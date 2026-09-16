# ClothSE

Cửa hàng quần áo streetwear — bài tập nhóm môn Phân tích & Thiết kế Phần mềm.
Nghiệp vụ và mọi quyết định nằm trong [SPEC.md](SPEC.md). Thiết kế gốc (đóng băng) nằm trong [design/](design/).

Stack: Next.js 16 (App Router, TypeScript) · Prisma 7 · PostgreSQL · Auth.js · Cloudinary · Nodemailer · Vercel.

## Chạy local

Cần Node 20+. Không cần cài PostgreSQL.

```bash
npm install                 # cũng chạy prisma generate
cp .env.example .env        # rồi điền theo hướng dẫn trong file
```

Mở **hai** terminal:

```bash
npx prisma dev              # 1. Postgres local — in ra DATABASE_URL, dán vào .env
npm run dev                 # 2. web tại http://localhost:3000
```

Lần đầu (hoặc sau khi xoá DB):

```bash
npm run db:migrate          # tạo bảng
npm run db:seed             # nạp dữ liệu mẫu + 2 tài khoản demo (từ .env)
```

Xem dữ liệu bằng giao diện: `npm run db:studio`.

## Lệnh hay dùng

| Lệnh | Việc |
|---|---|
| `npm run db:migrate` | Sau khi sửa `prisma/schema.prisma` — tạo migration mới và apply |
| `npm run db:seed` | Nạp lại dữ liệu mẫu (chạy lại bao nhiêu lần cũng ra cùng số liệu) |
| `npx prisma migrate reset` | Xoá sạch DB, chạy lại mọi migration, seed lại |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Kiểm tra type |

## Deploy (Vercel + Neon)

1. Tạo database PostgreSQL free tại [neon.tech](https://neon.tech), lấy connection string.
2. Trên [vercel.com](https://vercel.com) → Add New Project → import repo GitHub này.
3. Environment Variables: thêm `DATABASE_URL` (và sau này các biến khác trong `.env.example`).
4. Deploy. `npm run build` tự chạy `prisma migrate deploy` trước `next build`, nên bảng luôn khớp code.
5. Nạp dữ liệu mẫu lên Neon **một lần**, chạy từ máy local:

   ```powershell
   $env:DATABASE_URL = "<chuỗi kết nối Neon>"; npm run db:seed
   ```

Từ đó mỗi lần push lên `main`, Vercel tự build và deploy.

## Cấu trúc

```
app/            routes (Next.js App Router)
design/         file thiết kế .dc.html — chỉ đọc, không sửa tay
lib/prisma.ts   Prisma Client dùng chung
lib/generated/  Prisma Client sinh tự động (gitignored)
prisma/         schema, migrations, seed
SPEC.md         đặc tả nghiệp vụ
```
