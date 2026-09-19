# ClothSE — Cửa hàng streetwear đa thương hiệu

Website bán quần áo streetwear tại Đà Lạt: khách xem, lọc, lưu yêu thích, đặt hàng (thanh toán khi nhận), theo dõi đơn; chủ cửa hàng quản lý kho, sản phẩm, đơn hàng và doanh thu qua trang **Store Management**.

Bài tập nhóm môn **Phân tích & Thiết kế Phần mềm**. Đặc tả nghiệp vụ và mọi quyết định thiết kế nằm trong [SPEC.md](SPEC.md); bản thiết kế giao diện gốc (chỉ đọc) nằm trong [design/](design/).

## Thành viên

| MSSV | Họ tên |
|---|---|
| 2314506 | Nguyễn Đình Thạch |
| 2312718 | Phạm Nguyễn Ngọc Phước |
| 2312729 | Nguyễn Văn Quốc |
| 2312691 | Nguyễn Thành Minh |

## Tính năng

**Phía khách**
- Trang chủ, Cửa hàng (lọc theo danh mục, loại món, hãng, tag, khoảng giá; sắp xếp; tìm kiếm), Hàng mới, Sale
- Trang sản phẩm: ảnh, chọn size theo tồn thực, hướng dẫn size, chi tiết, gợi ý sản phẩm liên quan
- Badge tự tính: Mới · Sale · Bán chạy · Có hàng lại · Sắp hết · Hết hàng
- Tài khoản: đăng ký / đăng nhập, quên & đặt lại mật khẩu qua email, hồ sơ, sổ địa chỉ
- Giỏ hàng, thanh toán COD (miễn ship từ 1.000.000₫), theo dõi đơn qua 6 trạng thái, huỷ đơn, yêu cầu đổi trả trong 30 ngày
- Yêu thích với báo tin khi có hàng lại / giảm giá; đăng ký nhận tin
- Trang Về ClothSE, Liên hệ (gửi mail), FAQ, Điều khoản, Bảo mật

**Store Management (admin)**
- Tổng quan: doanh thu tháng, đơn chờ xác nhận, size sắp hết, đơn gần đây, bán chạy
- Doanh thu theo tuần / tháng / năm / tuỳ chọn: doanh thu, giá vốn (FIFO), lợi nhuận, biên; theo hãng, theo danh mục, biên theo sản phẩm
- Kho: nhập lô theo size và giá vốn, gắn lô vào sản phẩm, lịch sử nhập từng size
- Sản phẩm: tạo / sửa, ảnh (Cloudinary), size, tag, sale, lấy hàng từ kho lên kệ; gỡ khỏi kệ / lên kệ lại; xoá (chỉ sản phẩm chưa từng dùng)
- Từ vựng tự quản: Hãng, Size theo danh mục, Loại món (sinh SKU `CSE-<mã>-<số>`)
- Đơn hàng: hàng chờ theo trạng thái, xác nhận → gửi → giao, huỷ, duyệt đổi trả

## Công nghệ

| Lớp | Công nghệ |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions), React 19, TypeScript |
| Giao diện | CSS Modules, font Space Grotesk · Playfair Display · JetBrains Mono |
| ORM / CSDL | [Prisma 7](https://www.prisma.io) · PostgreSQL trên [Neon](https://neon.tech) |
| Xác thực | [Auth.js v5](https://authjs.dev) (Credentials, JWT session), bcrypt |
| Ảnh | [Cloudinary](https://cloudinary.com) |
| Email | Nodemailer qua Gmail SMTP |
| Nhập liệu | ExcelJS (nhập sản phẩm từ file `.xlsx`) |
| Triển khai | [Vercel](https://vercel.com) |

## Cài đặt

Yêu cầu: **Node.js 20+**, tài khoản Neon (miễn phí). Không cần cài PostgreSQL cục bộ.

```bash
git clone https://github.com/nguyendinhthach/clothse-clothing-store.git
cd clothse-clothing-store
npm install                 # cũng sinh Prisma Client
cp .env.example .env        # điền theo hướng dẫn trong file
```

Các biến trong `.env`:

| Biến | Bắt buộc | Ghi chú |
|---|---|---|
| `DATABASE_URL` | ✔ | Chuỗi kết nối Neon (pooler, `sslmode=verify-full`) |
| `AUTH_SECRET` | ✔ | Chuỗi ngẫu nhiên ký cookie phiên |
| `APP_URL` | ✔ | Origin công khai, dùng trong link email (`http://localhost:3000` khi chạy local) |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | ✔ | Tài khoản admin do `db:seed` tạo |
| `TZ` | khuyên dùng | `Asia/Ho_Chi_Minh` để báo cáo tháng/tuần tính theo giờ Việt Nam |
| `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `CONTACT_TO` | tuỳ chọn | Gmail App Password; để trống thì email in ra console |
| `CLOUDINARY_*` | tuỳ chọn | Để trống thì không tải được ảnh sản phẩm (vẫn lưu được sản phẩm) |

Khởi tạo cơ sở dữ liệu rồi chạy:

```bash
npm run db:migrate          # tạo bảng
npm run db:seed             # khung: danh mục, size, tag, loại món + tài khoản admin
npm run dev                 # http://localhost:3000
```

Muốn có dữ liệu mẫu để xem thử (24 sản phẩm, lô nhập, đơn hàng, một khách demo `mai.tran@clothse.test` / `clothse123`):

```bash
npm run db:seed:demo        # XOÁ sản phẩm/đơn hiện có rồi nạp lại — không dùng trên dữ liệu thật
```

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy dev server |
| `npm run build` / `npm start` | Build production (tự `prisma migrate deploy`) và chạy |
| `npm run lint` · `npx tsc --noEmit` | ESLint · kiểm tra type |
| `npm run db:migrate` | Tạo và áp migration sau khi sửa `prisma/schema.prisma` |
| `npm run db:seed` | Nạp khung + admin (an toàn trên DB đang dùng) |
| `npm run db:seed:demo` | Nạp dữ liệu mẫu (xoá sản phẩm/đơn cũ) |
| `npm run db:studio` | Xem/sửa dữ liệu bằng Prisma Studio |
| `npm run db:import -- <file.xlsx> <thư-mục-ảnh> [--dry-run] [--owner <tên>]` | Nhập sản phẩm hàng loạt (xem dưới) |
| `npx prisma migrate reset` | Xoá sạch DB, chạy lại migration và seed khung |

## Nhập sản phẩm từ Excel

Dùng khi khởi tạo kho với nhiều mã cùng lúc. File `.xlsx` gồm sheet `products` và `batches`; ảnh đặt trong `<thư-mục-ảnh>/<id>/` (ảnh đầu theo tên file là ảnh bìa).

```bash
npm run db:import -- clothse-products.xlsx ./images --dry-run   # chỉ kiểm tra, in lỗi từng dòng
npm run db:import -- clothse-products.xlsx ./images             # tải ảnh lên Cloudinary và ghi DB
```

- Cột `type` phải khớp tên hoặc mã trong **Store Management → Loại món**; cột `category` là một trong 4 danh mục; size phải có trong tab Size của danh mục đó.
- Có lỗi ở bất kỳ dòng nào thì không ghi gì. Sản phẩm đã tồn tại (trùng hãng + tên) được bỏ qua, nên chạy lại an toàn.
- SKU sinh tự động từ loại món; file xlsx và ảnh không cần đưa vào repo.

## Triển khai (Vercel + Neon)

1. Import repo vào Vercel.
2. Khai báo Environment Variables theo bảng ở trên (dùng `AUTH_SECRET` mới, `APP_URL` là domain Vercel, `TZ=Asia/Ho_Chi_Minh`).
3. Deploy — `npm run build` chạy `prisma migrate deploy` trước `next build` nên schema luôn khớp code.
4. Lần đầu, từ máy local với cùng `DATABASE_URL`: `npm run db:seed` để có khung và admin, rồi nhập hàng bằng `db:import` (hoặc `db:seed:demo` nếu chỉ cần dữ liệu mẫu).

Sau đó mỗi lần push lên `main`, Vercel tự build và deploy.

## Cấu trúc thư mục

```
app/
  (site)/         trang khách: trang chủ, cửa hàng, sản phẩm, giỏ, tài khoản, trang tĩnh
  (auth)/         đăng nhập, đăng ký, quên / đặt lại mật khẩu
  (admin)/admin/  Store Management (7 tab)
  api/auth/       Auth.js route handler
components/       UI theo khu vực (home, shop, product, bag, account, admin, layout…), CSS Modules
lib/
  routes.ts       mọi URL nội bộ
  services/       nghiệp vụ → Prisma (catalog, orders, users, admin/*)
  actions/        Server Actions: kiểm tra phiên, gọi services, revalidate
  badges.ts       quy tắc badge · catalog-constants.ts nhãn tiếng Việt cho khoá DB
  auth.ts · session.ts · prisma.ts · mail.ts · cloudinary.ts
prisma/
  schema.prisma   18 bảng · migrations/ · seed.ts · import-xlsx.ts
design/           thiết kế gốc (.dc.html) — chỉ đọc
SPEC.md           đặc tả nghiệp vụ, quyết định, nhật ký thay đổi
```

## Quy ước

- Khoá trong DB và URL giữ tiếng Anh (`Tops`, `Men`, `?cat=Tops`); nhãn hiển thị tiếng Việt qua `categoryLabel()` / `tagLabel()` / `BADGE_LABEL`.
- Tiền lưu số nguyên VND, hiển thị `1.350.000₫`; thời gian lưu UTC, hiển thị giờ Việt Nam.
- Giá vốn theo FIFO: mỗi lô nhập có giá riêng, đơn hàng chốt `unit_cogs` lúc bán để tính lợi nhuận.
