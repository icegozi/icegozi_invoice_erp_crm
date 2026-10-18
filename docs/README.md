# Tài liệu Invoice ERP/CRM

Đối tượng: người dùng nghiệp vụ, lập trình viên, vận hành và người đánh giá SaaS.
Phụ trách: Maintainer. Trạng thái: hiện trạng và điều kiện phát hành.
Phiên bản đối chiếu: `4.1.0`, baseline `d9187d0`. Rà soát: `2026-10-18`.

## Đọc theo vai trò

| Vai trò | Điểm bắt đầu |
| --- | --- |
| Người đánh giá sản phẩm | [Giới thiệu và quickstart](../README.md) |
| Lập trình viên frontend | [Frontend](../frontend/README.md) |
| Người vận hành | [Điểm vào vận hành](../ops/README.md) |
| Agent | [Hướng dẫn agent](../CLAUDE.md) |

## Sản phẩm và kỹ thuật

- [Hướng dẫn nghiệp vụ](product/user-guide.md): khách hàng đến thu tiền, trạng thái và PDF/email.
- [Kiến trúc và dữ liệu](technical/architecture.md): thành phần, quan hệ model và mục tiêu tenant.
- [Phát triển](technical/development.md): Docker/native, PowerShell/Bash và kiểm thử.
- [API hiện tại](technical/api.md): route, body, quyền, lỗi và các khác biệt giữa handler.
- [Cấu hình](technical/configuration.md): nguồn env, giá trị mặc định, mapping và build/runtime.

## Cách hiểu trạng thái

- **Hiện có:** đã đối chiếu với code, chưa mặc nhiên đạt kiểm thử production.
- **Mục tiêu SaaS:** khả năng cần có để nhiều doanh nghiệp dùng chung hệ thống.
- **Chưa hoàn thành:** chưa triển khai hoặc chưa đủ bằng chứng nghiệm thu.

Tên sản phẩm thống nhất: **Invoice ERP/CRM**.
`icegozi_invoice_erp_crm` là tên repository; `ic_goz_crm` còn xuất hiện trong giao diện.
Không đổi định danh trong code bằng một thay đổi tài liệu.

## Vận hành

- [Triển khai và phát hành](operations/deployment.md): local, staging, production và rollback.
- [Runbook](operations/runbook.md): backup DB/uploads, restore cách ly, giám sát và xử lý sự cố.
- [Mô hình bảo mật](security/security-model.md): auth, RBAC, file và phạm vi dữ liệu.
- [Readiness SaaS](security/saas-readiness.md): ưu tiên, bằng chứng, người phụ trách và điều kiện phát hành.

Compose hiện phục vụ local. Bootstrap quản trị viên khác với dữ liệu nghiệp vụ mẫu.
Chưa có bằng chứng cô lập tenant trên toàn bộ API, settings và đường phục vụ file.
Không đưa dữ liệu khách hàng thật vào SaaS chia sẻ chỉ dựa trên hướng dẫn local.

## Nguồn sự thật

Quy chuẩn, vai trò review và lệnh kiểm tra nằm trong [CONTRIBUTING](../CONTRIBUTING.md).
Thay đổi đã thực hiện được ghi ở [CHANGELOG](../CHANGELOG.md).
Kết quả kiểm tra nằm trong [biên bản nghiệm thu](verification/2026-10-18-documentation.md).

Ưu tiên route, controller, schema, package scripts và cấu hình thực tế khi nội dung cũ mâu thuẫn.
Tài liệu bổ sung phải ghi nguồn đối chiếu và tách hiện trạng khỏi mục tiêu.
Giấy phép lấy từ [LICENSE](../LICENSE); phiên bản lấy từ package manifests.
