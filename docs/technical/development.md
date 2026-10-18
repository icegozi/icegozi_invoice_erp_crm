# Phát triển và kiểm thử

Đối tượng: lập trình viên và người review thay đổi.
Phụ trách: Maintainer kỹ thuật. Trạng thái: hướng dẫn hiện tại, ưu tiên Docker local.
Phiên bản đối chiếu: `4.1.0`, baseline `d9187d0`. Rà soát: `2026-10-18`.

## Môi trường

Hai package khai báo Node.js `20.9.0` và npm `10.2.4`.
CI ứng dụng dùng Node.js `20.9.0`; Dockerfile cũng dùng Node.js `20.9.0`.
Server chỉ chặn Node có major nhỏ hơn `20`; npm engines không đồng nghĩa runtime đã được kiểm tra mọi phiên bản.
Image Node hiện có thể dùng npm khác bản khai báo và xuất cảnh báo engines.
Không diễn giải các phiên bản này như chính sách hỗ trợ production đã được duyệt.

Máy host chỉ cần Docker để chạy [quickstart](../../README.md#chạy-local-bằng-docker).
Khi phát triển native, cài Node/npm phù hợp manifests. Không cài package ở root.

## Cài dependencies

```bash
npm --prefix backend ci
npm --prefix frontend ci
```

Puppeteer có thể tải browser lúc cài native. Trong Docker, image dùng Chromium hệ thống.
Không sửa lockfile chỉ để bỏ qua cảnh báo phiên bản.

## Hot reload với database mới

Chỉ dùng các bước sau trên checkout/môi trường local đã xác định rõ.
Không chạy nguyên Compose từ checkout khác song song vì có tên container/cổng cố định.

Compose chỉ publish UI Mailpit, chưa publish SMTP cho backend chạy trên host.
Dùng override qua stdin dưới đây để thêm SMTP trên loopback; cổng `1025` phải đang trống.
Không lưu override vào source hoặc đổi Compose mặc định.

PowerShell:

```powershell
@'
services:
  mailpit:
    ports:
      - "127.0.0.1:1025:1025"
'@ | docker compose -f docker-compose.yml -f - up --detach mongo mongo-init mailpit
docker compose stop backend frontend
```

Bash:

```bash
docker compose -f docker-compose.yml -f - up --detach mongo mongo-init mailpit <<'YAML'
services:
  mailpit:
    ports:
      - "127.0.0.1:1025:1025"
YAML
docker compose stop backend frontend
```

UI Mailpit vẫn ở `http://localhost:8026`; SMTP native dùng `localhost:1025`.
Khi quay lại full Docker, chạy quickstart bằng Compose mặc định để bỏ mapping SMTP bổ sung.

Tạo `.env` ở root từ mẫu và đặt kết nối:

```dotenv
DATABASE=mongodb://localhost:27017/invoice?replicaSet=rs0&directConnection=true
JWT_SECRET=replace_with_a_private_random_value
FRONTEND_URL=http://localhost:3000
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
```

`directConnection=true` hữu ích khi driver native không phân giải được hostname `mongo` do replica set công bố.
Đảm bảo replica set đã có primary trước khi ghi transaction.

Với database hoàn toàn mới, bootstrap một lần.
Setup đọc env từ thư mục backend, khác server đọc root; truyền DATABASE qua process environment:

PowerShell:

```powershell
$env:DATABASE = 'mongodb://localhost:27017/invoice?replicaSet=rs0&directConnection=true'
npm --prefix backend run setup
```

Bash:

```bash
DATABASE='mongodb://localhost:27017/invoice?replicaSet=rs0&directConnection=true' npm --prefix backend run setup
```

Không bootstrap lại nếu tài khoản/cấu hình đã có.
Mở hai terminal tại root:

```bash
npm --prefix backend run dev
```

```bash
npm --prefix frontend run dev
```

Backend dùng cổng `8000`, frontend `3000`.
Vite cấu hình proxy `/api`, nhưng request config hiện gọi URL backend trực tiếp;
đừng giả định mọi request trình duyệt đều đi qua proxy.

## Kiểm tra trước khi bàn giao

```bash
npm --prefix backend test
npm --prefix frontend run build
npm --prefix frontend run lint
git diff --check
```

Backend dùng `node --test`: kiểm tra contract route, tính toán và phân quyền;
các kiểm tra này chưa chứng minh isolation giữa tenant hoặc mọi tình huống database đồng thời.
Frontend chưa có test suite trong scripts; build/lint không thay thế kiểm tra UI.
CI ứng dụng hiện chạy backend tests và frontend build; chưa chạy frontend lint.

Kiểm tra luồng ghi dữ liệu chỉ trên database cách ly:
khách hàng → báo giá → chuyển hóa đơn → hai phiếu thu → đối chiếu số dư → PDF.
Mail thử nghiệm phải trỏ Mailpit. Không dùng thông tin SMTP thật.

## Script có tác dụng ghi hoặc xóa

| Script | Tác dụng và giới hạn |
| --- | --- |
| `setup` | Tạo quản trị viên/cấu hình nền; chạy lại có thể trùng dữ liệu |
| `reset` | Xóa dữ liệu; không phải bước kiểm thử thông thường |
| `reconcile:payments` | Tính lại credit/paymentStatus; ghi database, phải backup và chọn đúng môi trường |
| `upgrade` | File đích chưa tồn tại; chưa có quy trình migration tổng quát dùng được |
| `verifyPaymentOverpaymentGuard.js` | CLI tích hợp có thể ghi dữ liệu; chỉ xem xét chạy trong môi trường cách ly |
| `make:model` | Sinh file model trên source; cần review route/quyền sinh tự động |

## Nguồn đối chiếu

- [Backend package](../../backend/package.json), [frontend package](../../frontend/package.json).
- [CI ứng dụng](../../.github/workflows/ci.yml), [tests](../../backend/test).
- [Setup](../../backend/src/setup/setup.js), [server](../../backend/src/server.js).
- [Vite](../../frontend/vite.config.mjs), [API config](../../frontend/src/config/serverApiConfig.js).
- [CLI](../../backend/src/cli), [Makefile](../../Makefile).
