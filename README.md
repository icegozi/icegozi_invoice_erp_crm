# ERP / CRM

Open-source **ERP / CRM** quản lý Hóa đơn (Invoice), Báo giá (Quote), Thanh toán (Payment) và Khách hàng (Customer), xây trên **MERN stack**.

## Tính năng

- 🧾 **Hóa đơn (Invoice)** — tạo, gửi email, ghi nhận thanh toán, xuất PDF
- 📄 **Báo giá (Quote)** — tạo báo giá và chuyển đổi thành hóa đơn
- 💳 **Thanh toán (Payment)** — quản lý thanh toán và phương thức thanh toán
- 👥 **Khách hàng (Customer)** — quản lý thông tin khách hàng
- ⚙️ **Thuế & Cài đặt** — cấu hình thuế, công ty, tiền tệ, ngôn ngữ
- 🔐 Xác thực admin bằng JWT, phân quyền theo vai trò

## Công nghệ

| Tầng | Stack |
|------|-------|
| Backend | Node.js 20 · Express · MongoDB (Mongoose) |
| Frontend | React 18 · Vite · Ant Design · Redux Toolkit |
| Hạ tầng | Docker · Docker Compose · Nginx |

> Backend tự sinh REST API cho mỗi model trong `backend/src/models/appModels/` — xem chi tiết kiến trúc trong [CLAUDE.md](CLAUDE.md).

---

## Cài đặt (khuyến nghị: Docker)

Cách nhanh nhất — chạy toàn bộ (MongoDB + Backend + Frontend) trong Docker, không cần cài Node hay MongoDB trên máy.

### Yêu cầu
- Docker Engine 20+ và Docker Compose v2

### Chạy

```bash
docker compose up -d --build
```

Lần đầu chạy, backend tự chờ MongoDB sẵn sàng rồi **tự seed** tài khoản admin và cấu hình mặc định.

| Service | URL | Ghi chú |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Giao diện ứng dụng |
| Backend API | http://localhost:8888 | REST API |
| MongoDB | mongodb://localhost:27017 | Database `invoice` |

**Đăng nhập mặc định:** `admin@admin.com` / `admin123` *(đổi mật khẩu ngay sau khi đăng nhập)*

### Lệnh thường dùng

```bash
docker compose logs -f backend     # xem log backend
docker compose down                # dừng (giữ dữ liệu)
docker compose down -v             # dừng + xóa toàn bộ dữ liệu
```

### Cấu hình (tùy chọn) — một file `.env` duy nhất

Toàn bộ cấu hình (cả backend lẫn frontend) nằm trong **một file `.env` ở thư mục gốc**. Không tạo cũng chạy được (đã có giá trị mặc định). Để tùy chỉnh:

```bash
cp .env.example .env    # rồi sửa giá trị
```

Các biến chính trong `.env`:

```env
JWT_SECRET=chuoi_bi_mat_dai_ngau_nhien
FRONTEND_URL=http://localhost:3000        # URL public của app
VITE_BACKEND_SERVER=http://localhost:8888/  # URL backend (frontend gọi tới)
VITE_FILE_BASE_URL=http://localhost:8888/
RESEND_API=                               # API key Resend để gửi email (trống = tắt email)
OPENING_EMAIL=onboarding@resend.dev       # email gửi đi (verify trên Resend)
OPENAI_API_KEY=                           # (tùy chọn) tích hợp AI
```

> Email (Resend) và OpenAI là tùy chọn — bỏ trống vẫn chạy được các chức năng cốt lõi.
> Sau khi sửa `.env`, chạy lại `docker compose up -d --build` để áp dụng.

Chi tiết Docker xem thêm tại [DOCKER.md](DOCKER.md).

---

## Cài đặt thủ công (không dùng Docker)

Yêu cầu: **Node.js 20.9.0**, **npm 10.2.4**, và một MongoDB URI (local hoặc MongoDB Atlas).

```bash
# 1. Backend
cd backend
cp .env .env.local              # rồi sửa DATABASE="<mongodb-uri>" trong .env.local
npm install
npm run setup                   # seed admin + cấu hình mặc định (chạy 1 lần)
npm run dev                     # backend chạy ở cổng 8888

# 2. Frontend (terminal khác)
cd frontend
npm install
npm run dev                     # frontend chạy ở cổng 3000
```

Mở http://localhost:3000 và đăng nhập với `admin@admin.com` / `admin123`.

Các lệnh khác: `npm run reset` (xóa dữ liệu), `npm run build` (build frontend), `npm run lint` (kiểm tra lint frontend). Hướng dẫn chi tiết hơn xem [INSTALLATION-INSTRUCTIONS.md](INSTALLATION-INSTRUCTIONS.md).

---

## Hướng dẫn sử dụng

Sau khi đăng nhập (`admin@admin.com` / `admin123`), thanh menu bên trái gồm:
**Dashboard · Khách hàng · Hóa đơn · Báo giá · Thanh toán · Phương thức thanh toán · Thuế · Cài đặt · Giới thiệu**.

> Trang chủ (Dashboard) hiện hiển thị danh sách **Hóa đơn**.

### Bước 1 — Cấu hình ban đầu (nên làm trước)

1. **Cài đặt → Settings**: nhập thông tin công ty, tiền tệ, ngôn ngữ, logo. Đây là thông tin in trên hóa đơn/báo giá.
2. **Thuế (Taxes)**: hệ thống đã có sẵn "Tax 0%". Bấm **Add New Tax** để thêm thuế (vd: VAT 10%) và đặt **Default** nếu muốn áp dụng mặc định.
3. **Phương thức thanh toán (Payment Mode)**: đã có sẵn "Default Payment". Thêm/sửa các phương thức (Tiền mặt, Chuyển khoản…) tùy nhu cầu.

### Bước 2 — Tạo khách hàng

Vào **Khách hàng → Add New Customer**, nhập tên, email, số điện thoại, địa chỉ. Khách hàng sẽ được chọn khi lập hóa đơn/báo giá.

### Bước 3 — Lập báo giá (Quote) *(tùy chọn)*

1. **Báo giá → Add New Quote**: chọn khách hàng, ngày, hạn hiệu lực.
2. Thêm từng dòng sản phẩm/dịch vụ (tên, số lượng, đơn giá) → chọn thuế → hệ thống tự tính tổng.
3. Lưu. Từ màn hình xem báo giá có thể: **gửi email**, **tải PDF**, hoặc **Convert to Invoice** (chuyển thành hóa đơn).

### Bước 4 — Lập hóa đơn (Invoice)

1. **Hóa đơn → Add New Invoice**: chọn khách hàng, ngày, hạn thanh toán, thêm các dòng hàng và thuế.
2. Lưu. Trạng thái hóa đơn: *draft → pending → sent…*
3. Từ màn hình xem hóa đơn:
   - **Tải PDF** / **Gửi email** cho khách.
   - **Record Payment** (ghi nhận thanh toán): nhập số tiền + phương thức → hóa đơn cập nhật trạng thái thanh toán (paid / partially).

### Bước 5 — Theo dõi thanh toán

Vào **Thanh toán (Payments)** để xem toàn bộ giao dịch đã ghi nhận, xem chi tiết hoặc tải biên nhận PDF.

### Quản lý tài khoản

- **Hồ sơ (Profile)** (góc trên bên phải): cập nhật tên, ảnh đại diện, **đổi mật khẩu**.
- 🔐 Khuyến nghị: đổi ngay mật khẩu mặc định `admin123` sau lần đăng nhập đầu tiên.

---

## Giấy phép

Dựa trên [IDURAR](https://github.com/idurar/idurar-erp-crm), phát hành theo **GNU AGPL v3.0**. Xem [LICENSE](LICENSE).
