# ClothSE — Đặc tả nghiệp vụ

Bài tập nhóm — website bán quần áo streetwear đa thương hiệu, có trang quản trị.

**Trạng thái:** thiết kế đã rà soát sạch (19 trang, 0 lỗi), 17 quyết định chốt ở [mục 9](#9-quyết-định), công cụ chốt ở [mục 11](#11-công-cụ), lộ trình 6 tuần ở [mục 12](#12-lộ-trình-6-tuần). Sẵn sàng bắt đầu code.

Không còn quyết định treo.

---

## 1. Nguồn yêu cầu

Giao diện đã được thiết kế xong thành 10 trang trong thư mục gốc (`*.dc.html`). **Đây là bản đặc tả giao diện, không phải mã nguồn ứng dụng** — xem [mục 10](#10-quan-hệ-với-file-thiết-kế).

Tài liệu này rút trích phần *nghiệp vụ* từ các trang đó, cộng thêm những quy tắc mà thiết kế chưa nói rõ.

| Trang thiết kế | Vai trò |
|---|---|
| `ClothSE Homepage` | Trang chủ, khối sản phẩm nổi bật |
| `Shop Listing` | Danh sách sản phẩm, lọc và sắp xếp |
| `Product Detail Template` | Chi tiết sản phẩm, chọn size, thêm giỏ |
| `New Arrivals` | Hàng mới trong 30 ngày |
| `Sale` | Hàng giảm giá |
| `Favourites` | Sản phẩm đã lưu |
| `My Bag & Orders` | Giỏ hàng, thanh toán, lịch sử đơn |
| `Sign In & Sign Up` | Đăng nhập, đăng ký |
| `Account` | Hồ sơ, sổ địa chỉ, đổi mật khẩu |
| `Store Management` | 7 màn quản trị (xem mục 4) |

---

## 2. Vai trò người dùng

| Vai trò | Quyền |
|---|---|
| **Khách vãng lai** | Xem sản phẩm, tìm kiếm, lọc. Không đặt hàng được |
| **Thành viên** | Toàn bộ quyền khách + giỏ hàng, đặt hàng, yêu thích, xem đơn của mình, sửa hồ sơ |
| **Quản trị viên** | Toàn bộ quyền thành viên + 7 màn Store Management |

**Vai trò lấy từ `User.role` trong database, kiểm tra ở phía server.** Bản thiết kế đang mô phỏng bằng `localStorage` và so sánh email cứng trong JS — đó là mô phỏng cho prototype, tài khoản admin thật sẽ tạo trong database khi dựng app.

### Tài khoản demo

Hai tài khoản trong bản thiết kế là **dữ liệu demo có chủ đích**, dùng để thử nhanh hai vai trò. Nên seed lại y hệt khi dựng app để phần demo vẫn chạy:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| `admin` | `ngbon2220805@gmail.com` | `123456789` |
| `user` | `mai.tran@clothse.test` | `clothse123` |

Mật khẩu phải **băm** khi lưu vào database, không lưu thẳng như bản thiết kế.

---

## 3. Phạm vi theo đợt

Nhóm đã chốt làm theo đợt. Nguyên tắc: **kết thúc mỗi đợt luôn có một bản chạy được để nộp.**

### Đợt 1 — Bắt buộc

Mục tiêu: luồng mua hàng chạy thật từ đầu đến cuối, dữ liệu lưu vào database.

- Đăng ký, đăng nhập, đăng xuất
- Danh sách sản phẩm: lọc theo danh mục / thương hiệu / tag, sắp xếp, tìm kiếm
- Chi tiết sản phẩm: chọn size, xem tồn kho theo size
- Giỏ hàng: thêm, sửa số lượng, xoá — **lưu bền, không mất khi tải lại trang**
- Đặt hàng: nhập địa chỉ giao, thanh toán tiền mặt khi nhận (COD)
- Xem lịch sử đơn của mình
- Quản trị: CRUD sản phẩm, CRUD thương hiệu, xem và đổi trạng thái đơn
- Upload ảnh sản phẩm, kéo thả đổi thứ tự ([mục 6.9](#69-ảnh-sản-phẩm))
- Quên mật khẩu qua email + form liên hệ gửi về hộp thư shop ([mục 6.10](#610-gửi-email))

### Đợt 2 — Nếu kịp

- Nhập kho theo lô (Storage) + tính giá vốn FIFO
- Màn Revenue: doanh thu, lợi nhuận, biểu đồ theo khoảng thời gian
- Dashboard tổng quan
- Yêu thích (Favourites) + **báo hàng về qua email** ([mục 6.10](#610-gửi-email))
- Đăng ký nhận tin, email chào mừng
- Sổ địa chỉ nhiều mục, đổi mật khẩu
- Bảng size guide theo số đo ([mục 6.6](#66-dữ-liệu-chỉ-để-hiển-thị) — cần xử lý số đo theo danh mục trước)
- Năm trang nội dung tĩnh: FAQ, Contact, About, Privacy, Terms ([mục 6b](#6b-trang-nội-dung-tĩnh))

> **Nút VI/EN:** `lang-switch.js` chỉ ghi lựa chọn vào `localStorage` và bắn sự kiện — **không trang nào lắng nghe**, nên nút này đang là trang trí. Nhóm đã chốt **không làm đa ngôn ngữ**: toàn bộ giao diện dùng **tiếng Việt** (đổi từ tiếng Anh ngày 2026-09-18; font display đổi sang Playfair Display vì Instrument Serif không có glyph tiếng Việt). Xem [mục 8](#8-ngoài-phạm-vi).

---

## 4. Màn quản trị (Store Management)

Bảy mục, đúng theo thiết kế:

| Mục | Nội dung | Đợt |
|---|---|---|
| **Dashboard** | Số liệu tổng quan | 2 |
| **Revenue** | Doanh thu, lợi nhuận theo tuần / tháng / năm / tuỳ chọn | 2 |
| **Brands** | CRUD thương hiệu | 1 |
| **Storage** | Nhập kho theo lô, xem lịch sử giá nhập | 2 |
| **Products** | CRUD sản phẩm, quản lý tồn kho theo size | 1 |
| **Orders** | Danh sách đơn, đổi trạng thái | 1 |
| **Sizes** | Quản lý từ vựng size của từng danh mục — xem [mục 6.5](#65-ba-cấp-của-size) | 1 |

Thứ tự tab trong thiết kế: Dashboard · Revenue · Brands · **Sizes** · Storage · Products · Orders.

---

## 5. Mô hình dữ liệu

### Thực thể

```
User            id, email, password_hash, name, phone, role, created_at
Address         id, user_id, label, name, phone, line, city, is_default
PasswordResetToken
                id, user_id, token_hash, expires_at, used_at, created_at
                                                     ← xem mục 6.10

Brand           id, name
Category        id, name                             ← cố định 4 mục, không CRUD
SizeOption      id, category_id, label, sort_order, active
                                                     ← từ vựng size của danh mục
Tag             id, name                             ← tự do, admin gõ tay,
                                                        xem mục 6.12
ProductTag      product_id, tag_id                   ← nhiều-nhiều
Product         id, name, sku, brand_id, category_id, price, sale_price,
                on_sale, description, created_at, restocked_at,
                                                     ← on_sale, restocked_at:
                                                        xem mục 6.11
                details, model_fit_note, size_guide
                                                     ← 3 trường JSON chỉ để
                                                        hiển thị, xem mục 6.6
ProductImage    id, product_id, url, sort_order, alt
                                                     ← chỉ lưu đường dẫn,
                                                        file nằm ngoài DB,
                                                        xem mục 6.9
Variant         id, product_id, size_option_id, stock
                                                     ← tồn kho nằm ở đây
                                                        không nằm ở Product
                                                        biến thể CHỈ theo size,
                                                        không có màu

Batch           id, variant_id, brand_id, category_id, size_option_id,
                item_description, received_at, qty_received,
                qty_remaining, unit_cost
                                                     ← giá nhập của riêng lô này
                                                        variant_id rỗng = lô chưa
                                                        liên kết, chờ niêm yết;
                                                        brand/category/size ghi
                                                        ngay lúc nhập để Add
                                                        Product khớp được, xem 6.5

Order           id, code, user_id, status, payment_method, payment_status,
                                                     ← hai trục độc lập,
                                                        xem mục 6.2
                subtotal, shipping_fee, total,         ← shipping_fee là ảnh chụp,
                                                          xem mục 6.8
                ship_name, ship_phone, ship_address,   ← chụp lại lúc đặt
                created_at
OrderItem       id, order_id, variant_id, qty, unit_price, unit_cogs
                                                       ← xem mục 6.4

CartItem        id, user_id, variant_id, qty
Favourite       id, user_id, product_id, notify, created_at
                                                     ← theo sản phẩm (quyết định 17);
                                                        notify = bật email
                                                        restock/sale, xem mục 6.10
Subscriber      id, email, unsubscribe_token, created_at
                                                     ← đăng ký bản tin, xem mục 6.10
```

Bản cài đặt thực tế là `prisma/schema.prisma`. Tên trường ở đó viết camelCase (`password_hash` → `passwordHash`), enum viết HOA (`pending` → `PENDING`), `Batch.category` là khoá ngoại `category_id`; ngoài ra một-một với bảng trên. Khi hai bên lệch nhau, sửa SPEC trước rồi mới sửa schema.

### Giá trị cố định

Lấy nguyên từ thiết kế:

- **Danh mục:** `Tops`, `Bottoms`, `Accessories`, `Footwear`
- **Thương hiệu khởi tạo:** `Carhartt`, `Stüssy`, `Nike`, `Champion`
- **Size:** **không cố định** — nằm trong bảng `SizeOption`, admin quản lý qua tab Sizes. Dữ liệu seed khi khởi tạo database:

| Danh mục | Size seed sẵn |
|---|---|
| `Tops` | `XS` `S` `M` `L` `XL` `XXL` |
| `Bottoms` | `XS` `S` `M` `L` `XL` `XXL` |
| `Accessories` | `One size` `S` `M` `L` `XL` |
| `Footwear` | `35` `36` `37` `38` `39` `40` `41` `42` `43` |

**Chính sách định dạng theo danh mục:**

| Danh mục | Định dạng |
|---|---|
| `Tops`, `Bottoms` | Size **chữ**. Quần không dùng số vòng eo |
| `Footwear` | Size **số trần**, không có tiền tố `EU` |
| `Accessories` | **Trộn nhiều định dạng** — `One size`, số, hoặc chữ, tuỳ loại phụ kiện |

Bảng trên chỉ là dữ liệu seed. **Mọi danh mục đều thêm size mới được** qua tab Sizes, kể cả định dạng chưa từng có trong danh mục đó.

Riêng `Accessories` trộn định dạng nên không suy ra được thứ tự tự động — `sort_order` phải do admin tự sắp. Thiết kế đã hỗ trợ kéo thả (`moveSize`), nên thêm một size số vào giữa danh sách chữ vẫn đặt đúng chỗ được.
- **Tag seed:** `Men`, `Women`, `Unisex`, `Limited`, `Organic cotton`, `Waterproof`, `Heavyweight` — chỉ là seed, admin gõ thêm tự do ([mục 6.12](#612-tag)). `TAG_LIBRARY` trong thiết kế còn lẫn `New`, `Restocked`, `Best seller`, `Core`, `Sale` — đó là **badge**, đã tách khỏi tag ở [quyết định 15](#9-quyết-định)
- **Trạng thái đơn** (`status`): `pending`, `processing`, `shipping`, `completed`, `cancelled`, `refund`
  - `pending` hiển thị là **To Confirm** — đổi từ `pay` / *To Pay* của bản thiết kế cũ
- **Trạng thái thanh toán** (`payment_status`): `unpaid`, `paid`, `refunded`
- **Hình thức thanh toán** (`payment_method`): chỉ `COD` — tiền mặt khi nhận hàng

---

## 6. Quy tắc nghiệp vụ

### 6.1 Vòng đời đơn hàng

**Mọi đơn đi chung một đường, không phân biệt hình thức thanh toán.**

```
                    ┌──────────────┐
   Đặt hàng ───────►│  To Confirm  │──────┐   mọi đơn vào đây
                    └──────┬───────┘      │
                           │ admin xác nhận│
                           ▼              │
                    ┌──────────────┐      │   ┌─────────────────┐
                    │  Processing  │──────┤   │ khách tự huỷ    │
                    └──────┬───────┘      │   │ được ở 2 ô này  │
                           │ admin giao   │   └─────────────────┘
        ╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶╶┼╶╶╶╶╶╶╶╶╶╶╶╶╶╶┼╶╶╶╶ ranh giới huỷ / hoàn
                           ▼              │
                    ┌──────────────┐      │
                    │   Shipping   │      │ admin huỷ
                    └──────┬───────┘      │
                           │ giao xong    ▼
                           ▼         ┌───────────┐
                    ┌──────────────┐ │ Cancelled │
                    │  Completed   │ └───────────┘
                    └──────┬───────┘
                           │ khách yêu cầu trả trong 30 ngày
                           ▼
                    ┌──────────────┐
                    │Return/Refund │
                    └──────────────┘
```

**Ai được làm gì:**

| Trạng thái | Khách | Admin |
|---|---|---|
| `To Confirm` | Huỷ được | Xác nhận, huỷ |
| `Processing` | Huỷ được | Chuyển giao hàng, huỷ |
| `Shipping` | **Không huỷ được** | Đánh dấu giao xong |
| `Completed` | Yêu cầu hoàn trong 30 ngày | Duyệt hoàn |

Ranh giới nằm giữa `Processing` và `Shipping`: hàng đã rời kho thì không còn đường huỷ, chỉ còn đường hoàn.

Huỷ ở bất kỳ đâu đều **cộng trả tồn kho** ([mục 6.3](#63-tồn-kho)).

### 6.2 Thanh toán

Không tích hợp cổng thanh toán thật. Không webhook, không tự động đối soát — `payment_status` do admin cập nhật tay.

**Chỉ có một hình thức: COD — trả tiền mặt khi nhận hàng.**

Lý do bỏ chuyển khoản QR: QR mà admin phải mở sao kê ngân hàng đối chiếu tay thì không phải cách web bán hàng thật vận hành — nó chỉ là một ảnh tĩnh cộng một nút bấm tin tưởng lẫn nhau. Muốn nhận tiền online thật thì phải tích hợp cổng thanh toán (VNPay, Momo, Stripe), và điều đó nằm [ngoài phạm vi](#8-ngoài-phạm-vi). Thà làm tốt một luồng còn hơn làm giả hai.

Chỉ còn một hình thức nên **vòng đời tiền rất gọn**: mọi đơn `unpaid` từ lúc đặt, và chỉ thành `paid` đúng một thời điểm — lúc giao hàng thu tiền.

```
To Confirm ──► Processing ──► Shipping ──► Completed
  unpaid        unpaid         unpaid        paid
```

Nút **Xác nhận** của admin ở bước `To Confirm` giờ chỉ mang một nghĩa: *đơn này có thật, đóng gói đi*. Đây là chỗ lọc đơn ảo — vai trò mà ở shop thật thì việc bắt chuyển khoản trước đảm nhiệm.

**Bất biến: đơn `completed` luôn có `payment_status = paid`.** Hai việc "đánh dấu đã giao" và "xác nhận đã thu tiền" là **một thao tác**, không tách rời. Khách từ chối nhận hàng thì đơn sang `cancelled`, không bao giờ `completed` mà chưa trả tiền.

Vì báo cáo chỉ tính đơn `completed` ([mục 6.4](#64-giá-vốn-fifo-và-lợi-nhuận)), bất biến này giữ doanh thu luôn khớp tiền thực thu.

> **Về hai trường `payment_method` và `payment_status`:** cả hai giờ đều suy ra được — `payment_method` chỉ có một giá trị, `payment_status` suy được từ `status`. Vẫn **giữ lại cả hai trong database**, vì thiết kế đã có cờ `paid` và nhãn Paid/Unpaid, và vì đây là đường nâng cấp khi sau này gắn cổng thanh toán thật. Nhưng `payment_status` **do luồng trạng thái đặt, không phải trường admin sửa tay tuỳ ý**.

### 6.3 Tồn kho

Tồn kho nằm ở cấp **Variant** (từng size), không phải cấp Product. Thiết kế đã thể hiện rõ: `sizes: [{ size: 'M', stock: 9 }]`.

**Thời điểm trừ kho:** khi đơn được tạo (`To Confirm`).

Lý do chọn mốc này: tránh việc hai người cùng mua nốt cái cuối. Đổi lại, phải hoàn kho khi đơn bị huỷ.

- Huỷ đơn (`Cancelled`) → cộng trả tồn kho
- Hoàn hàng (`Return/Refund`) → cộng trả tồn kho, và trừ ngược doanh thu + giá vốn khỏi báo cáo

Không cho đặt vượt tồn kho. Nếu tồn kho về 0 thì nút "Thêm vào giỏ" bị khoá.

### 6.4 Giá vốn FIFO và lợi nhuận

**Nhóm đã chốt dùng FIFO theo lô nhập.**

Mỗi lần nhập hàng tạo một `Batch` gắn với một `Variant`, ghi lại số lượng và **đơn giá nhập của riêng lô đó**. Khi bán, trừ kho từ lô cũ nhất trước.

**Ví dụ** (lấy đúng số liệu trong thiết kế, sản phẩm Nike Suede Court Hi size L):

```
Lô 1 — nhập 18/05/2026, 24 cái, giá nhập 1.160.000₫/cái
Lô 2 — nhập 30/06/2026, 48 cái, giá nhập 1.080.000₫/cái

Khách mua 30 cái:
    24 cái lấy từ lô 1  →  24 × 1.160.000 = 27.840.000₫
     6 cái lấy từ lô 2  →   6 × 1.080.000 =  6.480.000₫
    ────────────────────────────────────────────────────
    Giá vốn (COGS)                          34.320.000₫

Lô 1 còn 0, lô 2 còn 42.

Giá bán 1.980.000₫/cái  →  Doanh thu = 30 × 1.980.000 = 59.400.000₫
Lợi nhuận = 59.400.000 − 34.320.000 = 25.080.000₫
```

**Quy tắc bắt buộc — chụp lại giá vốn vào `OrderItem.unit_cogs` ngay lúc trừ kho.**

Đây là chỗ dễ sai nhất. Nếu chỉ lưu `variant_id` rồi sau này mới đi tính giá vốn, bạn sẽ **không tính lại được**, vì các lô hàng đã bị tiêu thụ và giá nhập đã thay đổi. Phải ghi con số giá vốn thực tế vào đơn ngay tại thời điểm bán.

Với đơn mua nhiều cái mà giá vốn lấy từ hai lô khác nhau, `unit_cogs` lưu **giá vốn bình quân của riêng lần bán đó** (ở ví dụ trên: 34.320.000 / 30 = 1.144.000₫).

**Công thức báo cáo:**

```
Doanh thu   = Σ (OrderItem.qty × OrderItem.unit_price)
Giá vốn     = Σ (OrderItem.qty × OrderItem.unit_cogs)
Lợi nhuận   = Doanh thu − Giá vốn
```

Chỉ tính các đơn đã `Completed`. Đơn `Cancelled` và `Return/Refund` loại khỏi báo cáo.

### 6.5 Ba cấp của size

Size xuất hiện ở ba cấp khác nhau. Lẫn lộn ba cấp này là nguồn lỗi lớn nhất khi làm màn quản trị.

```
1. CATEGORY  →  danh mục này ĐƯỢC PHÉP có size nào
                bảng SizeOption · tab Sizes · rất hiếm khi đụng

2. PRODUCT   →  sản phẩm này THỰC SỰ BÁN size nào
                bảng Variant (stock khởi tạo = 0) · chọn từ từ vựng ở trên

3. BATCH     →  lô này NHẬP BAO NHIÊU CÁI của size đó
                bảng Batch · tab Storage · cộng tồn kho, mang theo giá nhập
```

**Lô hàng được phép tồn tại trước sản phẩm.** Thiết kế gọi đây là *lô chưa liên kết* — mỗi lô mang cờ `linked`. Ghi chú nguyên văn trong form nhập lô:

> *"Stays unlinked until you list it as a product — the size is still recorded now so Add Product can match it."*

Nghĩa là hàng về kho được ghi nhận ngay, kể cả khi chưa niêm yết bán. Nhưng lô **không tự biến thành sản phẩm** — phải có thao tác niêm yết ở tab Products để gắn chúng lại.

| Việc | Làm ở đâu | Tần suất |
|---|---|---|
| Thêm size vào từ vựng danh mục | Tab **Sizes** | Rất hiếm |
| Nhập lô (có thể chưa liên kết) | Tab **Storage** | Thường xuyên |
| Niêm yết sản phẩm, gắn lô vào | Tab **Products** | Thỉnh thoảng |

**Quy trình nhập hàng đầy đủ:**

```
1. Size mới chưa có trong từ vựng?
   → tab Sizes: thêm vào danh mục tương ứng        (bước chuẩn bị, hiếm)

2. tab Storage — nhập lô:
   chọn Category  →  dropdown Size lọc theo danh mục đó
   khai mô tả hàng, số lượng, giá nhập
   → lô ghi nhận với linked = false

3. tab Products — Add Product:
   khai tên, SKU, giá bán, thương hiệu
   form hiện các lô CHƯA liên kết để chọn
   mỗi lô một size → mỗi lô thành một Variant
   → linked = true, tồn kho khớp số đã nhập
```

Form nhập lô có hai chế độ. Trường `Category` bắt buộc vì chế độ thứ hai không có sản phẩm để suy ra danh mục:

| Chế độ | Khi nào | Category lấy từ đâu |
|---|---|---|
| Gắn sản phẩm có sẵn | Nhập thêm hàng cho sản phẩm đã bán | Suy ra từ sản phẩm |
| Hàng chưa niêm yết | Hàng mới về, chưa lên catalogue | Admin tự chọn |

Ở bước 3, thiết kế quy định rõ: *"Each batch is single-size, so one row links one batch to one product size."* Một lô chỉ chứa một size.

**Ba quy tắc bắt buộc:**

1. **`sort_order` là bắt buộc, và do người sắp.** Không có thì danh sách sắp theo chữ cái và ra `L, M, S, XL, XS, XXL` — sai hoàn toàn. Với giày còn tệ hơn: chuỗi `'10'` đứng trước `'9'`. Và vì `Accessories` trộn chữ với số, không có quy tắc tự động nào sắp đúng được — admin kéo thả để định thứ tự.

2. **Không xoá cứng size, chỉ tắt bằng `active = false`.** Size đã nằm trong đơn hàng cũ mà bị xoá thì hỏng lịch sử đơn và hỏng luôn báo cáo lợi nhuận. Tắt thì biến khỏi dropdown nhưng đơn cũ vẫn tra cứu được.

3. **Dropdown size phải lọc theo danh mục đang chọn.** Form Products và form nhập lô đều vậy. Chọn `Footwear` thì không được hiện `XS`.

### 6.6 Dữ liệu chỉ để hiển thị

Ba trường trên `Product` được admin nhập ở form Add Product nhưng **không bao giờ bị lọc, sắp xếp hay join**. Chúng chỉ được đọc ra đổ lên trang chi tiết sản phẩm. Vì vậy dùng **cột JSON**, không dựng bảng riêng, không dựng cột cố định.

| Trường | Kiểu | Nội dung |
|---|---|---|
| `details` | JSON — mảng `{label, value}` | Accordion *Product Details* ở trang sản phẩm |
| `model_fit_note` | text | Một câu, ví dụ *"183cm / 74kg wearing size M"* |
| `size_guide` | JSON — map theo size | Bảng số đo, dạng `{ "M": { chest, length, sleeve } }` |

**Vì sao `details` không thể là cột cố định:** form có nút *+ Add detail row* và xoá từng dòng, nên nhãn là tuỳ ý. Áo có `Fabric / Fit / Made in / Care`, giày có thể có `Sole / Upper / Weight`. Bốn nhãn trong `DETAIL_HINTS` chỉ là **gợi ý placeholder**, không phải danh sách đóng.

**Ranh giới chung:** cần lọc / sắp / join thì dựng cột; chỉ để hiện thì JSON. Không ai lọc sản phẩm theo *"Made in = Portugal"*.

> **`size_guide` để đợt 2.** Thiết kế đang cứng ba số đo `chest / length / sleeve` — đó là số đo áo. Giày cần dài bàn chân, quần cần vòng eo và dài ống: đúng vấn đề phụ thuộc danh mục mà bộ size đã gặp. Database không vướng vì là JSON, nhưng form phải sửa. Đợt 1 bỏ qua phần này.

### 6.7 Hàng mới và hàng giảm giá

- **New Arrivals:** sản phẩm có `created_at` trong vòng 30 ngày, sắp xếp mới nhất trước
- **Sale:** sản phẩm có `sale_price` khác rỗng và nhỏ hơn `price`

Cả hai là **truy vấn động**, không phải danh mục gán tay.

---

### 6.8 Vận chuyển

**Đây là nguồn chân lý cho phí ship. Bản thiết kế đang dùng số cũ — lấy theo mục này khi code.**

| | Giá trị |
|---|---|
| Phí cố định | **30.000₫** |
| Miễn phí từ | **1.000.000₫** (tính trên tạm tính, sau khi trừ hàng không chọn) |
| Phạm vi | **Chỉ nội địa Việt Nam** — không giao quốc tế |
| Thời gian | 1–2 ngày làm việc trong Đà Lạt · 2–4 ngày các tỉnh khác |
| Đóng gói | Đơn đã xác nhận được giao cho đơn vị vận chuyển trong 1–2 ngày làm việc |

**Ngưỡng miễn phí có đổi được sau này — nhưng phải đúng cách.**

Đợt 1 để **hằng số**, gom vào đúng một chỗ:

```js
const SHIPPING = { flat: 30000, freeFrom: 1000000 };
```

Đừng rải số `1000000` khắp code. Có một nguồn duy nhất thì đợt 2 thay bằng truy vấn database chỉ phải sửa một hàm, không đụng chỗ gọi.

Đợt 2 (nếu kịp): chuyển sang bảng `Setting`, admin tự đổi. Thiết kế hiện **không có tab Settings** — 7 tab là Dashboard · Revenue · Brands · Sizes · Storage · Products · Orders — nên sẽ cần tab thứ 8 hoặc một ô trong Dashboard.

> **⚠️ `Order.shipping_fee` là ảnh chụp, không bao giờ tính lại.**
>
> Đây là bẫy giống hệt `unit_cogs` ở [mục 6.4](#64-giá-vốn-fifo-và-lợi-nhuận). Nếu hạ ngưỡng từ 1.000.000₫ xuống 800.000₫, một đơn cũ trị giá 900.000₫ — lúc đặt đã trả 30.000₫ ship — sẽ bỗng thành miễn phí nếu báo cáo tính lại theo cấu hình hiện tại. Tổng đơn đổi, **doanh thu tháng cũ tự động sai**.
>
> Ghi `shipping_fee` vào đơn ngay lúc đặt. Đổi cấu hình chỉ ảnh hưởng đơn mới.

> **Chênh lệch với bản thiết kế** (không cần sửa canvas, nhưng phải biết khi code):
>
> | Nơi | Đang hiện | Đúng phải là |
> |---|---|---|
> | `My Bag & Orders` — `FREE_OVER = 120`, `SHIP_FLAT = 9` | 1.200.000₫ · 90.000₫ | `100` · `3` |
> | `Product Detail` — 2 chỗ | 1.200.000₫ | 1.000.000₫ |
> | `Homepage` (dải tin cậy + marquee), `Sale` (marquee), `FAQ`, `Terms` | 800.000₫ | 1.000.000₫ |
> | `Product Detail` — accordion Shipping | Southeast Asia · Worldwide | Bỏ, chỉ còn nội địa |
> | `Homepage` — dải tin cậy | *"Ships worldwide"* | *"Ships nationwide"* |
> | `Terms` — mục 04 | *"free… after discounts"* | Bỏ *"after discounts"* (đã bỏ mã giảm giá, [quyết định 13](#9-quyết-định)) |

### 6.9 Ảnh sản phẩm

**Không lưu ảnh trong database.** File nằm ngoài, database chỉ giữ đường dẫn.

```
ProductImage   id, product_id, url, sort_order, alt
```

`sort_order` là thứ tự kéo thả trong màn Products; ảnh có `sort_order` nhỏ nhất là **ảnh bìa** — đúng như thiết kế ghi *"Drag to reorder — first image is used as the main product photo"*. Mỗi sản phẩm 2–10 ảnh.

**Vì sao không nhét vào database** (mọi DBMS đều làm được — `bytea`, `BLOB`, `varbinary` — nhưng không nên):

| Vấn đề | Hệ quả |
|---|---|
| Bản dump phình to | 50 sản phẩm × 10 ảnh × 300KB ≈ **150MB** nhị phân trong mọi lần backup |
| Mất cache trình duyệt | File trên đĩa có `Cache-Control`/`ETag`; BLOB thì **mỗi lượt xem là một truy vấn DB** |
| Ngốn RAM và connection | Đọc BLOB 2MB nạp 2MB vào bộ nhớ app, giữ kết nối lẽ ra để chạy truy vấn |
| Không dùng được CDN | Cũng không dùng được dịch vụ resize ảnh tự động |

**Nơi lưu file:**

| Giai đoạn | Nơi lưu |
|---|---|
| Dev + demo trên máy | Thư mục `public/uploads/products/`, lưu đường dẫn tương đối |
| Deploy | **Object storage** — Cloudinary (gói free, tự resize + WebP), Supabase Storage, hoặc Cloudflare R2 |

> **⚠️ Bẫy deploy:** Vercel và Netlify dùng **filesystem tạm** — ảnh upload sẽ **mất sau mỗi lần deploy lại**. Nếu deploy lên đó thì bắt buộc dùng object storage, không dùng thư mục được.

Resize ảnh ngay lúc upload (Cloudinary làm sẵn, hoặc dùng `sharp`) — trang chi tiết tải 10 ảnh gốc sẽ rất chậm.

### 6.10 Gửi email

Thiết kế có **5 điểm chạm email**. Trước đây SPEC liệt kê email là ngoài phạm vi — nay đã vào phạm vi.

| # | Điểm chạm | Trang | Đợt |
|---|---|---|---|
| 1 | **Link đặt lại mật khẩu** | Forgot Password | 1 |
| 2 | **Form liên hệ** → gửi về hộp thư shop | Contact | 1 |
| 3 | **Báo hàng về** (Notify me) | Favourites | 2 |
| 4 | Đăng ký nhận tin hàng tuần | Homepage | 2 |
| 5 | Email chào mừng sau khi tạo tài khoản | Sign Up | 2 |

**Cách gửi: Nodemailer + SMTP Gmail bằng App Password.**

Không dùng Resend/SendGrid cho bài tập này: gói free của Resend **chỉ gửi được tới chính email đã xác minh** cho tới khi verify tên miền — thầy cô nhập email của họ vào form là không nhận được gì. Gmail SMTP gửi tới bất kỳ ai, giới hạn 500 email/ngày, quá đủ.

Yêu cầu: tài khoản Gmail phải **bật 2FA** rồi tạo App Password. Lưu trong `.env` (đã được `.gitignore` chặn), **tuyệt đối không commit**.

#### Đặt lại mật khẩu — cần thêm một bảng

```
PasswordResetToken   id, user_id, token_hash, expires_at, used_at
```

Ba quy tắc, đều dễ làm sai:

1. **Lưu bản băm của token, không lưu token gốc.** Token trong database bị lộ thì kẻ tấn công đăng nhập được mọi tài khoản — hệt như lưu mật khẩu dạng chữ thường.
2. **Hết hạn sau 30 phút** — đúng như thiết kế đã ghi: *"Reset links expire after 30 minutes."*
3. **Dùng một lần.** Đặt `used_at` khi đổi xong; token đã dùng thì từ chối.

Trang `Reset Password` nhận token qua URL: `Reset Password?token=...`

#### Báo hàng về — cần chốt một điểm

Thiết kế lưu `notify: { f2: true, f6: false }` — khoá theo **sản phẩm**. Nhưng FAQ lại viết *"we will email you once your **size** is back in stock"* — hàm ý theo **size**.

→ **Chốt: theo sản phẩm** (quyết định 17). Khớp giao diện — nút tim trên thẻ sản phẩm không có chỗ chọn size. Gửi email khi sản phẩm có bất kỳ size nào từ hết hàng trở lại còn hàng, **liệt kê các size vừa về** trong email để giảm nhiễu. Báo sale luôn theo sản phẩm vì `on_sale` nằm trên Product. Sửa lại câu trong FAQ cho khớp.

Kích hoạt ngay trong luồng cập nhật tồn kho: admin nhập lô → tồn kho từ 0 lên >0 → gửi cho những ai đã bật. Ở quy mô này không cần hàng đợi hay cron.

#### Hai điểm chạm nên hạ kỳ vọng

- **Nhận tin hàng tuần:** lưu email vào bảng `Subscriber` (kèm `unsubscribe_token`), **không xây bộ gửi định kỳ** — không ai vận hành nó thật.
- **Đăng ký:** thiết kế viết *"check your inbox to confirm"*, hàm ý phải xác minh email mới dùng được tài khoản. Đó là cả một luồng. Đề xuất gửi **email chào mừng** và **không khoá tài khoản**, đồng thời sửa lại câu chữ.

### 6.11 Badge sản phẩm

Thiết kế ghi rõ: *"Every product carries exactly one badge; CORE is the muted default status."* Badge **không lưu trong database và không ai gán tay** — tính lúc hiển thị từ dữ liệu có sẵn.

**Thứ tự ưu tiên** — badge đầu tiên thoả điều kiện là badge hiển thị:

| # | Badge | Điều kiện | Màu |
|---|---|---|---|
| 1 | `Out of stock` | Mọi variant có `stock = 0` | Nền tối |
| 2 | `Low stock` | Có variant `stock` trong khoảng 1–5 | Nền tối |
| 3 | `Sale` | Cờ `on_sale = true` | Nền cam |
| 4 | `Restocked` | `restocked_at` trong **14 ngày** gần nhất | Nền cam |
| 5 | `Best seller` | Nằm trong **top 5 số lượng bán tháng hiện tại** | Nền cam |
| 6 | `New` | `created_at` trong **30 ngày** gần nhất | Nền cam |
| 7 | `Core` | Không điều kiện nào ở trên | Mờ, viền mỏng |

**Ngoại lệ theo trang** — thiết kế tự ghi lý do:

- Trang **New Arrivals**: `New` tụt xuống ngay trên `Core` — *"the page context already says new"*
- Trang **Sale**: `Sale` tụt xuống ngay trên `Core` — *"the page context already says everything is reduced"*

**Hai badge cần dữ liệu phụ trợ:**

`Restocked` — thêm trường `Product.restocked_at`. Đặt khi một lô được gắn vào variant của sản phẩm đang **hết hàng hoàn toàn** (tổng `stock = 0` trước khi gắn). Không có mốc thời gian thì badge này dính vĩnh viễn — 14 ngày là đề xuất, chỉnh được.

`Best seller` — cùng truy vấn với khối *Top selling* trong Dashboard: `SUM(OrderItem.qty)` theo sản phẩm, chỉ đơn `completed`, gom theo tháng dương lịch hiện tại, lấy 5. Tính lúc đọc; nếu chậm thì cache theo ngày.

**Không thuộc quy tắc này:**

- `Not listed yet` · `Partially listed` · `Fully listed` — trạng thái liên kết lô ↔ variant trong Storage, chỉ admin thấy
- `Drop 04` · `Drop 03` — nhãn bộ sưu tập trên Product Detail, là dữ liệu mô tả, không phải trạng thái. Nếu giữ thì thêm `Product.collection` dạng text; nếu không thì bỏ

> **Về `on_sale` và `sale_price`:** đã chốt dùng cờ `on_sale` riêng. Ràng buộc đi kèm để hai trường không lệch nhau: `on_sale = true` **bắt buộc** `sale_price` khác rỗng và nhỏ hơn `price` — kiểm tra ở tầng service khi lưu sản phẩm. Trang Sale và badge đều đọc `on_sale`, không đọc `sale_price`.

### 6.12 Tag

Bốn khái niệm hay bị trộn vào nhau — tách rõ:

| Khái niệm | Bản chất | Ai tạo | Lưu ở đâu |
|---|---|---|---|
| **Category** | Phân loại cố định, 4 mục | Không ai — seed sẵn | `Category` |
| **Size** | Từ vựng theo danh mục | Admin, tab Sizes | `SizeOption` |
| **Badge** | Trạng thái **tính ra** lúc hiển thị | Không ai — hệ thống tính | Không lưu ([mục 6.11](#611-badge-sản-phẩm)) |
| **Tag** | Nhãn mô tả **tự do** | Admin gõ tay khi thêm/sửa sản phẩm | `Tag` + `ProductTag` |

**Tag là gì sau khi tách Size và Badge ra:** chủ yếu nhóm đối tượng và phong cách — `Men`, `Women`, `Unisex`, `Limited`, `Organic cotton`, `Waterproof`, `Heavyweight`. Không có danh sách đóng.

**Cách nhập:** ô *"Type a tag, press Enter…"* trong form sản phẩm. Gõ chữ thì autocomplete gợi ý tag đã tồn tại; gõ tag mới rồi Enter thì tạo bản ghi `Tag` mới. Quan hệ nhiều-nhiều qua `ProductTag`.

**Hai nơi dùng tag, hai cách khác nhau:**

| Nơi | Cách dùng |
|---|---|
| **Homepage — khối "Bắt đầu từ đây"** | **4 ô cố định** trong code: `Nam`, `Nữ`, `Unisex`, `Tất cả`. Tên và ảnh chọn tay. Chỉ **số lượng** (`52 mẫu`) là truy vấn động. Ba ô đầu đếm theo tag; ô `Tất cả` đếm toàn bộ sản phẩm và trỏ về Cửa hàng (đổi từ `New Arrivals` ngày 2026-09-18 vì khối Hàng mới nằm ngay dưới) |
| **Shop Listing — bộ lọc "Details"** | Liệt kê **toàn bộ** tag trong database, hoàn toàn động. Admin thêm tag mới là tự xuất hiện, không sửa code |

> Bộ lọc `TAGS` trong thiết kế Shop Listing còn lẫn `New`, `Restocked`, `Best Seller` — đó là badge. Trong app thật, bộ lọc Details chỉ hiện tag; muốn lọc "hàng mới" hay "giảm giá" thì đã có trang New Arrivals và Sale.

## 6b. Trang nội dung tĩnh

Footer đang trỏ tới **10 trang chưa tồn tại**. Chúng không ngang giá trị nhau:

| Nhóm | Trang | Xử lý |
|---|---|---|
| **Nên làm** | FAQ · Contact · Shipping · Returns | HTML tĩnh, nội dung viết tay. Là chính sách bán hàng thật |
| **Thật ra là tính năng** | Track order | Trùng tab đơn hàng trong My Orders → bỏ link, trỏ thẳng vào đó |
| **Bảng tĩnh** | Size guide (link footer) | Khác với size guide từng sản phẩm ở [mục 6.6](#66-dữ-liệu-chỉ-để-hiển-thị). Chỉ là một bảng quy đổi chung |
| **Lấp chỗ trống** | About · Sustainability · Stockists · Careers | Không thêm gì cho bài tập. Gộp vào một trang About, hoặc bỏ link |

**Không trang nào trong số này đụng tới database hay stack.** Làm lúc nào cũng được, kể cả sau khi app chạy xong — nên chúng không chặn việc chốt công cụ.

Chưa có trang nào được thiết kế trên canvas. Nếu làm, dùng lại header và footer sẵn có là đủ.

## 7. Quy ước

**Tiền tệ.** Lưu dạng **số nguyên VND**, không dùng số thực.

> Thiết kế đang để `price: 186` rồi nhân 10.000 lúc hiển thị thành `1.860.000₫`. **Không bê cách này vào database** — lưu thẳng `1860000`.

**Mã đơn hàng.** Dạng `#CSE-4417` như thiết kế. Sinh tuần tự.

**SKU.** Dạng `CSE-JKT-186` — tiền tố `CSE`, viết tắt loại hàng, số thứ tự. Sinh tự động khi nhập/tạo sản phẩm, admin không gõ tay. Bộ viết tắt loại hàng là danh sách đóng (chỉ để đặt mã, **không** lưu thành trường riêng — danh mục vẫn là 4 `Category`):

| Danh mục | Mã |
|---|---|
| Tops | TEE tee · SHR shirt · HDY hoodie · FLC fleece · JKT jacket |
| Bottoms | PNT pant · JEN jean · SHT short |
| Footwear | SNK sneaker · RUN runner · BOT boot · SDL sandal |
| Accessories | CAP cap · BNE beanie · BAG bag · BLT belt · SCK sock · ACC other |

**Ngày giờ.** Lưu UTC, hiển thị theo giờ Việt Nam.

---

## 8. Ngoài phạm vi

Ghi rõ để tránh hiểu nhầm khi chấm bài:

- Không tích hợp cổng thanh toán thật (Momo, VNPay, Stripe…). **Cũng không có chuyển khoản QR** — xem lý do ở [mục 6.2](#62-thanh-toán). Chỉ COD
- Không tích hợp đơn vị vận chuyển, không tính phí ship theo khoảng cách. **Không giao quốc tế** — xem [mục 6.8](#68-vận-chuyển)
- **Điều hướng bằng anchor `#` trong bản thiết kế không phải lỗi.** `#terms`, `#privacy`, `#shipping`, `#returns`, `#instagram`, `#facebook` là chỗ giữ chân trong mockup; khi dựng app chúng thành route thật. Không cần sửa trên canvas
- Không gửi **SMS**. Email thì **có** — xem [mục 6.10](#610-gửi-email)
- Không có tìm kiếm nâng cao (full-text search, gợi ý)
- Không có đánh giá / bình luận sản phẩm
- Không có mã giảm giá, khuyến mãi theo combo
- Ảnh tĩnh của giao diện (hero, banner, ảnh minh hoạ trang About) đặt tay vào mã nguồn, không quản lý qua admin
- **Không đa ngôn ngữ.** Toàn bộ giao diện tiếng Việt (viết theo ngữ cảnh, không dịch máy); giữ nguyên tên hãng, *Sale*, *Unisex*, SKU, các từ streetwear thông dụng. Tên category/tag trong DB vẫn tiếng Anh làm khoá (`?cat=Tops`), chỉ nhãn hiển thị đổi qua `categoryLabel()`/`tagLabel()`. Nút VI/EN trong thiết kế đã bỏ
- Không có biến thể màu sắc — sản phẩm chỉ phân biệt theo size

---

## 9. Quyết định

### Đã chốt

| # | Vấn đề | Kết luận |
|---|---|---|
| 1 | **Cách tính lợi nhuận** | FIFO theo lô nhập — xem [mục 6.4](#64-giá-vốn-fifo-và-lợi-nhuận) |
| 2 | **Phạm vi** | Chia hai đợt — xem [mục 3](#3-phạm-vi-theo-đợt) |
| 3 | **Biến thể sản phẩm** | **Chỉ theo size, không có màu.** Thiết kế đã được sửa lại ngày 11/09 để bỏ màu khỏi giỏ hàng |
| 4 | **Đơn vị tiền** | Số nguyên VND — xem [mục 7](#7-quy-ước) |
| 5 | **Đa ngôn ngữ** | Không làm. Giao diện tiếng Việt (đổi 2026-09-18) |
| 6 | **Giỏ hàng cho khách vãng lai** | Không có. Bắt đăng nhập trước khi thêm giỏ |
| 7 | **Phí vận chuyển** | **30.000₫ cố định, miễn phí từ 1.000.000₫.** Chỉ giao nội địa Việt Nam. Xem [mục 6.8](#68-vận-chuyển) |
| 8 | **Hoàn hàng** | Theo toàn bộ đơn, không hoàn từng món |
| 9 | **Từ vựng size** | Bảng `SizeOption` theo danh mục, admin quản lý qua **tab Sizes**. Xem [mục 6.5](#65-ba-cấp-của-size) |
| 10 | **Định dạng size** | Tops/Bottoms dùng chữ, Footwear dùng số, Accessories trộn tuỳ loại. Danh mục nào cũng thêm size mới được. Xem [mục 5](#giá-trị-cố-định) |
| 11 | **Luồng thanh toán** | **Chỉ COD, bỏ hẳn QR.** Mọi đơn vào `To Confirm`, `unpaid` cho tới lúc giao hàng thu tiền. Xem [mục 6.2](#62-thanh-toán) |
| 12 | **Ranh giới huỷ / hoàn** | Khách huỷ được ở `To Confirm` và `Processing`. Từ `Shipping` trở đi chỉ còn hoàn hàng. Xem [mục 6.1](#61-vòng-đời-đơn-hàng) |
| 13 | **Mã giảm giá** | Không làm. Gỡ ô Promo và dòng Discount khỏi thiết kế giỏ hàng |

| 14 | **Công cụ** | Next.js + TypeScript + Prisma + PostgreSQL + Cloudinary + Nodemailer. Xem [mục 11](#11-công-cụ) |
| 15 | **Badge sản phẩm** | Mỗi sản phẩm đúng một badge, **tính tự động** theo thứ tự ưu tiên, không ai gán tay. `Restocked` qua `restocked_at`, `Best seller` là top 5 bán chạy tháng hiện tại. Xem [mục 6.11](#611-badge-sản-phẩm) |
| 16 | **Tag** | Nhãn tự do, admin gõ tay có autocomplete, bảng `Tag` + `ProductTag`. **Tách hẳn khỏi Category, Size và Badge.** Xem [mục 6.12](#612-tag) |
| 17 | **Favourite** | Theo **sản phẩm**, không theo size. Báo restock khi bất kỳ size nào về, email liệt kê size. Xem [mục 6.10](#610-gửi-email) |

### Còn treo

Không còn.

### Việc cần làm trên canvas

- [x] ~~Thêm màn Sizes vào Store Management~~ — xong 11/09, là tab thứ 4 trong 7 tab
- [x] ~~Dropdown size lọc theo danh mục~~ — xong 11/09, qua hàm `sizesForCat`
- [x] ~~Sửa hai size lỗi thời trong giỏ hàng~~ — xong 11/09, `32` → `M`, `EU 43` → `43`
- [x] ~~Đổi `To Pay` → `To Confirm`, id `pay` → `pending`~~ — xong 11/09, cả `STATUSES` lẫn `TABS`
- [x] ~~Thêm nhãn Paid / Unpaid vào tab Orders~~ — xong 11/09, `SEED_ORDERS` có cờ `paid`
- [x] ~~Gỡ mã giảm giá khỏi giỏ hàng~~ — xong 11/09, gỡ cả ô Promo, dòng Discount và hằng số `CODES`
- [x] ~~Bỏ QR~~ — xong 11/09, không trang nào còn nhắc tới
- [x] ~~Sửa lời mô tả tab đầu tiên~~ — xong 11/09, giờ là *"New orders land here first. We review and confirm each one…"*

**Không còn việc nào trên canvas.** Thiết kế sẵn sàng đóng băng.

> **Về quy tắc huỷ (quyết định 12):** sáu tab đơn hàng phía khách hiện chỉ render trạng thái rỗng — không có dữ liệu đơn mẫu, không có nút huỷ nào để khoá. Đây là **logic, không phải giao diện**: quy tắc đã ghi ở [mục 6.1](#61-vòng-đời-đơn-hàng) và sẽ được cài đặt khi dựng app. Chỉ vẽ thêm dòng đơn mẫu lên canvas nếu cần demo trực quan luồng đơn hàng.

---

## 10. Quan hệ với file thiết kế

Các file `*.dc.html` là **tài liệu tham chiếu, không phải mã nguồn**.

- Chúng được đồng bộ **một chiều** từ Claude Design về máy (project thuộc loại `PROJECT_TYPE_PROJECT`, không đẩy ngược lên được)
- **Không sửa các file này ở local** — lần đồng bộ sau sẽ ghi đè
- Muốn đổi giao diện ở giai đoạn này: sửa trên canvas rồi đồng bộ về, commit lại

**Mốc đóng băng:** khi SPEC này được duyệt và bắt đầu code app thật, chuyển 10 file vào thư mục `design/`. Từ đó giao diện sửa thẳng trong mã nguồn app; file thiết kế chỉ còn để tra cứu.

### Đóng băng không có nghĩa là khoá giao diện

Tài liệu bị đóng băng là **10 file `.dc.html`**, không phải SPEC này — SPEC là tài liệu sống, quy tắc nghiệp vụ đổi thì cứ sửa và ghi vào nhật ký cuối trang.

Đóng băng chỉ nghĩa là **nguồn chân lý của giao diện chuyển từ canvas sang code**:

```
Trước đóng băng   canvas là chân lý  →  sửa trên canvas  →  pull về
Sau đóng băng     code là chân lý    →  sửa thẳng trong code
```

Lý do phải chuyển hẳn chứ không giữ cả hai: sync chỉ chạy một chiều, nên sửa canvas **không tự chảy vào app** — vẫn phải dịch tay. Giữ song song nghĩa là mỗi thay đổi làm hai lần ở hai nơi, và sau vài tuần hai bản sẽ lệch, không ai biết bản nào đúng.

| Loại thay đổi | Làm ở đâu |
|---|---|
| Đổi chữ, thêm link footer, chỉnh màu / khoảng cách | Thẳng trong code. Không đụng canvas |
| Thêm màn nhỏ (FAQ, Contact…) | Thẳng trong code, dùng lại header/footer sẵn có |
| Thiết kế lại hẳn một màn lớn | Vẽ thử trên canvas cho dễ hình dung, rồi **tự dịch sang code** |
| Đổi quy tắc nghiệp vụ | Sửa SPEC trước, rồi mới code |

---

## 11. Công cụ

**Đã chốt 13/09/2026.** Ràng buộc: deadline **1,5 tháng**, gần như một người làm.

| Lớp | Chọn | Lý do |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Một project lo cả frontend lẫn backend qua API routes — không cần Express riêng |
| ORM | **Prisma** | Schema một file, migration tự sinh, type chạy suốt từ DB lên UI |
| Database | **PostgreSQL** (Neon free) | Dữ liệu ràng buộc chặt: lô ↔ biến thể ↔ đơn |
| Auth | **Auth.js** | Khớp `User.role` ở [mục 2](#2-vai-trò-người-dùng) |
| Ảnh | **Cloudinary** (free) | Bắt buộc vì Vercel dùng filesystem tạm — [mục 6.9](#69-ảnh-sản-phẩm) |
| Email | **Nodemailer + SMTP Gmail** | Gửi được cho người ngoài — [mục 6.10](#610-gửi-email) |
| CSS | **CSS Modules + component dùng chung** | Xem bên dưới |
| Deploy | **Vercel** (free) | Cùng nhà với Next.js |

Tất cả đều gói miễn phí, không cần thẻ.

### Vì sao không tách frontend / backend

Lý do duy nhất để tách là **chia việc cho nhiều người**. Chỉ một người làm thì tách chỉ đẻ thêm CORS, hai lần deploy, hai bộ type phải giữ đồng bộ.

### Vì sao không dùng Tailwind

Inline style trong thiết kế đã viết dạng camelCase (`borderBottom`, `boxShadow`) — **chúng chính là style object của React**, copy thẳng vào `style={{...}}` là chạy. Đổi sang Tailwind là viết lại 1.692 khai báo style mà không được gì.

Chỉ 506 chỗ `style-hover` / `style-focus` / `style-active` là không bê thẳng được (inline style không làm được `:hover`). Cách xử lý: gom thành **vài component dùng chung** — Button, ProductCard, Input, Badge, SizePill — mỗi cái một file CSS Module. 506 chỗ rút còn khoảng 20.

### Vì sao giữ hệ sinh thái React

19/19 trang thiết kế **đã là React**: `class Component extends DCLogic`, 311 lần `setState`, 199 event handler. Port sang React gần như cơ học.

Rời React (Blade, Django template, JSP) thì phải **viết lại toàn bộ phần tương tác** và không copy được gì từ thiết kế: thanh trượt giá kéo bằng pointer, kéo thả đổi thứ tự size, kéo thả đổi thứ tự ảnh, gallery cuộn ngang, accordion, tab, filter pill.

> **Nếu môn học bắt buộc PHP hoặc C#:** chọn **Laravel + Inertia + React** hoặc **ASP.NET Core + React** — vẫn giữ React cho giao diện, chỉ đổi tầng backend. Đừng chọn Blade hay Razor thuần.

---

## 12. Lộ trình 6 tuần

| Tuần | Nội dung |
|---|---|
| **0** (2–3 ngày) | Đóng băng thiết kế vào `design/`. Khởi tạo Next.js + Prisma. Viết schema từ [mục 5](#5-mô-hình-dữ-liệu). Seed: danh mục, size, thương hiệu, 2 tài khoản demo, ~20 sản phẩm. **Deploy khung rỗng lên Vercel ngay** |
| **1–2** | Auth → layout dùng chung → Shop Listing → Product Detail → giỏ hàng lưu DB → đặt hàng, trừ kho |
| **3** | Vỏ Store Management + 7 tab. CRUD sản phẩm + upload ảnh. CRUD thương hiệu, size. Đơn hàng + đổi trạng thái. Quên mật khẩu + form liên hệ |
| **4** | Nhập lô, lô chưa liên kết, gắn vào variant. Màn Revenue: doanh thu, giá vốn, lợi nhuận. Dashboard |
| **5** | Favourites + báo hàng về. 5 trang tĩnh. Sổ địa chỉ, đổi mật khẩu |
| **6** | Đệm, kiểm thử, tài liệu, tập demo |

> **⚠️ Bẫy thứ tự.** Màn Revenue ở tuần 4, nhưng **`OrderItem.unit_cogs` phải ghi từ tuần 2** — lúc viết chức năng đặt hàng. Không bổ sung sau được vì lô hàng đã tiêu thụ và giá nhập đã đổi. Cùng lý do với `Order.shipping_fee`.
>
> Hai trường này thuộc loại **ghi sai một lần là mất dữ liệu vĩnh viễn** — phải đúng ngay lần đầu, dù màn hình dùng chúng chưa tồn tại.

**Deploy sớm ở tuần 0 là có chủ ý:** lỗi hạ tầng (biến môi trường, filesystem tạm, kết nối database) lòi ra ở tuần 0 thì mất một buổi; lòi ra ở tuần 6 thì mất bài.

---

## Nhật ký thay đổi

| Ngày | Thay đổi |
|---|---|
| 2026-09-10 | Bản nháp đầu tiên, rút trích từ 10 trang thiết kế |
| 2026-09-11 | Chốt 8 quyết định. Bỏ màu khỏi biến thể (thiết kế giỏ hàng đã sửa). Bỏ đa ngôn ngữ, dùng tiếng Anh. Phát hiện bộ size không khớp giữa các trang |
| 2026-09-11 | Chốt quyết định 9: bảng `SizeOption` + tab Sizes. Thêm mục 6.5 về ba cấp của size. Còn treo duy nhất: stack |
| 2026-09-11 | Sửa mục 6.5: lô hàng **được phép** tồn tại trước sản phẩm (`linked = false`), niêm yết sau sẽ gắn lô vào Variant. Bản trước ghi ngược |
| 2026-09-11 | Đồng bộ Store Management: tab Sizes đã có, dropdown đã lọc theo danh mục, `Category` thành thực thể có id. Cập nhật seed size theo đúng thiết kế. Phát sinh: giỏ hàng còn hai size lỗi thời |
| 2026-09-11 | Chốt quyết định 10: chính sách định dạng size theo danh mục, Accessories được trộn nhiều định dạng |
| 2026-09-11 | Giỏ hàng đã sửa size, 10 trang nhất quán. Tách `payment_status` khỏi `status`, viết lại mục 6.2 |
| 2026-09-11 | Sửa lại quyết định 11: thay vì cho COD bỏ qua `To Pay`, **mọi đơn đều vào `To Confirm`** — pipeline hết rẽ nhánh. Thêm quyết định 12 (ranh giới huỷ/hoàn) và 13 (bỏ mã giảm giá) |
| 2026-09-11 | Chốt lại quyết định 11 lần cuối: **bỏ hẳn QR, chỉ còn COD**. Thiết kế đã đổi `To Confirm`, gỡ QR và mã giảm giá, thêm cờ `paid`. Vòng đời tiền rút còn một mốc duy nhất |
| 2026-09-11 | Hết việc trên canvas. Thêm mục 6.6 (dữ liệu chỉ để hiển thị — `details`, `model_fit_note`, `size_guide` dùng cột JSON) và mục 6b (10 trang tĩnh trong footer). Đẩy size guide xuống đợt 2 |
| 2026-09-11 | Mục 10: nói rõ đóng băng áp dụng cho file `.dc.html` chứ không phải SPEC, kèm bảng hướng dẫn sửa gì ở đâu sau khi đóng băng |
| 2026-09-13 | Thiết kế thêm `Forgot Password` và `Reset Password` (19 trang). Dọn sạch Stockholm, sửa guest checkout trong FAQ. Chốt lại quyết định 7: **ship 30.000₫, miễn phí từ 1.000.000₫, chỉ nội địa**. Thêm mục 6.8 kèm bảng chênh lệch với bản thiết kế. Ghi rõ anchor `#` trong mockup không phải lỗi |
| 2026-09-13 | Mục 6.8: ngưỡng miễn phí đổi được về sau — đợt 1 dùng hằng số gom một chỗ, đợt 2 chuyển sang bảng `Setting`. Chốt bất biến **`Order.shipping_fee` là ảnh chụp, không tính lại** |
| 2026-09-13 | Thiết kế đã sửa hết số liệu ship — rà soát 19 trang: **0 lỗi**. Mục 2: ghi hai tài khoản demo thành dữ liệu seed, nói rõ vai trò lấy từ `User.role` trong database; sửa "6 màn" → "7 màn" |
| 2026-09-13 | Thêm mục 6.9: ảnh sản phẩm lưu **ngoài** database, bảng `ProductImage` chỉ giữ đường dẫn. Upload ảnh vào phạm vi (trước đây liệt kê ngoài phạm vi) |
| 2026-09-13 | Thêm mục 6.10: **gửi email vào phạm vi** (trước ghi ngoài phạm vi). Nodemailer + SMTP Gmail. Bảng `PasswordResetToken` với token băm, hết hạn 30 phút, dùng một lần. Còn treo: báo hàng về theo sản phẩm hay theo size |
| 2026-09-13 | **Chốt quyết định 14 — công cụ.** Viết lại mục 11, thêm mục 12 (lộ trình 6 tuần). SPEC hoàn tất, sẵn sàng code |
| 2026-09-16 | **Chốt quyết định 15 — badge.** Thêm mục 6.11: quy tắc ưu tiên 7 bậc, mọi badge tính tự động. Thêm `Product.restocked_at`. Đây là quy tắc thiết kế đã có sẵn mà SPEC bỏ sót |
| 2026-09-16 | **Chốt quyết định 16 — tag.** `tags[]` thành bảng `Tag` + `ProductTag`. Bỏ 5 badge khỏi danh sách tag. Thêm mục 6.12 với bảng tách 4 khái niệm Category / Size / Badge / Tag. Badge `Sale` đọc cờ `on_sale` thay vì `sale_price` |
| 2026-09-16 | **Chốt quyết định 17 — Favourite theo sản phẩm.** Không còn quyết định treo. Bắt đầu viết Prisma schema |
| 2026-09-17 | Mục 7: SKU sinh tự động, thêm bảng mã loại hàng (danh sách đóng, không lưu thành trường). Phục vụ thu thập dữ liệu sản phẩm theo nhóm |
| 2026-09-16 | Tuần 0 gần xong: design đóng băng vào `design/`, Next.js 16 + Prisma 7, schema 17 bảng, 2 migration, seed 24 sản phẩm / 263 lô / 14 đơn / 2 tài khoản. Mục 5: `Batch` thêm `brand_id`, `size_option_id` (form nhập lô có Brand và Size, mục 6.5); thêm `PasswordResetToken`, `Subscriber`, `Favourite.notify`. Còn lại của tuần 0: deploy Vercel |
| 2026-09-18 | Đổi toàn bộ giao diện sang tiếng Việt (slogan mới "Đủ chất / Đủ tự tin / Khỏi cần chứng minh"). Instrument Serif → Playfair Display (có tiếng Việt), bật subset `vietnamese` cho cả 3 font, nới line-height heading vì dấu |
