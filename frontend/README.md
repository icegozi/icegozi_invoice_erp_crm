# Frontend Invoice ERP/CRM

Frontend dùng **React 18, Vite 5, Ant Design và Redux Toolkit**.
Hai package backend/frontend khai báo phiên bản `4.1.0`.

## Chạy và build

Chạy từ thư mục gốc, sau khi API và MongoDB sẵn sàng:

```bash
npm --prefix frontend ci
npm --prefix frontend run dev
```

Vite dùng cổng `3000` và `strictPort: true`.
Dừng frontend Docker nếu cần dùng lại cổng đó. Production build nằm trong `frontend/dist/`.

```bash
npm --prefix frontend run build
npm --prefix frontend run lint
```

Package chưa có script test frontend.
Xem [mục lục tài liệu](../docs/README.md) và [quickstart Docker](../README.md#chạy-local-bằng-docker).

## Nguồn đối chiếu

- [Package scripts](package.json).
- [Cấu hình Vite](vite.config.mjs).
- [Cấu hình địa chỉ API](src/config/serverApiConfig.js).

File này là điểm vào; thông tin kỹ thuật chi tiết được duy trì trong bộ docs chung.
