# Triển khai và phát hành

Đối tượng: người vận hành, Maintainer và người phê duyệt phát hành.
Phụ trách: Maintainer vận hành. Trạng thái: local hiện có; staging/production là yêu cầu chuẩn bị.
Phiên bản đối chiếu: `4.1.0`, baseline `d9187d0`. Rà soát: `2026-10-18`.

## Phân biệt môi trường

| Môi trường | Trạng thái và mục đích |
| --- | --- |
| Local | Compose hiện tại; dữ liệu giả, Mailpit, phục vụ phát triển/nghiệm thu riêng |
| Staging | Cần cấu hình cách ly, secret và database riêng; không dùng chung volumes với production |
| Production SaaS | Chưa sẵn sàng; phải hoàn tất các điều kiện P0 trong [readiness](../security/saas-readiness.md) |

`NODE_ENV=production` trong Compose chỉ là biến runtime, không chứng nhận stack đã được harden.
Mongo single-node replica set chỉ bật transaction, không tương đương cụm database HA.
Không có cấu hình reverse proxy TLS, HA, autoscaling hoặc deployment cloud đầy đủ trong repository.

## Local

Thực hiện [quickstart](../../README.md#chạy-local-bằng-docker).
Compose có các đặc điểm phải hiểu trước khi công bố ra Internet:

- MongoDB publish `27017`, chưa bật xác thực database trong cấu hình mẫu.
- API publish `8000` và web publish `3000` trên host.
- Mailpit UI bind loopback `127.0.0.1:8026`; SMTP dùng nội bộ.
- JWT có fallback phát triển và bootstrap có mật khẩu quản trị công khai.
- `CORS_ORIGINS` và biến rate limit chưa được map từ root env vào backend.
- File public có thể chứa tài liệu khách hàng chưa được kiểm soát theo tenant.

Các điểm này là giới hạn của cấu hình mẫu, không phải hướng dẫn giữ nguyên khi triển khai production.

## Cách ly staging hoặc thử nghiệm song song

`docker compose -p <name>` chỉ đổi tên project, không sửa `container_name` hoặc cổng host cố định.
Tạo cấu hình Compose riêng trong thư mục vận hành không commit secret.
Kiểm tra cấu hình resolve trước khi chạy; giữ kín output chứa environment.

| Thành phần | Yêu cầu cách ly |
| --- | --- |
| Project, containers, network | Tên riêng, không trùng bất kỳ dịch vụ đang sử dụng |
| Mongo/Uploads volumes | Tên riêng; kiểm tra không có `external`/`name` trỏ volume hiện hữu |
| Ports | Không đụng `3000/8000/8026/27017` đang dùng; chỉ bind loopback khi kiểm tra local |
| Backend DATABASE | Trỏ Mongo thuộc network thử nghiệm; tuyệt đối không trỏ database khách hàng |
| Frontend build | URL API/file phải trỏ backend thử nghiệm, không trỏ API thật |
| Mail | SMTP Mailpit của thử nghiệm; bỏ credential SMTP thật |
| Credentials | Secret riêng và tài khoản thử nghiệm; không dùng production secret |

Khi tái sử dụng image backend, phải xác nhận source/version tương ứng release đang đánh giá.
Frontend cần build đúng URL môi trường; không chỉ đổi env ở Nginx.

## Điều kiện trước production

- Hoàn thành tenant isolation và kiểm thử âm giữa ít nhất hai tenant cho mọi nhóm dữ liệu.
- Migration dữ liệu cũ có chủ sở hữu và rollback đã thử; không trộn bản ghi thiếu tenant vào hệ thống chia sẻ.
- Secret riêng; bootstrap production không để lại mật khẩu mẫu hoặc tài khoản dùng chung.
- TLS, domain và reverse proxy; database chỉ truy cập qua mạng riêng, có xác thực và quyền tối thiểu.
- Kiểm soát đường public/file, upload authorization, dung lượng và nội dung trước khi cho dữ liệu thật.
- Xác nhận CORS, proxy/client IP, rate limit và nơi lưu session khi chạy nhiều instance.
- Backup/restore cả database và uploads đã nghiệm thu; secret backup không lưu cùng archive công khai.
- Xác nhận runtime/dependency được hỗ trợ, logging, cảnh báo và người chịu trách nhiệm xử lý sự cố.
- SMTP đã được cấu hình và kiểm thử gửi nhận trong môi trường phù hợp.

Đây là yêu cầu mục tiêu. Đợt chuẩn hóa docs không tự thay đổi cấu hình hoặc triển khai các cơ chế đó.

## Quy trình phát hành

1. Chọn commit và ghi phiên bản khai báo, image digest, migration cần thiết và người phê duyệt.
2. Chạy CI ứng dụng và CI tài liệu; kiểm tra kết quả thực tế thay vì chỉ dựa vào badge.
3. Nghiệm thu staging: đăng nhập, chứng từ, công nợ, PDF, email và các điều kiện bảo mật đã cam kết.
4. Tạo backup nhất quán DB/uploads; xác nhận restore được trước khi thay đổi dữ liệu không tương thích.
5. Đặt maintenance window nếu migration/rollback cần dừng ghi; cấp cấu hình qua kênh quản lý secret.
6. Deploy image đã nghiệm thu; kiểm tra API, DB primary, phiên đăng nhập và một giao dịch kiểm tra được phê duyệt.
7. Theo dõi log/lỗi tài chính và xác nhận hoàn tất; ghi những việc chưa nghiệm thu trong biên bản.

Hiện chưa có migration runner tổng quát: script `upgrade` trỏ đến file không tồn tại.
Không chạy script đó hoặc giả định mọi phiên bản có thể nâng cấp tự động.

## Rollback

Đọc tương thích schema trước khi rollback image.
Nếu chỉ đổi tài liệu, không cần rollback database.
Với release ứng dụng tương lai, dùng image/digest và cấu hình đã lưu; không rebuild tag trôi nổi để rollback.
Nếu phải khôi phục dữ liệu, dừng ghi, kiểm thử bản backup trong hệ thống cách ly rồi thực hiện theo phê duyệt vận hành.
Rollback database có thể mất dữ liệu phát sinh sau thời điểm backup; đây là quyết định vận hành phải được ghi nhận.

## Giám sát

`GET /health` trả `200 {"success":true}` ngay tại Express; không phải DB readiness.
Kiểm tra thêm trạng thái Mongo primary, replica set, ổ đĩa, dung lượng uploads, lỗi PDF và lỗi SMTP.
Log request hiện gồm method, path, status và duration; chưa có audit trail nghiệp vụ theo tenant.
SLA, RPO/RTO, ngưỡng cảnh báo, on-call và thời hạn lưu dữ liệu chưa được xác nhận trong repository.
Không điền một con số mục tiêu vào hợp đồng chỉ từ tài liệu này.

## Nguồn đối chiếu

- [Compose](../../docker-compose.yml), [entrypoint](../../backend/docker-entrypoint.sh).
- [Health/logging](../../backend/src/app.js), [security middleware](../../backend/src/middlewares/security.js).
- [Frontend build](../../frontend/Dockerfile), [backend package](../../backend/package.json).
- [CI ứng dụng](../../.github/workflows/ci.yml).
