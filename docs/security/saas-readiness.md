# Điều kiện phát hành SaaS

Đối tượng: chủ sản phẩm, reviewer kỹ thuật/bảo mật và đội vận hành.
Phụ trách: Maintainer tổng hợp; các vai trò trong bảng là trách nhiệm cần được phân công.
Trạng thái: **chưa đủ điều kiện phát hành SaaS chia sẻ cho khách hàng thật**.
Phiên bản đối chiếu: `4.1.0`, baseline `d9187d0`. Rà soát: `2026-10-18`.

## Cách đánh giá

P0 là điều kiện phải hoàn tất trước khi nhiều doanh nghiệp dùng chung hệ thống.
P1 phải được xử lý hoặc có quyết định chấp nhận rủi ro và giới hạn cung cấp dịch vụ rõ ràng.
“Chưa đủ bằng chứng” không có nghĩa đã hoàn thành; cập nhật trạng thái cần kèm test/review/release cụ thể.
Đợt tài liệu này chỉ ghi hiện trạng, không triển khai các thay đổi bên dưới.

## Bảng nghiệm thu

| Ưu tiên | Hạng mục | Hiện trạng/bằng chứng | Phụ trách | Điều kiện nghiệm thu |
| --- | --- | --- | --- | --- |
| P0 | Tenant context | Auth JWT xác định user; organizationId tùy chọn; login tra email toàn cục [auth](../../backend/src/controllers/middlewaresControllers/createAuthMiddleware) | Backend + Security | Danh tính/membership/tenant được xác định từ server; không tin tenant do client gửi |
| P0 | CRUD, search, list và summary | Nhiều truy vấn chỉ dùng id/removed; [CRUD](../../backend/src/controllers/middlewaresControllers/createCRUDController) và [controllers](../../backend/src/controllers/appControllers) | Backend | Hai tenant không đọc/sửa/xóa/tìm/tổng hợp dữ liệu nhau, kể cả gọi ID trực tiếp |
| P0 | Tham chiếu nghiệp vụ | [Payment create](../../backend/src/controllers/appControllers/paymentController/create.js) tìm invoice bằng ID; các ref chưa kiểm tra đầy đủ scope/currency | Backend | Client, invoice, quote, paymentMode, assignee và currency được kiểm tra trong cùng tenant |
| P0 | Settings và counters | [Settings](../../backend/src/middlewares/settings) còn load theo phạm vi toàn cục; quote/payment chưa cấp số giống invoice | Backend | Giá trị, cache và bộ đếm tách tenant; tạo đồng thời không trùng hoặc lấy cấu hình tenant khác |
| P0 | File/PDF | [Public route](../../backend/src/routes/coreRoutes/corePublicRouter.js) không auth; PDF nằm trong public root | Backend + Security | Mọi đường truy cập file khách hàng đều kiểm tra tenant; public URL không vượt được policy |
| P0 | Upload authorization | [Core routes](../../backend/src/routes/coreRoutes/coreApi.js) đặt ghi upload trước role gate ở setting/upload | Backend + Security | User thiếu quyền/khác tenant không tạo hoặc đọc file, có kiểm tra nội dung và giới hạn phù hợp |
| P0 | Migration tenant | [Schemas](../../backend/src/models) cho phép thiếu organizationId; upgrade script đích chưa có | Backend + Operations | Backfill/kiểm kê dữ liệu cũ, phát hiện orphan và diễn tập rollback trước bật SaaS |
| P0 | Vòng đời phiên | [Auth/user handlers](../../backend/src/controllers/middlewaresControllers) chưa chứng minh disable/đổi quyền/đổi mật khẩu thu hồi đúng phiên | Backend + Security | Test disable, reset, logout, đổi role và xóa membership thực thi policy đã xác nhận |
| P0 | Toàn vẹn tài chính | Có helper và transaction ở một số luồng; sửa/xóa chứng từ và đồng thời chưa được nghiệm thu đầy đủ [invoice](../../backend/src/controllers/appControllers/invoiceController) | Backend + Kế toán | Test sửa hóa đơn đã thu, race, overpayment, hủy/xóa, số âm và audit; số dư không sai |
| P0 | Production secrets/network | [Compose](../../docker-compose.yml) là local, có secret fallback/bootstrap công khai và Mongo publish | Operations + Security | Cấu hình production được review: secret riêng, DB riêng mạng, TLS, không còn bootstrap/default nguy hiểm |
| P0 | Khôi phục dữ liệu | Có [dump script](../../ops/backup-mongodb.sh), chưa có bằng chứng restore toàn bộ dịch vụ | Operations | Diễn tập khôi phục DB+uploads, đối chiếu số dư/file và ghi kết quả; chốt RPO/RTO |
| P1 | Logging và giám sát | [Request logger](../../backend/src/middlewares/security.js) chưa là audit trail tenant | Operations + Backend | Log đã loại secret, có tenant/correlation theo policy và cảnh báo được kiểm thử |
| P1 | Mở rộng nhiều instance | Limiter trong process, Chromium/file local [PDF](../../backend/src/controllers/pdfController/index.js) | Architecture + Operations | Test tài nguyên, rate limit, file/session và failover theo kiến trúc đã duyệt |
| P1 | Chính sách và hỗ trợ | Repo chưa xác nhận retention, xóa/export tenant, kênh bảo mật, SLA hoặc hỗ trợ | Product + Security | Có chính sách được chủ sản phẩm phê duyệt, quy trình thi hành và người chịu trách nhiệm |
| P1 | Runtime/dependencies | Manifests/Docker/CI khai báo phiên bản; chưa có chính sách hỗ trợ được duyệt | Maintainer | Xác nhận phiên bản hỗ trợ, đánh giá dependency và lịch cập nhật bằng bằng chứng |

## Bằng chứng tối thiểu cho tenant isolation

Dùng ít nhất tenant A/B, có user theo vai trò và dữ liệu/file của mỗi bên.
Kiểm tra ID trực tiếp, query tìm kiếm/phân trang, summary, chuyển báo giá, thu/sửa/xóa tiền và settings.
Kiểm tra cả route public/download/upload, dữ liệu legacy thiếu tenant và role cao thuộc tenant khác.
Kiểm tra request đồng thời để chứng minh counters, tham chiếu và công nợ không vượt scope hoặc sai tổng.
Test phải chạy ở môi trường cách ly, không dùng database đang phục vụ người dùng.

Không đưa những test này vào danh sách “đã đạt” chỉ vì unit/route contract tests hiện có thành công.

## Quyết định phát hành

Người phê duyệt sản phẩm, kỹ thuật, bảo mật và vận hành phải có kết quả nghiệm thu tương ứng.
Chỉ đổi trạng thái tài liệu sang sẵn sàng SaaS khi tất cả P0 đạt và P1 có kết luận được ghi nhận.
Không suy ra SSO, MFA, HA, chứng nhận tuân thủ hoặc khả năng đáp ứng SLA từ tên Enterprise.
Giấy phép phải khớp [LICENSE](../../LICENSE); tài liệu này không thay đổi giấy phép hay đưa cam kết pháp lý mới.

## Liên quan

- [Mô hình bảo mật](security-model.md).
- [Kiến trúc](../technical/architecture.md).
- [Triển khai](../operations/deployment.md) và [runbook](../operations/runbook.md).
