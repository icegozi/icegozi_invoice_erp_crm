# Kế hoạch chuẩn hóa tài liệu cho SaaS Enterprise

Đối tượng: người triển khai và reviewer. Phụ trách: Maintainer.
Trạng thái: triển khai và nghiệm thu tài liệu local hoàn tất; readiness SaaS được đánh giá riêng.
Phiên bản đối chiếu: `4.1.0`, baseline `d9187d0`. Rà soát: `2026-10-18`.

> For agentic workers: triển khai từng task theo `superpowers:executing-plans`.

**Goal:** Tài liệu thống nhất cho người dùng, kỹ thuật, vận hành và kiểm tra Markdown trong CI.

**Architecture:** README là điểm vào; docs chi tiết phân biệt hiện trạng, mục tiêu và điều kiện SaaS còn thiếu.

**Tech Stack:** GitHub Flavored Markdown, Mermaid, GitHub Actions, markdownlint và lychee.

**Spec:** Kế hoạch người dùng duyệt ngày 2026-10-18:
SaaS dùng chung hệ thống, tiếng Việt chính và Markdown kèm CI.

## Global Constraints

- Chỉ sửa tài liệu và cấu hình kiểm tra tài liệu.
- Giữ nguyên mã nghiệp vụ, database, dữ liệu mẫu và LICENSE.
- Tên sản phẩm Invoice ERP/CRM; phiên bản khai báo 4.1.0.
- Không tạo lịch sử phát hành, SLA hoặc chứng nhận không có bằng chứng.
- Schema có organizationId chưa chứng minh tenant isolation.
- Không reset, restore hoặc ghi thử vào database đang sử dụng.
- Ví dụ giả và example.test; không đưa dữ liệu nhạy cảm vào Git.
- Docs chi tiết có đối tượng, trạng thái, phụ trách, phiên bản và ngày rà soát.

## Bộ tài liệu

| Nhóm | Đích |
| --- | --- |
| Điểm vào | README.md và docs/README.md |
| Sản phẩm | docs/product/user-guide.md |
| Kỹ thuật | docs/technical/architecture.md, development.md, api.md, configuration.md |
| Vận hành | docs/operations/deployment.md, runbook.md |
| Bảo mật | docs/security/security-model.md, saas-readiness.md |
| Duy trì | CONTRIBUTING.md, CHANGELOG.md |

Giữ frontend/README.md, ops/README.md và CLAUDE.md làm điểm vào chuyển tiếp.
Không dựng website tài liệu hoặc thêm seed nghiệp vụ mặc định.

## Task 1: Sửa sai lệch và thiết lập điểm vào

- [x] Đối chiếu lệnh, phiên bản, đường dẫn, biến môi trường với code.
- [x] Thay hướng dẫn Create React App bằng Vite.
- [x] Ghi Authorization: Bearer và yêu cầu auth của download.
- [x] Backend có tests, frontend chưa có test suite.
- [x] Loại upgrade khỏi bước sử dụng bình thường; ghi giới hạn đã biết.
- [x] Rút gọn README, lập mục lục và giữ các điểm vào cũ.
- [x] Kiểm tra liên kết và commit riêng.

Expected: không còn hướng dẫn sai về framework, token, test hoặc script upgrade.

## Task 2: Tài liệu sản phẩm và kỹ thuật

- [x] Hướng dẫn khách hàng, báo giá, chuyển hóa đơn, thu tiền nhiều đợt, PDF/email.
- [x] Công thức dòng hàng, thuế, chiết khấu, credit và số còn phải thu.
- [x] Sơ đồ thành phần, dữ liệu và phạm vi organizationId hiện tại.
- [x] API: route, method, auth, role, payload, phân trang, lỗi và file.
- [x] Cấu hình: nơi đọc, mặc định, độ nhạy cảm và build/runtime.
- [x] Env theo entrypoint; hướng dẫn Windows và Bash.
- [x] Kiểm tra luồng cách ly và commit riêng.

Expected: người mới chạy local và đối chiếu được luồng nghiệp vụ với API.

## Task 3: Vận hành và readiness SaaS

- [x] Phân biệt Compose local và điều kiện staging/production.
- [x] Backup/restore MongoDB và uploads; phân biệt archive thường/gzip.
- [x] Phát hành, rollback, kiểm tra sau restore và xử lý sự cố.
- [x] Health chỉ xác nhận API phản hồi.
- [x] Readiness: hiện trạng, bằng chứng, ưu tiên, phụ trách, điều kiện nghiệm thu.
- [x] Tenant isolation: đọc/ghi, liên kết, settings, counter, PDF và uploads.
- [x] RBAC khác phạm vi dữ liệu; ghi chính sách chưa được xác nhận.
- [x] Kiểm tra và commit riêng.

Expected: không tuyên bố sẵn sàng SaaS khi chưa có bằng chứng.

## Task 4: Kiểm tra tài liệu trong CI

- [x] Workflow riêng trên push/PR, quyền đọc; giữ nguyên CI ứng dụng.
- [x] Pin markdownlint-cli2-action v24.2.0 và lychee-action v2.9.0 theo SHA.
- [x] Pin lychee v0.24.2.
- [x] Heading, danh sách, fence; dòng 120 ký tự, miễn code block và bảng.
- [x] Link, ảnh, anchor nội bộ offline; lỗi làm job thất bại.
- [x] Gồm .github; loại dependencies, build, uploads và backups.
- [x] Không tự sửa/tạo issue; hướng dẫn contributors chạy tương đương.
- [x] Kiểm tra trường hợp âm và commit riêng.

Expected: lỗi lint/link thất bại; anchor tiếng Việt đúng thành công.

## Task 5: Nghiệm thu và bàn giao

- [x] Review theo vai trò người dùng, developer và operator.
- [x] Kiểm tra quickstart trong môi trường cách ly.
- [x] Lint, links và git diff --check thành công.
- [x] CHANGELOG Unreleased ghi đúng thay đổi.
- [x] Kiểm tra phạm vi diff và nguồn dữ liệu; commit riêng.
- [x] Bàn giao mục lục, bằng chứng kiểm tra và điều kiện SaaS còn thiếu.

## Review Focus

| Kịch bản | Expected |
| --- | --- |
| README | Tìm được docs theo vai trò và trạng thái SaaS |
| Quickstart | Cách ly; không bắt buộc Make trên Windows |
| API/cấu hình | Khớp route, token, env và cách tính tiền |
| Markdown sai | Lint thất bại |
| File, ảnh, anchor sai | Link check thất bại |
| Anchor tiếng Việt đúng | Thành công |
| SaaS | Không tuyên bố tenant isolation/chứng nhận thiếu bằng chứng |
| Diff cuối | Chỉ docs/CI; dữ liệu giữ nguyên |

Điều kiện hoàn thành: docs/CI đạt kiểm tra; readiness SaaS được đánh giá riêng.
