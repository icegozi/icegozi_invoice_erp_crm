# Vận hành Invoice ERP/CRM

Điểm vào cho người quản trị và đội vận hành.

## Bắt đầu

- [Quickstart local](../README.md#chạy-local-bằng-docker).
- [Mục lục tài liệu và trạng thái SaaS](../docs/README.md).
- [Compose](../docker-compose.yml): local với cổng và tên container cố định.
- [Script sao lưu Bash](backup-mongodb.sh): tạo archive gzip; cần thư mục đích đã tồn tại.

Không coi cấu hình local là cấu hình production.
Không reset, restore hoặc xóa volumes của hệ thống đang sử dụng để thử hướng dẫn.
Backup MongoDB chưa bao gồm uploads; phải bảo vệ và khôi phục cả hai thành phần.
