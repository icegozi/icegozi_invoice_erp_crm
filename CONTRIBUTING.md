# Đóng góp và duy trì tài liệu

Đối tượng: người sửa code/docs và reviewer.
Phụ trách: Maintainer. Trạng thái: quy trình tài liệu hiện hành.
Phiên bản đối chiếu: `4.1.0`, baseline `d9187d0`. Rà soát: `2026-10-18`.

## Nguồn và cấu trúc

Đọc [mục lục](docs/README.md) và tài liệu liên quan trước khi thay đổi.
Ưu tiên code/config hiện tại nếu tài liệu mâu thuẫn.
Mỗi thông tin có một nơi chính; README và các điểm vào cũ dẫn đến nơi đó.
Không copy toàn bộ kiến trúc/API vào hướng dẫn agent hoặc frontend README.

| Nội dung thay đổi | Tài liệu cần đối chiếu |
| --- | --- |
| Route, role, payload, response | API và security model |
| Model, reference, tính tiền | Architecture, user guide và SaaS readiness |
| Env, Docker, đường dẫn | Configuration, deployment và runbook |
| Sao lưu, file, cảnh báo | Runbook và readiness |
| Trạng thái phát hành | CHANGELOG và bằng chứng nghiệm thu |

Giữ nguyên API, dữ liệu và LICENSE nếu tác vụ chỉ là tài liệu.
Các thay đổi nghiệp vụ/hạ tầng để đạt SaaS cần kế hoạch riêng, có kiểm thử.

## Chuẩn viết

- Tiếng Việt chính, tên sản phẩm Invoice ERP/CRM; giữ nguyên tên code, route và biến môi trường.
- UTF-8, LF, một H1/file; heading tăng tuần tự và link nội bộ dùng đường dẫn tương đối.
- Dòng tối đa 120 ký tự, miễn bảng/code block; code fence phải có ngôn ngữ.
- Danh sách đánh số dùng thứ tự 1, 2, 3; không tắt rule toàn repo chỉ để bỏ qua một lỗi.
- Docs chi tiết có đối tượng, vai trò phụ trách, trạng thái, phiên bản/baseline và ngày rà soát.
- Ghi nguồn đối chiếu trong repo; cập nhật ngày/phiên bản khi thật sự review lại nội dung.
- Phân biệt **hiện có**, **mục tiêu** và **chưa hoàn thành**; không ghi mục tiêu như tính năng đã có.
- Dùng Mermaid cho sơ đồ kỹ thuật và quan hệ dữ liệu; kiểm tra render trên GitHub.
- Ví dụ dùng dữ liệu giả và example.test; không đưa token, archive, ảnh khách hàng hoặc secret vào Git.
- Không tạo dữ liệu demo mặc định hoặc tự đổi lifecycle database trong thay đổi tài liệu.

Mật khẩu bootstrap trong quickstart là giá trị công khai có sẵn trong source, chỉ dùng local mới.
Không thêm credential thực để làm ví dụ “chạy được ngay”.
Không tạo lịch sử phát hành cũ, SLA, chứng nhận hay kênh hỗ trợ chưa được xác nhận.
Giấy phép lấy từ [LICENSE](LICENSE), không thay bằng tên tiếp thị.

## Kiểm tra tại máy

Checker Markdown cần Node.js 22 trở lên; đây là runtime của công cụ docs, không đổi runtime ứng dụng.
CI dùng markdownlint-cli2-action v24.2.0, đóng gói markdownlint-cli2 0.23.2.
Chạy từ thư mục gốc:

```bash
npx --yes markdownlint-cli2@0.23.2 --config .markdownlint-cli2.yaml
git diff --check
```

Cài binary [lychee v0.24.2](https://github.com/lycheeverse/lychee/releases/tag/lychee-v0.24.2)
đúng nền tảng từ release chính thức, rồi chạy:

PowerShell:

```powershell
lychee --config .lychee.toml --root-dir (Get-Location).Path '**/*.md' '.github/**/*.md'
```

Bash:

```bash
lychee --config .lychee.toml --root-dir "$PWD" '**/*.md' '.github/**/*.md'
```

Exit code `0` là thành công. Không dùng chế độ tự sửa trong CI.
Job kiểm tra file, ảnh và anchor nội bộ; cấu hình offline không truy cập các URL bên ngoài.
Đối chiếu link ngoài với nguồn chính thức khi review, không coi kết quả offline là đã kiểm tra Internet.
Dependencies, build output, uploads, backups và scratch của agent bị loại khỏi phạm vi.
Markdown trong `.github` vẫn được kiểm tra.

## Kiểm tra cấu hình checker khi thay đổi CI

Trong thư mục tạm ngoài source:

1. File có hai H1 hoặc code fence thiếu ngôn ngữ phải làm Markdown checker thất bại.
2. Liên kết đến file, ảnh hoặc anchor không tồn tại phải làm lychee thất bại.
3. Anchor heading tiếng Việt hợp lệ phải thành công.
4. Thử một file Markdown sai trong `.github` để xác nhận glob không bỏ sót.
5. Xác nhận các thư mục generated bị loại, rồi xóa riêng fixture do mình tạo.

Fixture thử âm không được để lại trong repository.
Không cần viết test ứng dụng chỉ để kiểm tra một thay đổi câu chữ.

## Review và phát hành tài liệu

- Người dùng nghiệp vụ: đi được từ khách hàng đến đối chiếu công nợ.
- Developer: lệnh/route/env và đường dẫn khớp source; không mặc định mọi handler có chung validation.
- Operator: biết ranh giới local/production và cách backup/restore đủ cả DB/uploads.
- Reviewer bảo mật: trạng thái SaaS và các giới hạn tenant/file được mô tả đúng.

Thử quickstart/ghi dữ liệu chỉ trong môi trường cách ly theo [deployment](docs/operations/deployment.md).
Không dùng database đang phục vụ người dùng để nghiệm thu docs.
Ghi thay đổi đã thực hiện vào mục Unreleased của [CHANGELOG](CHANGELOG.md), rồi review diff theo phạm vi.
Mỗi nhóm thay đổi có kiểm tra thành công trước commit.

## Nguồn công cụ

- [Markdownlint action v24.2.0](https://github.com/DavidAnson/markdownlint-cli2-action/tree/v24.2.0).
- [Lychee action v2.9.0](https://github.com/lycheeverse/lychee-action/tree/v2.9.0).
- [Workflow tài liệu](.github/workflows/docs.yml), [cấu hình lint](.markdownlint-cli2.yaml).
- [Cấu hình link checker](.lychee.toml).
