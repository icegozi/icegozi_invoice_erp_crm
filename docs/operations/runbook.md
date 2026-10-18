# Runbook vận hành

Đối tượng: người quản trị và người xử lý sự cố.
Phụ trách: Maintainer vận hành. Trạng thái: thao tác Docker local và quy trình mục tiêu cho môi trường được duyệt.
Phiên bản đối chiếu: `4.1.0`, baseline `d9187d0`. Rà soát: `2026-10-18`.

## Xác định hệ thống trước khi thao tác

Chạy trong đúng thư mục/config Compose. Đọc tên project, container và volume trước lệnh ghi/xóa.
Các lệnh trong tài liệu không phải yêu cầu thực hiện trên database đang dùng để thử nghiệm docs.

```bash
docker compose ps --all
docker compose logs --tail=100 backend
docker compose logs --tail=50 mongo
```

`docker compose config` có thể hiển thị secret sau nội suy; không gửi nguyên output lên issue.
Không dùng `reset`, `setup` lần nữa hoặc `down --volumes` như cách sửa lỗi chung.

## Sao lưu nhất quán

Backup gồm database và `/app/backend/src/public/uploads`.
PDF trong `public/download` được tạo lại từ dữ liệu, không thay thế bản backup uploads.
Đưa ứng dụng vào maintenance window, chặn các writer khác rồi dừng backend/frontend để hai bản backup khớp thời điểm.
Kiểm tra exit code sau từng lệnh; nếu lỗi thì dừng quy trình, bảo vệ bản backup cũ và ghi nhận sự cố.
Trong ví dụ dưới đây, chỉ tiếp tục khi đã xác nhận đúng môi trường được phép backup.

### PowerShell

Không redirect luồng archive nhị phân bằng `>` trong Windows PowerShell 5.1.
Tạo archive trong container rồi dùng `docker cp`:

```powershell
$ErrorActionPreference = 'Stop'
$stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$backupDir = Join-Path (Get-Location) "backups/$stamp"
$mongoId = docker compose ps --all --quiet mongo
$backendId = docker compose ps --all --quiet backend
if (-not $mongoId -or -not $backendId) { throw 'Không tìm thấy container cần backup' }
New-Item -ItemType Directory -Path $backupDir -ErrorAction Stop | Out-Null
New-Item -ItemType Directory -Path (Join-Path $backupDir 'uploads') | Out-Null
$archive = "/tmp/invoice-$stamp.archive.gz"
docker compose stop backend frontend
if ($LASTEXITCODE -ne 0) { throw 'Không dừng được writer' }
docker exec $mongoId mongodump --db invoice "--archive=$archive" --gzip
if ($LASTEXITCODE -ne 0) { throw 'Dump thất bại' }
docker cp "$($mongoId):$archive" (Join-Path $backupDir 'invoice.archive.gz')
if ($LASTEXITCODE -ne 0) { throw 'Copy archive thất bại' }
docker cp "$($backendId):/app/backend/src/public/uploads/." (Join-Path $backupDir 'uploads')
if ($LASTEXITCODE -ne 0) { throw 'Backup uploads thất bại' }
Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $backupDir 'invoice.archive.gz')
docker compose up --detach backend frontend
```

Sau lệnh cuối, kiểm tra API và log trước khi kết thúc maintenance.
Nếu backup thất bại, người vận hành quyết định có mở lại dịch vụ hay tiếp tục bảo trì sau khi đánh giá.

### Bash

Script trong ops xuất archive gzip và cần thư mục đích đã tồn tại.
Ví dụ dùng Bash có Docker CLI; Windows có thể dùng Git Bash/WSL với Docker integration đã kiểm tra.

```bash
set -euo pipefail
backup_dir="$PWD/backups/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup_dir/uploads"
mongo_id=$(docker compose ps --all --quiet mongo)
backend_id=$(docker compose ps --all --quiet backend)
test -n "$mongo_id" && test -n "$backend_id"
docker compose stop backend frontend
MONGO_CONTAINER="$mongo_id" bash ops/backup-mongodb.sh "$backup_dir"
docker cp "$backend_id:/app/backend/src/public/uploads/." "$backup_dir/uploads"
sha256sum "$backup_dir/"*.archive.gz
docker compose up --detach backend frontend
```

Script Bash hiện dump các database mà mongodump chọn mặc định, không chỉ database `invoice`.
Giới hạn namespace phù hợp lúc restore; không công bố archive đó vì có thể chứa dữ liệu ngoài ứng dụng.

### Định dạng và lưu trữ

| Nguồn archive | Định dạng | Cách đọc lại |
| --- | --- | --- |
| `ops/backup-mongodb.sh` | Mongodump archive gzip | `mongorestore --gzip --archive=...` |
| Ví dụ PowerShell ở trên | Mongodump archive gzip | `mongorestore --gzip --archive=...` |
| Makefile `db-backup` | Archive không gzip cho DB invoice | `mongorestore --archive=...`; không thêm --gzip |

Không chọn định dạng chỉ theo phần mở rộng; ghi kèm lệnh tạo backup, thời gian UTC, phiên bản DB/image và checksum.
Ghi manifest/checksum uploads và cấu hình cần thiết để khôi phục, nhưng không để secret trong nơi truy cập công khai.
Lưu bản backup ngoài host chạy ứng dụng, hạn chế quyền đọc và bảo vệ bằng cơ chế mã hóa của đơn vị vận hành.
Lịch backup, retention và mục tiêu RPO/RTO phải được xác nhận riêng; repo chưa cung cấp cam kết.

## Thử khôi phục cách ly

Ví dụ dưới đây chỉ xác minh database và file trong container kiểm tra không có cổng host.
Các tên `invoice-restore-check-*` phải chưa tồn tại; nếu đã tồn tại thì dừng, không xóa để giành tên.
Thay đường dẫn backup local bằng bản đã kiểm tra checksum.
Không dùng container `invoice-mongo` hoặc volume của hệ thống đang hoạt động làm đích restore.

### Database

PowerShell:

```powershell
$restoreBackup = 'C:\secure-backups\20261018T000000Z\invoice.archive.gz'
docker run --detach --name invoice-restore-check-mongo --network none mongo:7
if ($LASTEXITCODE -ne 0) { throw 'Không tạo được container restore mới' }
docker cp $restoreBackup invoice-restore-check-mongo:/tmp/invoice.archive.gz
if ($LASTEXITCODE -ne 0) { throw 'Copy archive thất bại' }
```

Đợi Mongo mới sẵn sàng bằng ping; lặp lại ping nếu còn đang khởi động:

```bash
docker exec invoice-restore-check-mongo mongosh --quiet --eval "db.adminCommand('ping')"
docker exec invoice-restore-check-mongo mongorestore --gzip --archive=/tmp/invoice.archive.gz --nsInclude="invoice.*"
docker exec invoice-restore-check-mongo mongosh invoice --quiet --eval "db.invoices.countDocuments()"
```

Mỗi lệnh restore phải kết thúc exit code `0`; không chỉ xem lệnh count cuối.
Với archive không nén, bỏ `--gzip`. Database mới rỗng không cần `--drop`.
Container có network none và không dùng volume nguồn; việc này chưa kiểm tra transaction/replica set của ứng dụng.

### Uploads

PowerShell, tạo volume và helper riêng để nhận lại file:

```powershell
docker create --name invoice-restore-check-files --network none --mount type=volume,source=invoice-restore-check-uploads,target=/restore node:20.9.0-slim
if ($LASTEXITCODE -ne 0) { throw 'Không tạo được helper mới' }
docker cp 'C:\secure-backups\20261018T000000Z\uploads\.' invoice-restore-check-files:/restore
if ($LASTEXITCODE -ne 0) { throw 'Restore uploads thất bại' }
```

Đối chiếu danh sách/checksum file với manifest, không chỉ kiểm tra folder tồn tại.
Nếu phải chạy helper để đọc file, chỉ mount volume kiểm tra vừa tạo.

### Nghiệm thu và dọn dẹp

- Đối chiếu số bản ghi, tổng phải thu/đã thu và các liên kết client–quote–invoice–payment.
- Kiểm tra file/logo được database tham chiếu có trong uploads và quyền filesystem phù hợp.
- Để nghiệm thu cả ứng dụng, đưa bản restore vào staging có replica set và backend/frontend cách ly.
- Kiểm tra login, PDF và email sandbox ở staging trước khi quyết định khôi phục hệ thống thật.
- Ghi kết quả, người kiểm tra và thời gian; không gán RPO/RTO khi chưa đo.

Chỉ sau khi đã xác nhận đây là tài nguyên do lần kiểm tra này tạo:

```bash
docker rm --force --volumes invoice-restore-check-mongo invoice-restore-check-files
docker volume rm invoice-restore-check-uploads
```

Không dùng prune hoặc lệnh xóa mọi volume để dọn môi trường kiểm tra.

## Xử lý sự cố

| Triệu chứng | Kiểm tra trước | Hướng xử lý |
| --- | --- | --- |
| Docker không kết nối | Engine/context và Docker Desktop | Khởi động engine; giữ nguyên volumes |
| Mongo chờ primary | mongo-init, rs status, network và disk | Sửa nguyên nhân replica set; không reset dữ liệu |
| Native driver không tìm thấy mongo | Hostname do replica set công bố | Xem URI directConnection trong [development](../technical/development.md) |
| Backend không chạy entrypoint | Shebang và CRLF trong file shell | Chuẩn hóa LF khi build/checkout; không xóa DB để chữa |
| Browser gọi sai API | URL đã nhúng vào frontend build | Build lại đúng URL, kiểm tra CORS mapping |
| PDF lỗi/thiếu logo | Chromium, uploads, settings và log backend | Kiểm tra đường dẫn/quyền; file download có thể tạo lại |
| Email không tới | SMTP thực tế, địa chỉ người nhận và Mailpit inbox | Không coi message có chữ Mailpit là xác nhận giao thư |
| Credit khác phiếu thu | Tổng amount còn hiệu lực và thay đổi đồng thời | Backup, đối chiếu trước khi chạy reconcile có ghi dữ liệu |
| 401/403 | Token còn hiệu lực, session và role | Không dùng đổi role để bỏ qua kiểm tra tenant |

Log hiện có không phải audit trail bất biến.
Khi báo sự cố, gửi thời gian, release, endpoint và mã lỗi đã loại secret/dữ liệu khách hàng.
Không chạy script upgrade vì file đích chưa có.
Quy trình release và rollback nằm trong [triển khai](deployment.md).

## Nguồn đối chiếu

- [Backup script](../../ops/backup-mongodb.sh), [Makefile](../../Makefile).
- [Compose/volumes](../../docker-compose.yml), [PDF](../../backend/src/controllers/pdfController/index.js).
- [Reconcile](../../backend/src/cli/reconcilePaymentCredits.js), [entrypoint](../../backend/docker-entrypoint.sh).
