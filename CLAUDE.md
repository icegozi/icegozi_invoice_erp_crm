# Hướng dẫn cho agent

File này dành cho agent trong repository Invoice ERP/CRM.
Tài liệu sản phẩm bắt đầu từ [README](README.md) và [mục lục docs](docs/README.md).

## Quy tắc làm việc

- Đọc mã nguồn trước khi sửa tài liệu hoặc hành vi.
- Giữ nguyên dữ liệu và thay đổi sẵn có ngoài phạm vi tác vụ.
- Không chạy lại setup, reset, restore hoặc xóa volumes của database đang sử dụng.
- Không thêm seed nghiệp vụ mặc định khi chưa được yêu cầu.
- Giữ nguyên `LICENSE`.

## Điểm vào kỹ thuật

- [Backend package](backend/package.json): CommonJS, alias `@` trỏ đến `src`.
- [Frontend package](frontend/package.json): ESM, React/Vite; chưa có test script frontend.
- [Backend tests](backend/test): `npm --prefix backend test`.
- Frontend: `npm --prefix frontend run build` và `npm --prefix frontend run lint`.
- [API routes](backend/src/routes/appRoutes/appApi.js) và [model loader](backend/src/models/utils/index.js).

API dùng `Authorization: Bearer <token>`.
Quyền theo vai trò không thay thế quyền truy cập theo tenant.
Schema có `organizationId` chưa chứng minh hệ thống đã cô lập tenant.

Script `upgrade` còn được khai báo nhưng file đích chưa tồn tại; không dùng như bước vận hành.
Lệnh ứng dụng chạy qua package tương ứng; repository không có package ứng dụng ở thư mục gốc.
