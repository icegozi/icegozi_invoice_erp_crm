# Invoice ERP/CRM

Invoice ERP/CRM quản lý khách hàng, báo giá, hóa đơn, phiếu thu, thuế và phương thức thanh toán.
Ứng dụng có giao diện Việt/Anh, xuất PDF và gửi chứng từ qua SMTP.

Phiên bản khai báo: **4.1.0**. Stack: React/Vite, Express, Mongoose, MongoDB và Docker Compose.

## Trạng thái sản phẩm

Các luồng nghiệp vụ hiện có phục vụ đánh giá local hoặc môi trường riêng đã kiểm tra.
**Chưa đủ bằng chứng để phát hành SaaS dùng chung cho nhiều doanh nghiệp.**
Schema có `organizationId` nhưng bộ lọc dữ liệu, settings và đường phục vụ file chưa cô lập tenant đồng bộ.
Việc chuẩn hóa tài liệu không thay thế triển khai và kiểm thử các điều kiện này.

Xem [mục lục tài liệu](docs/README.md) để chọn hướng dẫn theo vai trò.

## Chạy local bằng Docker

Cần Docker Desktop ở chế độ Linux containers hoặc Docker Engine có Docker Compose.
Chạy lệnh từ thư mục gốc repository. Cách này không cần Make hoặc Node.js trên máy host.

### Tạo cấu hình

PowerShell:

```powershell
if (-not (Test-Path -LiteralPath '.env')) {
  Copy-Item -LiteralPath '.env.example' -Destination '.env'
}
```

Bash:

```bash
test -f .env || cp .env.example .env
```

Đặt `JWT_SECRET` riêng trong `.env` trước khi sử dụng ngoài môi trường thử nghiệm local.
Không đưa file cấu hình chứa bí mật vào Git.

### Khởi động và kiểm tra

```bash
docker compose up --detach --build
docker compose ps
docker compose logs --tail=50 backend
```

Đợi backend báo `Express running` trước khi đăng nhập.
Lần đầu với database rỗng, entrypoint tự tạo quản trị viên và cấu hình nền.
Không chạy lại `npm run setup` trên database đã khởi tạo.

| Dịch vụ | Địa chỉ local | Ghi chú |
| --- | --- | --- |
| Web | <http://localhost:3000> | Giao diện sử dụng |
| API | <http://localhost:8000/health> | Chỉ kiểm tra API phản hồi |
| Mailpit | <http://localhost:8026> | Xem email thử nghiệm |
| MongoDB | `mongodb://localhost:27017/invoice?replicaSet=rs0` | Chỉ phục vụ local |

Tài khoản khởi tạo trong mã nguồn: `admin@admin.com` / `admin123`.
Chỉ dùng để vào môi trường local mới và đổi mật khẩu sau lần đăng nhập đầu.
Dữ liệu nghiệp vụ mẫu trong một database cụ thể không phải dữ liệu mặc định của source code.

Compose dùng tên container và cổng cố định. Không chạy nguyên file này đồng thời từ nhiều checkout.
Thử nghiệm song song phải cách ly cả tên container, cổng, network và volumes.

### Dừng ứng dụng

```bash
docker compose stop
```

Lệnh trên giữ dữ liệu trong volumes.
Không dùng `docker compose down --volumes` nếu cần giữ database/uploads.

## Phát triển và kiểm tra

- [Frontend](frontend/README.md): điểm vào cho React/Vite.
- [Vận hành](ops/README.md): điểm vào cho người quản trị.
- [Tài liệu đầy đủ](docs/README.md): nghiệp vụ, kỹ thuật, bảo mật và SaaS.
- Backend: `npm --prefix backend test`, sau khi cài dependencies.
- Frontend: `npm --prefix frontend run build`; chưa có test suite trong package scripts.
- Package độc lập nằm tại `backend/` và `frontend/`; không dùng npm install ở thư mục gốc.

## Giấy phép

Repository sử dụng [GNU Affero General Public License phiên bản 3](LICENSE).
Tên “Fair-code” không thay thế nội dung giấy phép trong file này.

Nguồn đối chiếu: [Compose](docker-compose.yml), [backend package](backend/package.json),
[frontend package](frontend/package.json) và [entrypoint](backend/docker-entrypoint.sh).
