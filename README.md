# Invoice ERP/CRM

`ic_goz_crm` là hệ thống quản lý quan hệ khách hàng và nghiệp vụ lập chứng từ cho doanh nghiệp nhỏ: khách hàng, hóa đơn, hóa đơn tạm tính, thanh toán, thuế và cài đặt doanh nghiệp. Tài liệu này là đặc tả triển khai và vận hành cho phiên bản hiện tại.

## 1. Mục tiêu và phạm vi

Mục tiêu của hệ thống là giúp người quản trị tạo, theo dõi và gửi chứng từ cho khách hàng từ một giao diện web song ngữ Việt/Anh.

Phạm vi bao gồm:

- Quản lý khách hàng, địa chỉ, số điện thoại và email.
- Lập hóa đơn, hóa đơn tạm tính/báo giá, tính thuế và xuất PDF.
- Ghi nhận thanh toán, theo dõi trạng thái thanh toán và xuất biên nhận.
- Gửi chứng từ qua email; môi trường phát triển dùng Mailpit để xem thư mà không gửi ra Internet.
- Cấu hình thông tin doanh nghiệp, tiền tệ, logo và ngôn ngữ hiển thị.
- Đăng nhập quản trị, cập nhật hồ sơ, đổi và khôi phục mật khẩu.

Ngoài phạm vi: kế toán sổ cái, đồng bộ ngân hàng, cổng thanh toán trực tuyến và phân quyền nghiệp vụ chi tiết theo nhiều cấp.

## 2. Đặc tả chức năng

| Phân hệ          | Yêu cầu chính                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Xác thực         | Đăng nhập bằng JWT; đổi mật khẩu; gửi liên kết đặt lại mật khẩu có thời hạn.                            |
| Khách hàng       | Tạo, xem, sửa, tìm kiếm và lưu thông tin liên hệ khách hàng.                                            |
| Hóa đơn          | Tạo dòng hàng/dịch vụ, tính số lượng × đơn giá × thuế, theo dõi trạng thái, tải PDF và gửi email.       |
| Hóa đơn tạm tính | Tạo, chỉnh sửa, gửi PDF qua email và chuyển đổi thành hóa đơn khi cần.                                  |
| Thanh toán       | Ghi nhận thanh toán, phương thức thanh toán, số tiền và biên nhận PDF.                                  |
| Thuế & cài đặt   | Quản lý thuế, thông tin công ty, tiền tệ, logo và ngôn ngữ Việt/Anh.                                    |
| Giao diện        | Responsive cho desktop/tablet/mobile; các trạng thái nghiệp vụ và nhãn chính được dịch sang tiếng Việt. |

### Trạng thái nghiệp vụ

- Chứng từ có thể ở các trạng thái như `draft`, `pending`, `sent`, `on hold`, `cancelled`.
- Trạng thái thanh toán gồm `paid`, `partially`, `unpaid` theo dữ liệu thanh toán đã ghi nhận.
- Trạng thái hiển thị được dịch theo ngôn ngữ đã chọn; mã trạng thái trong API vẫn giữ nguyên để tương thích dữ liệu.

## 3. Kiến trúc

```text
Trình duyệt (React + Vite + Ant Design)
                │ HTTPS/HTTP REST
                ▼
      API (Node.js + Express + Mongoose)
          ├────► MongoDB: dữ liệu nghiệp vụ
          └────► SMTP: Mailpit ở môi trường phát triển
                         hoặc SMTP thật ở môi trường triển khai
```

| Tầng             | Công nghệ                                 |
| ---------------- | ----------------------------------------- |
| Frontend         | React 18, Vite, Ant Design, Redux Toolkit |
| Backend          | Node.js 20, Express, Mongoose             |
| Dữ liệu          | MongoDB                                   |
| Hạ tầng          | Docker Compose, Nginx                     |
| Email phát triển | Mailpit qua SMTP                          |

Quy ước API, model và cấu trúc backend được mô tả thêm trong [CLAUDE.md](CLAUDE.md).

## 4. Yêu cầu phi chức năng

- **Khả dụng:** giao diện đáp ứng trên màn hình nhỏ; thao tác gửi mail không làm treo luồng tạo chứng từ.
- **Dữ liệu:** các phép tính tiền cần được xác nhận ở backend; các giá trị thiếu hiển thị bằng dấu `—`, không làm hỏng bảng dữ liệu.
- **Bảo mật:** mật khẩu được băm; token đặt lại mật khẩu chỉ có hiệu lực 15 phút và chỉ lưu bản băm; nội dung email được escape trước khi chèn HTML.
- **Email:** Mailpit chỉ dùng cho phát triển/kiểm thử. Muốn gửi thư thật phải cấu hình SMTP hợp lệ.
- **Tương thích:** mã trạng thái và endpoint hiện có được giữ nguyên; việc dịch chỉ thay đổi nội dung hiển thị.

## Bắt đầu nhanh

### Điều kiện

- Docker Engine 20+ và Docker Compose v2.

### Cài đặt

```bash
cp .env.example .env
# Bắt buộc đổi JWT_SECRET trước khi đưa ra môi trường thật
make up
```

Lần chạy đầu, backend chờ MongoDB sẵn sàng rồi seed dữ liệu và tài khoản quản trị mặc định.

| Dịch vụ      | Địa chỉ mặc định          | Mục đích                |
| ------------ | ------------------------- | ----------------------- |
| Ứng dụng web | http://localhost:3000     | Giao diện quản trị      |
| Backend API  | http://localhost:8000     | REST API                |
| Mailpit      | http://localhost:8026     | Hộp thư kiểm thử nội bộ |
| MongoDB      | mongodb://localhost:27017 | Cơ sở dữ liệu `invoice` |

Tài khoản ban đầu: `admin@admin.com` / `admin123`. Chỉ dùng cho môi trường mới tạo; hãy đổi mật khẩu ngay sau lần đăng nhập đầu tiên.

Các lệnh vận hành thường dùng:

```bash
make status             # trạng thái các service
make health             # kiểm tra API health
make logs-backend       # theo dõi log backend
make rebuild-backend    # build và thay backend đang chạy
make rebuild-frontend   # build và thay frontend đang chạy
make down               # dừng và gỡ container
```

> `make destroy` xóa cả Docker volumes, bao gồm dữ liệu MongoDB. Chỉ dùng khi chủ động làm mới dữ liệu.

## Cấu hình

Tạo file `.env` ở thư mục gốc từ `.env.example`. Không đưa file chứa bí mật vào Git.

| Biến                     | Mô tả                                   | Giá trị phát triển điển hình                                  |
| ------------------------ | --------------------------------------- | ------------------------------------------------------------- |
| `DATABASE`               | Chuỗi kết nối MongoDB                   | `mongodb://mongo:27017/invoice` khi chạy Docker               |
| `JWT_SECRET`             | Bí mật ký JWT                           | Chuỗi ngẫu nhiên dài, riêng cho từng môi trường               |
| `FRONTEND_URL`           | URL public của frontend                 | `http://localhost:3000`                                       |
| `VITE_BACKEND_SERVER`    | URL API mà frontend gọi                 | `http://localhost:8000/`                                      |
| `VITE_FILE_BASE_URL`     | URL phục vụ tệp/PDF                     | `http://localhost:8000/`                                      |
| `SMTP_HOST`              | Máy chủ SMTP                            | `mailpit` trong Docker; `localhost` khi chạy Mailpit trên máy |
| `SMTP_PORT`              | Cổng SMTP                               | `1025`                                                        |
| `SMTP_SECURE`            | Dùng TLS ngay từ đầu hay không          | `false` cho Mailpit                                           |
| `SMTP_USER`, `SMTP_PASS` | Thông tin SMTP nếu nhà cung cấp yêu cầu | để trống với Mailpit                                          |
| `MAIL_FROM`              | Địa chỉ/người gửi hiển thị              | `ic_goz_crm <noreply@example.test>`                           |
| `OPENAI_API_KEY`         | Khóa tích hợp AI, nếu sử dụng           | để trống nếu không dùng                                       |

Sau khi đổi biến môi trường Docker, áp dụng lại bằng:

```bash
docker compose up -d --build
```

### Gửi email thật

Mailpit mặc định nhận thư tại giao diện nội bộ nên **không gửi ra email thật**. Để gửi thật, thay các biến SMTP bằng thông tin của nhà cung cấp (ví dụ SMTP công ty, Amazon SES, SendGrid hoặc Gmail Workspace), đồng thời dùng địa chỉ `MAIL_FROM` đã được nhà cung cấp xác thực.

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
MAIL_FROM="ic_goz_crm <billing@example.com>"
```

Không dùng thông tin SMTP thật trong môi trường local hoặc file `.env` được commit.

## Phát triển cục bộ

Yêu cầu: Node.js 20.9.0+, npm 10.2.4+, một MongoDB đang chạy và (nếu cần email thử nghiệm) Mailpit.

```bash
cp .env.example .env

npm install
make mongo-up
npm run setup
```

Chạy backend và Vite ở hai terminal riêng:

```bash
make dev-backend
make vite
```

Hoặc dùng một lệnh để chạy cả hai:

```bash
make dev
```

Khi backend chạy bên ngoài Docker nhưng Mailpit chạy cục bộ, đặt `SMTP_HOST=localhost`. Khi cả hai chạy trong Docker Compose, giữ `SMTP_HOST=mailpit`.

## 8. Quy trình sử dụng chuẩn

1. Đăng nhập, đổi mật khẩu mặc định và vào **Cài đặt** để khai báo công ty, tiền tệ, logo và ngôn ngữ.
2. Tạo thuế và phương thức thanh toán phù hợp.
3. Tạo khách hàng với email hợp lệ.
4. Lập hóa đơn tạm tính hoặc hóa đơn; thêm các dòng hàng/dịch vụ và kiểm tra tổng tiền.
5. Lưu, tải PDF hoặc dùng chức năng gửi email. Với cấu hình mặc định, kiểm tra thư tại Mailpit.
6. Khi nhận tiền, ghi nhận thanh toán để cập nhật trạng thái chứng từ và tạo biên nhận.

## Kiểm thử

```bash
make test       # unit/contract tests
make check      # test và build frontend production
make lint       # ESLint frontend trong container tạm
```

### Kiểm tra thủ công

Trước khi bàn giao hoặc triển khai, xác nhận tối thiểu:

- [ ] Đăng nhập được và không còn dùng mật khẩu quản trị mặc định.
- [ ] Tạo/sửa/xóa khách hàng, hóa đơn tạm tính, hóa đơn và thanh toán hoạt động đúng.
- [ ] Tổng tiền, thuế, số tiền đã trả và trạng thái thanh toán khớp dữ liệu nhập.
- [ ] PDF tải được và email xuất hiện trong Mailpit; không có thư thật nào được gửi ở môi trường test.
- [ ] Chuyển Việt/Anh trong **Cài đặt** và các nhãn, trạng thái chính hiển thị đúng.
- [ ] Giao diện kiểm tra ở desktop, tablet và mobile; bảng không vỡ với tên hoặc địa chỉ dài.
- [ ] Frontend build thành công:

```bash
npm run build
```

### Tải PDF

Endpoint PDF yêu cầu Bearer token. Không mở trực tiếp URL `/download/...` trên thanh địa chỉ. Hãy dùng nút **Download** trong giao diện sau khi đăng nhập; frontend sẽ gửi token và tải file PDF an toàn.

## Triển khai và bảo mật

- Dùng `JWT_SECRET` ngẫu nhiên, dài và khác nhau giữa development/staging/production.
- Đặt frontend sau HTTPS, giới hạn CORS theo domain thật và không mở MongoDB công khai.
- Chỉ công bố cổng cần thiết; giao diện Mailpit không nên mở ra Internet.
- Dùng SMTP thật đã xác thực tên miền cho production; theo dõi lỗi gửi mail và log backend.
- Sao lưu MongoDB định kỳ, kiểm thử khôi phục và cập nhật dependencies theo lịch.
- Tạo tài khoản quản trị riêng cho từng người vận hành; không dùng chung tài khoản seed.

## Cấu trúc mã nguồn

```text
backend/       Express API, model Mongoose, PDF và gửi email
frontend/      React SPA, i18n, Redux và giao diện Ant Design
package.json   Manifest Node.js duy nhất cho toàn bộ dự án
Makefile       Lệnh phát triển, kiểm thử và Docker
docker-compose.yml
.env.example   Mẫu cấu hình môi trường
```

## Giấy phép

Dự án sử dụng giấy phép được nêu trong [LICENSE](LICENSE).
