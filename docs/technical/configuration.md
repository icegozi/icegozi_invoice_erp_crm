# Cấu hình và biến môi trường

Đối tượng: lập trình viên và người vận hành.
Phụ trách: Maintainer kỹ thuật. Trạng thái: mapping theo mã nguồn hiện tại.
Phiên bản đối chiếu: `4.1.0`, baseline `d9187d0`. Rà soát: `2026-10-18`.

## Nơi đọc cấu hình

| Entry point | Nguồn đọc | Ghi chú |
| --- | --- | --- |
| Docker Compose | `.env` ở root và environment của shell Compose | Chỉ biến được map trong environment/build.args mới được truyền |
| Backend server | Root `.env` rồi `.env.local` | dotenv không bật override; biến đã có không bị file sau ghi đè |
| Setup/reset | `backend/.env` rồi `backend/.env.local` | Đường dẫn tính từ vị trí script; khác server |
| CLI reconcile/overpayment | Root `.env` rồi `.env.local` | Các CLI này có thể ghi database |
| Vite | `envDir` ở root, qua `loadEnv` theo mode | Dùng quy tắc Vite; không suy ra từ quy tắc dotenv backend |

Không khẳng định `.env.local` luôn ghi đè process environment.
Compose không tự đưa toàn bộ root `.env` vào container.
Docker build không copy root `.env`; file bị loại bởi `.dockerignore`.
Không tạo thêm file chứa bí mật để chữa triệu chứng nếu chưa xác định entrypoint đang chạy.

## Backend runtime

“Có map” là map trong Compose hiện tại; giá trị “native” là fallback khi chạy Node trực tiếp.

| Biến | Nơi đọc / native default | Compose hiện tại | Nhạy cảm |
| --- | --- | --- | --- |
| `DATABASE` | server/setup/CLI; không có fallback kết nối | URI Mongo nội bộ bị cố định; bỏ qua DATABASE root | Có |
| `PORT` | server; `8000` | Cố định `8000` | Không |
| `NODE_ENV` | auth/error handling | Cố định `production` dù stack phục vụ local | Không |
| `JWT_SECRET` | JWT sign/verify; cần cung cấp | Có map, có fallback local dễ đoán | Có |
| `FRONTEND_URL` | reset link và fallback CORS; reset mặc định localhost:3000 | Có map | Không |
| `CORS_ORIGINS` | security; nếu trống dùng FRONTEND_URL | Chưa map; root .env không tự truyền | Không |
| `API_RATE_LIMIT` | security; `300`/15 phút | Chưa map; dùng fallback | Không |
| `AUTH_RATE_LIMIT` | security; `50` request thất bại/15 phút trên toàn `/api`, gồm lỗi nghiệp vụ | Chưa map; dùng fallback | Không |
| `PUBLIC_SERVER_FILE` | PDF; không có fallback ở chỗ gán settings | Lấy từ `VITE_BACKEND_SERVER` | Không |
| `SMTP_HOST` | mailer; `localhost` | Có map, default `mailpit` | Có thể |
| `SMTP_PORT` | mailer; `1025`, phải 1–65535 | Có map | Không |
| `SMTP_SECURE` | mailer; true khi chuỗi đúng `true` | Có map, default `false` | Không |
| `SMTP_USER` / `SMTP_PASS` | auth SMTP khi có cả hai | Có map, default trống | Có |
| `MAIL_FROM` | người gửi email, fallback invoicecrm.test | Có map | Không |
| `OPENING_EMAIL` | fallback mailer/useAppSettings | Chưa map | Không |
| `PUPPETEER_EXECUTABLE_PATH` | PDF launcher; browser Puppeteer nếu chưa đặt | Dockerfile đặt `/usr/bin/chromium` | Không |
| `OPENAI_API_KEY` | server đọc vào biến | Có map, default trống; không chứng minh có API AI hoạt động | Có |

JWT secret phải do người vận hành cấp riêng trước khi dùng ngoài local.
Các placeholder trong mẫu không phải secret dùng được cho staging/production.
Các biến CORS/rate limit chưa map là giới hạn cấu hình cần xử lý trong đợt triển khai hạ tầng riêng.

Module storage cũ còn đọc `DO_SPACES_SECRET, DO_SPACES_KEY, DO_SPACES_URL, DO_SPACES_NAME, REGION`.
Các route profile/logo hiện dùng storage local; không công bố object storage như tính năng đang được cấu hình sẵn.
Không đưa các khóa này vào frontend.

## Frontend và thời điểm build

| Biến | Hành vi | Map trong Docker build hiện tại |
| --- | --- | --- |
| `VITE_BACKEND_SERVER` | Base URL API/download; cần dấu `/` cuối | Có, default `http://localhost:8000/` |
| `VITE_FILE_BASE_URL` | Base URL file | Có, default `http://localhost:8000/` |
| `VITE_FRONTEND_URL` | WEBSITE_URL production, fallback `/` | Chưa có build arg tương ứng |
| `VITE_DEV_REMOTE` | Bật remote API khi dev; script dev:remote đặt `remote` | Không phải tham số runtime của Nginx |
| `import.meta.env.PROD` | Boolean do Vite xác định khi build production | Không phải secret hoặc công tắc backend |

Giá trị `VITE_*` được nhúng vào JavaScript mà người dùng tải được.
Không đặt mật khẩu, khóa API hoặc JWT secret trong những biến này.
Thay env của container Nginx sau khi build không thay URL đã nhúng; phải rebuild frontend.

Ví dụ địa chỉ giả khi chuẩn bị cấu hình build cho môi trường đã được phê duyệt:

```dotenv
FRONTEND_URL=https://app.example.test
VITE_BACKEND_SERVER=https://api.example.test/
VITE_FILE_BASE_URL=https://api.example.test/
```

Đây là ví dụ tên miền, không phải cấu hình production hoàn chỉnh.
`DATABASE` trong Compose vẫn trỏ service Mongo nội bộ dù đổi dòng đó trong root `.env`.

## Áp dụng thay đổi local

Frontend đổi build args:

```bash
docker compose up --detach --build frontend
```

Backend đổi biến đã được map:

```bash
docker compose up --detach backend
```

Compose tạo lại container nếu cấu hình thay đổi; `restart` đơn thuần không nạp environment mới.
Đổi biến chưa map trong root `.env` không làm biến đó xuất hiện trong container.
Không chạy `docker compose config` vào log công khai vì output có thể chứa giá trị đã resolve của secret.

## Settings trong database

Thông tin doanh nghiệp, tiền tệ, locale, logo và các bộ đếm còn nằm trong collection settings.
Chúng khác với biến môi trường và được nạp khi xử lý nghiệp vụ/PDF.
API settings hiện chưa có tenant filter đồng bộ; không dùng như thiết lập riêng của nhiều doanh nghiệp.
Không reset database để áp dụng một thay đổi cấu hình.

## Nguồn đối chiếu

- [Env mẫu](../../.env.example), [Compose](../../docker-compose.yml), [Docker ignore](../../.dockerignore).
- [Server](../../backend/src/server.js), [setup](../../backend/src/setup/setup.js), [CLI](../../backend/src/cli).
- [Security](../../backend/src/middlewares/security.js), [mailer](../../backend/src/handlers/mailHandler/mailer.js).
- [App settings](../../backend/src/settings/useAppSettings.js), [PDF](../../backend/src/controllers/pdfController/index.js).
- [Frontend Dockerfile](../../frontend/Dockerfile), [Vite](../../frontend/vite.config.mjs).
- [API URL config](../../frontend/src/config/serverApiConfig.js), [settings loader](../../backend/src/middlewares/settings).
