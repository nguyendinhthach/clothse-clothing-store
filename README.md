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
npm run db:seed             # khung: danh mục, size, tag, loại món + tài khoản admin (từ .env)
npm run db:seed:demo        # thêm dữ liệu mẫu (24 sản phẩm, lô, đơn, khách demo) — XOÁ sản phẩm/đơn đang có
```

Xem/sửa dữ liệu bằng giao diện: `npm run db:studio`.

## Lệnh hay dùng

| Lệnh | Việc |
|---|---|
| `npm run db:migrate` | Sau khi sửa `prisma/schema.prisma` — tạo migration mới và apply |
| `npm run db:seed` | Khung + admin từ `.env`; an toàn trên DB đang dùng |
| `npm run db:seed:demo` | Dữ liệu mẫu theo thiết kế (xoá sản phẩm/đơn cũ rồi nạp lại) — chỉ khi chưa có hàng thật |
| `npm run db:import -- <file.xlsx> <thư-mục-ảnh> --dry-run` | Nhập sản phẩm nhóm thu thập (xem mục dưới) |
| `npx prisma migrate reset` | Xoá sạch DB, chạy lại mọi migration, seed khung |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Kiểm tra type |

## Nhập sản phẩm từ file của nhóm

File `clothse-products.xlsx` (sheet `products`, `batches`) và thư mục ảnh `<thư-mục-ảnh>/<id>/` (ảnh đầu tiên theo tên file là ảnh bìa).

```bash
npm run db:import -- clothse-products.xlsx ./images --dry-run   # chỉ kiểm tra, in lỗi từng dòng
npm run db:import -- clothse-products.xlsx ./images             # upload ảnh lên Cloudinary + ghi DB
npm run db:import -- clothse-products.xlsx ./images --owner Thach   # chỉ nhập hàng của một người
```

Cột `type` phải khớp tên/mã trong **Store Management → Loại món** (thiếu thì thêm ở đó trước). Có lỗi ở bất kỳ dòng nào thì không ghi gì cả. Sản phẩm đã có (trùng hãng + tên) được bỏ qua nên chạy lại thoải mái.

## Deploy (Vercel + Neon)

1. Trên [vercel.com](https://vercel.com) → Add New Project → import repo GitHub này.
2. Environment Variables: sao chép mọi biến trong `.env.example` (`DATABASE_URL` của Neon, `AUTH_SECRET` mới, `APP_URL` = domain Vercel, `TZ=Asia/Ho_Chi_Minh` để báo cáo tháng/tuần tính theo giờ Việt Nam, SMTP, Cloudinary, `SEED_ADMIN_*`).
3. Deploy. `npm run build` tự chạy `prisma migrate deploy` trước `next build`, nên bảng luôn khớp code.
4. Nếu DB còn trống, từ máy local (cùng `DATABASE_URL`): `npm run db:seed` để có khung + admin, rồi `npm run db:import -- <xlsx> <ảnh>` nạp hàng thật — hoặc `npm run db:seed:demo` nếu chỉ cần dữ liệu mẫu.

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
