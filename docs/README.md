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

## Cách hiểu trạng thái

- **Hiện có:** đã đối chiếu với code, chưa mặc nhiên đạt kiểm thử production.
- **Mục tiêu SaaS:** khả năng cần có để nhiều doanh nghiệp dùng chung hệ thống.
- **Chưa hoàn thành:** chưa triển khai hoặc chưa đủ bằng chứng nghiệm thu.

Tên sản phẩm thống nhất: **Invoice ERP/CRM**.
`icegozi_invoice_erp_crm` là tên repository; `ic_goz_crm` còn xuất hiện trong giao diện.
Không đổi định danh trong code bằng một thay đổi tài liệu.

## Vận hành

Compose hiện phục vụ local. Bootstrap quản trị viên khác với dữ liệu nghiệp vụ mẫu.
Chưa có bằng chứng cô lập tenant trên toàn bộ API, settings và đường phục vụ file.
Không đưa dữ liệu khách hàng thật vào SaaS chia sẻ chỉ dựa trên hướng dẫn local.

## Nguồn sự thật

Ưu tiên route, controller, schema, package scripts và cấu hình thực tế khi nội dung cũ mâu thuẫn.
Tài liệu bổ sung phải ghi nguồn đối chiếu và tách hiện trạng khỏi mục tiêu.
Giấy phép lấy từ [LICENSE](../LICENSE); phiên bản lấy từ package manifests.
