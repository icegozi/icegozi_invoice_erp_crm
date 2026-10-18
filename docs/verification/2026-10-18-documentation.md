# Nghiệm thu chuẩn hóa tài liệu ngày 2026-10-18

Đối tượng: Maintainer, reviewer và người đánh giá khả năng vận hành.
Phụ trách: Maintainer. Trạng thái: kiểm tra local đã thực hiện; CI GitHub chưa chạy trên remote.
Phiên bản đối chiếu: `4.1.0`, baseline `d9187d0`. Rà soát: `2026-10-18`.

## Phạm vi

Thực hiện [kế hoạch đã duyệt](../superpowers/plans/2026-10-18-documentation-standardization.md).
Chỉ thay đổi Markdown, quy tắc LF cho Markdown và cấu hình kiểm tra tài liệu.
Không thay đổi LICENSE, mã nghiệp vụ, CI ứng dụng hoặc seed dữ liệu mặc định.

Đối chiếu theo ba góc đọc: người dùng đi hết luồng thu tiền, developer tìm route/env,
operator phân biệt local với production và phục hồi đủ DB/uploads.
Các nguồn code được liên kết tại từng tài liệu chi tiết.

## Kết quả công cụ

| Kiểm tra | Kết quả thực tế |
| --- | --- |
| Markdownlint CLI2 `0.23.2` | Không còn lỗi; cấu hình 120 ký tự, miễn bảng/code block |
| Lychee `0.24.2` offline | Không có liên kết nội bộ/ảnh/anchor lỗi |
| Git diff whitespace | `git diff --check` thành công |
| Workflow YAML/TOML | Parse thành công; push/PR, quyền đọc, SHA 40 ký tự và phiên bản cố định |
| Phạm vi thay đổi | Code ứng dụng, LICENSE và workflow CI ứng dụng khớp baseline |
| Backend tests trong image build từ worktree | 84/84 thành công, không bỏ qua test |
| Frontend Docker build | Thành công với URL API/file của môi trường cách ly |

Lệnh chạy tương đương CI và phạm vi loại trừ nằm trong [CONTRIBUTING](../../CONTRIBUTING.md).
Workflow GitHub chưa được chạy trên remote vì đợt này không push hoặc tạo PR.
Kết quả local không thay thế kết quả job trên runner GitHub.

## Kiểm tra trường hợp âm

Các fixture được tạo tạm, chạy checker thực tế rồi xóa khỏi repository.

| Trường hợp | Kết quả |
| --- | --- |
| Hai H1 trong một file | Markdownlint thất bại |
| Code fence thiếu ngôn ngữ | Markdownlint thất bại |
| Liên kết tới file không tồn tại | Lychee thất bại |
| Liên kết ảnh không tồn tại | Lychee thất bại |
| Anchor không tồn tại | Lychee thất bại |
| Anchor đúng từ heading tiếng Việt | Lychee thành công |
| Markdown sai trong `.github` | Cả hai checker phát hiện |
| Markdown sai trong `backups` | Bị loại; các checker vẫn thành công |

Kiểm tra offline không xác minh trạng thái URL bên ngoài.
Phiên bản action và nguồn công cụ đã được đối chiếu với release chính thức.

## Quickstart và nghiệp vụ cách ly

Dùng project `invoice-docs-smoke-20261018` với containers, network và volumes riêng.
Backend ở `127.0.0.1:18000`, frontend ở `127.0.0.1:13300` và Mailpit ở `127.0.0.1:18026`.
Mongo kiểm tra không publish cổng host.
Cấu hình riêng được resolve từ Compose, đổi toàn bộ tên/cổng/volumes và dùng secret tổng hợp.
Chỉ dữ liệu giả với email `contact@example.test` được ghi vào môi trường này.

Đã build cả backend và frontend từ source worktree rồi khởi động bằng Docker Compose.
Image Node hiện phát cảnh báo npm `10.1.0` khác khai báo `10.2.4`; build vẫn thành công.
Điều này được ghi trong [hướng dẫn phát triển](../technical/development.md).

| Bước | Kết quả |
| --- | --- |
| Bootstrap database rỗng, login | Thành công; không có bộ dữ liệu nghiệp vụ 70 bản ghi mặc định |
| Frontend và `/health` | HTTP 200 |
| Khách hàng → báo giá → chuyển hóa đơn | Thành công; chuyển cùng báo giá lần hai trả 409 |
| Tiền hàng 250, thuế 8%, chiết khấu 20 | `total=270`, phải thu 250 |
| Thu lần một 100 | `credit=100`, `paymentStatus=partially` |
| Thu lần hai 150 | `credit=250`, `paymentStatus=paid` |
| Thu vượt số còn lại | HTTP 400 |
| PDF báo giá/hóa đơn/phiếu thu qua Bearer | HTTP 200, nội dung bắt đầu bằng `%PDF` |
| Email hóa đơn | Mailpit của môi trường kiểm tra nhận được thư |
| Tạo lại container backend từ image mới | Dữ liệu paid còn đúng; health và PDF có Bearer vẫn thành công |

Luồng được kiểm tra qua HTTP API và phản hồi frontend, chưa phải kiểm thử thao tác UI end-to-end.
PowerShell được thực thi trên Windows; hướng dẫn Bash được đối chiếu tĩnh với script/source.
Không ghi hoặc chạy reset/restore trên database đang sử dụng.

## Sao lưu và khôi phục

Dừng writer của riêng môi trường kiểm tra, tạo archive Mongo gzip và copy uploads theo runbook.
Khôi phục vào Mongo container mới có `--network none` và volume uploads mới.

- `mongorestore` khôi phục 63 documents, không có document thất bại.
- Database phục hồi có một hóa đơn và hai phiếu thu của luồng kiểm tra.
- File uploads phục hồi có SHA-256 trùng bản nguồn.
- Các container/volume riêng của lần restore đã được xóa sau nghiệm thu.

Việc này xác minh archive và file phục hồi được.
Chưa đo RPO/RTO hoặc nghiệm thu ứng dụng đa tenant trên một cụm production.
Quy trình xem tại [runbook](../operations/runbook.md).

## Bảo toàn môi trường hiện có

Trước bàn giao, đọc lại database đang chạy: 70 khách hàng, 70 báo giá, 70 hóa đơn,
70 phiếu thu, 4 thuế, 6 phương thức thanh toán, 54 settings và một quản trị viên.
Các thao tác tạo chứng từ, backup/restore và kiểm tra ghi đều dùng tài nguyên cách ly riêng.

Thay đổi Dockerfile và root package-lock có sẵn trước tác vụ được giữ ngoài các commit tài liệu.

## Điều kiện phát hành còn thiếu

Tái hiện được PDF đã sinh vẫn truy cập qua đường `/public` mà không cần Bearer.
Đường `/download` có xác thực chưa đủ bảo vệ mọi đường phục vụ file.
Phát hiện này được công bố là P0; đợt tài liệu không sửa route ứng dụng.

Bảng [readiness SaaS](../security/saas-readiness.md) là nơi theo dõi đầy đủ:
tenant isolation, quan hệ dữ liệu, settings/counters, PDF/uploads, vòng đời phiên đăng nhập,
migration và vận hành phải có bằng chứng nghiệm thu riêng.
Bộ docs và checker hoàn thành không đồng nghĩa sản phẩm sẵn sàng phát hành SaaS chia sẻ.
