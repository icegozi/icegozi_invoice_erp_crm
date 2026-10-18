# Mô hình bảo mật hiện tại

Đối tượng: reviewer bảo mật, lập trình viên và người vận hành.
Phụ trách: Maintainer bảo mật. Trạng thái: hiện trạng và giới hạn; chưa phải chứng nhận.
Phiên bản đối chiếu: `4.1.0`, baseline `d9187d0`. Rà soát: `2026-10-18`.

## Danh tính và phiên

Login tra tài khoản theo email, kiểm tra enabled rồi so khớp mật khẩu bcrypt.
JWT chứa ID tài khoản; backend tra user và bản ghi mật khẩu, kiểm tra loggedSessions cho từng request.
Logout có token loại token đó khỏi loggedSessions.
Reset password dùng token ngẫu nhiên 32 byte, lưu hash và hạn 15 phút; token được dùng một lần qua update có điều kiện.

Các giới hạn chưa hoàn thành:

- Tra login theo email chưa xác định tenant; email theo schema có index kết hợp organizationId/email.
- Middleware token không kiểm tra enabled ở mọi request; không giả định tắt user sẽ thu hồi mọi phiên.
- Đổi/reset mật khẩu không đồng nghĩa mọi loggedSessions cũ đã bị vô hiệu.
- Chưa có bằng chứng MFA, SSO hoặc cơ chế membership/invite/switch tenant đầy đủ.
- Lỗi login/forget có thể phân biệt email tồn tại; không công bố chống account enumeration hoàn chỉnh.

Thông tin có giá trị nhạy cảm: JWT, password hash/salt, reset token, SMTP password và database URI.
Không log hoặc đưa vào tài liệu những giá trị thực.

## Vai trò và phạm vi dữ liệu

RBAC cho phép ghi theo ngưỡng sales/accountant/admin.
Quyền owner/admin của một số route core được kiểm tra tường minh.
Nhiều route đọc nghiệp vụ chỉ kiểm tra đăng nhập.
Role hợp lệ chưa có nghĩa tài khoản thuộc doanh nghiệp sở hữu bản ghi.

`organizationId` và index đã được thêm vào schema, nhưng nhiều truy vấn vẫn chỉ lọc theo ID/removed.
Payment có thể tìm invoice theo ID trước khi kiểm tra quyền tenant.
Settings loader và cập nhật settingKey còn dùng phạm vi toàn cục.
Không bật một database chia sẻ cho nhiều doanh nghiệp thật trước khi hoàn tất các phần này.

## File, PDF và upload

Route `/download` yêu cầu Bearer và có ownership filter.
Route `/public/:subPath/:directory/:file` không yêu cầu Bearer;
nó giới hạn traversal trong public root nhưng chưa phân quyền tenant.
PDF được sinh dưới public/download nên cần kiểm thử khả năng truy cập qua route public khi biết tên file.
Không coi URL khó đoán là kiểm soát truy cập.

Upload profile/logo lưu vào uploads local.
MIME filter chưa phải content scanning, quota hoặc bảo đảm giới hạn kích thước toàn hệ thống.
Ở route setting/upload, middleware ghi file chạy trước role gate.
`isPublic`/`isSecure` trong metadata không chứng minh mọi đường phục vụ file đã thực thi các thuộc tính này.

## Các lớp bảo vệ hiện có

- CORS allowlist dựa trên CORS_ORIGINS hoặc FRONTEND_URL, không phải phân quyền dữ liệu.
- Rate limit API và auth trong process; chưa phải giới hạn phân tán theo tenant.
- Security headers được đặt ở Express; TLS/reverse proxy chưa được cấu hình đầy đủ trong repo.
- Money helpers và một số transaction giảm sai lệch công nợ, không thay thế audit trail hoặc kiểm soát tenant.
- Handler production tổng quát che lỗi, nhưng các wrapper/handler riêng có thể trả chi tiết khác nhau.

Phải kiểm tra mọi đường lỗi trước khi tuyên bố đã lọc toàn bộ thông tin nội bộ.

## Dữ liệu và xử lý sự cố

Hiện repo chưa xác nhận chính sách retention, xóa dữ liệu tenant, RPO/RTO hoặc kênh tiếp nhận bảo mật công khai.
Maintainer sản phẩm phải xác nhận các chính sách trước khi dùng làm tài liệu cam kết.
Trong môi trường riêng, báo sự cố cho người quản trị được đơn vị triển khai chỉ định;
không đính kèm token, bản dump hoặc dữ liệu khách hàng vào issue công khai.

Bản backup có thể chứa password hash, session và tài liệu khách hàng.
Hạn chế quyền đọc, bảo vệ bằng cơ chế mã hóa/lưu trữ của đơn vị vận hành và thử restore trong môi trường cách ly.
Không cung cấp dữ liệu đó cho các job CI tài liệu.

Xem [readiness SaaS](saas-readiness.md) để biết các điều kiện nghiệm thu chưa hoàn thành.

## Nguồn đối chiếu

- [Auth handlers](../../backend/src/controllers/middlewaresControllers/createAuthMiddleware).
- [Role middleware](../../backend/src/middlewares/authorize.js), [route core](../../backend/src/routes/coreRoutes/coreApi.js).
- [Payment create](../../backend/src/controllers/appControllers/paymentController/create.js).
- [Settings loader](../../backend/src/middlewares/settings/loadSettings.js).
- [Public file](../../backend/src/routes/coreRoutes/corePublicRouter.js), [download](../../backend/src/handlers/downloadHandler/downloadPdf.js).
- [Upload](../../backend/src/middlewares/uploadMiddleware/singleStorageUpload.js), [security](../../backend/src/middlewares/security.js).
