# API hiện tại

Đối tượng: lập trình viên tích hợp và reviewer.
Phụ trách: Maintainer backend. Trạng thái: mô tả API hiện có, không bổ sung contract mới.
Phiên bản đối chiếu: `4.1.0`, baseline `d9187d0`. Rà soát: `2026-10-18`.

## Địa chỉ và xác thực

Local API: `http://localhost:8000/api`. JSON request dùng `Content-Type: application/json`.
Ngoại trừ các route auth công khai, request API cần:

```http
Authorization: Bearer <token>
```

Tên `x-auth-token` còn tồn tại trong một hằng frontend, nhưng middleware hiện đọc header `authorization`.
JWT phải xác minh được và còn nằm trong `AdminPassword.loggedSessions`.
Đừng ghi token vào URL, source, log hoặc ví dụ thực tế gửi lên Git.

| Method | Đường dẫn | Body/quyền |
| --- | --- | --- |
| POST | `/api/login` | `email, password`; `remember` tùy chọn; công khai |
| POST | `/api/forgetpassword` | `email`; công khai |
| POST | `/api/resetpassword` | `userId, resetToken, password`; công khai |
| POST | `/api/logout` | Bearer; thu hồi token của phiên hiện tại |
| GET | `/health` | Không auth; trả `{"success":true}`, không kiểm tra DB/SMTP |

Login trả token trong `result.token`.
JWT login mặc định `24h`; remember dùng `365 × 24h`.
Reset token có 64 ký tự hex, lưu SHA-256 và hết hạn sau 15 phút; mật khẩu reset tối thiểu 8 ký tự.
Login có thể trả `404` cho email không tồn tại, `403` cho sai mật khẩu, `409` cho input/tài khoản bị tắt.
Không mô tả cơ chế này là chống dò email hoàn chỉnh.

Ví dụ đăng nhập PowerShell, chỉ trên môi trường local đã xác định:

```powershell
$body = @{ email = 'admin@admin.com'; password = 'YOUR_LOCAL_PASSWORD' } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri 'http://localhost:8000/api/login' -ContentType 'application/json' -Body $body
$headers = @{ Authorization = 'Bearer ' + $login.result.token }
Invoke-RestMethod -Uri 'http://localhost:8000/api/invoice/list?page=1&items=10' -Headers $headers
```

Thay `YOUR_LOCAL_PASSWORD` bằng mật khẩu của môi trường.
Không sao chép kết quả login chứa token vào issue.

## Nhóm CRUD nghiệp vụ

Entity là `client`, `quote`, `invoice`, `payment`, `taxes` hoặc `paymentmode`.
`:id` là MongoDB ObjectId; dùng ID do server trả về.

| Method | Route pattern | Mục đích |
| --- | --- | --- |
| POST | `/api/{entity}/create` | Tạo |
| GET | `/api/{entity}/read/:id` | Đọc |
| PATCH | `/api/{entity}/update/:id` | Sửa |
| DELETE | `/api/{entity}/delete/:id` | Xóa mềm hoặc handler riêng |
| GET | `/api/{entity}/list` | Phân trang |
| GET | `/api/{entity}/listAll` | Danh sách không phân trang |
| GET | `/api/{entity}/search` | Tìm kiếm |
| GET | `/api/{entity}/filter` | Lọc |
| GET | `/api/{entity}/summary` | Tổng hợp theo controller |

Các route đọc nghiệp vụ hiện yêu cầu token, không áp cùng ngưỡng vai trò như route ghi.
Danh sách model sinh route tự động không có nghĩa mọi handler đều cùng validation hoặc tenant filter.

| Entity | Vai trò tối thiểu cho create/update/delete/mail |
| --- | --- |
| `client`, `quote`, `invoice` | `sales` |
| `payment` | `accountant` |
| `taxes`, `paymentmode` | `admin` |

Thứ tự vai trò: `viewer < sales < accountant < admin < owner`.
Role gate chưa bảo đảm người gọi được phép truy cập bản ghi theo tenant.

## Payload nghiệp vụ

| Entity | Trường quan trọng |
| --- | --- |
| Client | `name` bắt buộc; `email, phone, address, country, assigned` tùy chọn |
| Quote | `number, year, date, expiredDate, client`; items có `itemName, quantity, price, total`; thuế/chiết khấu/tiền tệ/trạng thái |
| Invoice | Joi yêu cầu `client, number, year, date, expiredDate, status, items, taxRate, currency`; `discount` mặc định 0, `notes` tùy chọn |
| Payment | `number, invoice, date, amount, currency`; `paymentMode, ref, description` tùy chọn |
| Taxes | `taxName, taxValue`; `enabled, isDefault` tùy chọn |
| PaymentMode | `name, description`; `ref, enabled, isDefault` tùy chọn |

Invoice tạo mới lấy số chính thức từ bộ đếm, dù Joi hiện vẫn yêu cầu caller gửi `number`.
Quote và payment chưa có cùng cơ chế cấp số server trong transaction như invoice.
Backend tính lại tổng các dòng/thuế. Không gửi các trường thêm ngoài Joi cho invoice:
schema model có field không có nghĩa create/update API chấp nhận field đó.

Ví dụ body invoice, thay `CLIENT_ID` bằng ID đã tạo trong môi trường cách ly:

```json
{
  "client": "CLIENT_ID",
  "number": 1,
  "year": 2026,
  "date": "2026-10-18T00:00:00.000Z",
  "expiredDate": "2026-11-17T00:00:00.000Z",
  "status": "draft",
  "notes": "Ví dụ nghiệm thu trên môi trường cách ly",
  "items": [
    {"itemName": "Tư vấn", "description": "", "quantity": 2, "price": 100, "total": 200},
    {"itemName": "Đào tạo", "description": "", "quantity": 1, "price": 50, "total": 50}
  ],
  "taxRate": 8,
  "currency": "USD",
  "discount": 20
}
```

Với payment, client được lấy từ hóa đơn thay vì tin client do caller gửi.
Gửi đúng currency của hóa đơn; controller chưa kiểm tra đồng bộ mọi tham chiếu/tiền tệ theo tenant.
Amount phải hữu hạn, dương và không vượt số còn phải thu; sửa payment giữ nguyên hóa đơn gốc.

## Phân trang, lọc và tổng hợp

`list` trả `pagination: {page, pages, count}`.
Handler chung giới hạn `items` từ 1 đến 100, mặc định 10, page ít nhất 1.
Handler riêng của invoice/quote hiện không áp cùng giới hạn và whitelist.

```text
GET /api/client/list?page=1&items=10&sortBy=created&sortValue=-1
GET /api/invoice/list?page=1&items=10&filter=paymentStatus&equal=unpaid
GET /api/client/search?fields=name,email&q=Example
GET /api/client/filter?filter=enabled&equal=true
GET /api/client/listAll?enabled=true&sort=desc
GET /api/invoice/summary?type=month
```

Search chung giới hạn 20 kết quả; validation của search/filter không đồng nhất với list.
Summary tài chính nhận `week`, `month` hoặc `year`, nhưng một số pipeline hiện chưa áp bộ lọc ngày.
Không dùng tên `type` trong thông báo làm bằng chứng báo cáo đã được giới hạn kỳ hoặc tenant.
ListAll có thể tải nhiều bản ghi; không dùng như giao diện phân trang cho dữ liệu lớn.

## Chuyển đổi, gửi mail và download

| Method | Route | Input và hành vi |
| --- | --- | --- |
| POST | `/api/quote/convert/:id` | Tối thiểu sales; tạo invoice draft; chống chuyển lần hai bằng transaction |
| POST | `/api/quote/mail` | JSON `{"id":"QUOTE_ID"}`; tối thiểu sales |
| POST | `/api/invoice/mail` | JSON `{"id":"INVOICE_ID"}`; tối thiểu sales |
| POST | `/api/payment/mail` | JSON `{"id":"PAYMENT_ID"}`; tối thiểu accountant |
| GET | `/download/{entity}/{entity}-{id}.pdf` | Entity quote/invoice/payment; Bearer; trả binary PDF |
| GET | `/public/:subPath/:directory/:file` | Không Bearer; giới hạn đường dẫn trong public root, chưa cô lập tenant |

Convert tìm báo giá theo tổ chức của user, hoặc createdBy nếu user chưa có tổ chức.
Không có validation đầy đủ cho accepted/expiry; xem [hướng dẫn nghiệp vụ](../product/user-guide.md).
Download có ownership filter, nhưng không coi file là bảo mật khi route public vẫn có thể phục vụ cùng cây file.

PDF không nằm trong JSON envelope; kiểm tra HTTP status và `Content-Type`.
Gửi mail tạo PDF đính kèm và dùng cấu hình SMTP runtime.
Message còn nhắc Mailpit ngay cả khi SMTP đổi; kiểm tra nơi nhận thực tế.

## Tài khoản và settings

Các route dưới đây đều nằm sau Bearer middleware:

| Method | Route | Quyền/input |
| --- | --- | --- |
| GET | `/api/admin/read/:id` | owner/admin |
| PATCH | `/api/admin/password-update/:id` | owner; `password` |
| PATCH | `/api/admin/profile/password` | User hiện tại; `password, passwordCheck` |
| PATCH | `/api/admin/profile/update` | `email, name, surname`; multipart `file` khi cập nhật ảnh |
| POST | `/api/setting/create` | owner/admin; theo schema Setting |
| GET | `/api/setting/read/:id` | owner/admin |
| PATCH | `/api/setting/update/:id` | owner/admin |
| GET | `/api/setting/search`, `list`, `listAll`, `filter` | owner/admin; không có setting/delete hoạt động |
| GET | `/api/setting/readBySettingKey/:settingKey` | owner/admin |
| GET | `/api/setting/listBySettingKey` | owner/admin; query `settingKeyArray=key1,key2` |
| PATCH | `/api/setting/updateBySettingKey/:settingKey` | owner/admin; `{"settingValue":"..."}` |
| PATCH | `/api/setting/updateManySetting` | owner/admin; `{"settings":[{"settingKey":"...","settingValue":"..."}]}` |
| PATCH | `/api/setting/upload/:settingKey` | owner/admin; multipart field `file` |

Upload lưu file local; lọc MIME không thay thế kiểm tra nội dung hoặc quota.
Ở route setting/upload, middleware ghi file chạy trước role gate: đây là hạng mục bảo mật phải xử lý.
Không có API quản trị đầy đủ vòng đời tenant/user được công bố qua các route này.

## Phản hồi và lỗi

Envelope thường có `success, result, message`; list có thêm `pagination`.
Không có một error schema đồng nhất cho mọi handler.

| HTTP | Ý nghĩa thường gặp |
| --- | --- |
| 200 | Thành công; PDF là binary |
| 202 / 203 | Một số handler trả “không tìm thấy/rỗng/input không hợp lệ”; phải kiểm tra `success` |
| 400 | Validation, số tiền, tham chiếu hoặc download không hợp lệ |
| 401 | Thiếu/hết hạn/sai token hoặc phiên không còn trong loggedSessions |
| 403 | Thiếu role hoặc thông tin xác thực/reset không hợp lệ |
| 404 | Route/bản ghi/tài khoản không tìm thấy |
| 409 | Validation auth, trạng thái tài khoản hoặc báo giá đã chuyển |
| 429 | Vượt rate limit |
| 500 | Lỗi handler/server; không hiển thị nguyên payload nội bộ cho người dùng |

API giới hạn mặc định 300 request/15 phút; auth limiter đếm request auth thất bại, mặc định 50/15 phút.
API limiter vẫn tính cả request login thành công.
Giới hạn và proxy cần được kiểm tra lại trước triển khai SaaS nhiều instance.

## Nguồn đối chiếu

- [Route nghiệp vụ](../../backend/src/routes/appRoutes/appApi.js), [route core](../../backend/src/routes/coreRoutes/coreApi.js).
- [Route auth](../../backend/src/routes/coreRoutes/coreAuth.js), [download](../../backend/src/handlers/downloadHandler/downloadPdf.js).
- [Public file](../../backend/src/routes/coreRoutes/corePublicRouter.js).
- [Controllers nghiệp vụ](../../backend/src/controllers/appControllers), [CRUD chung](../../backend/src/controllers/middlewaresControllers/createCRUDController).
- [Invoice Joi](../../backend/src/controllers/appControllers/invoiceController/schemaValidate.js).
- [Auth/user handlers](../../backend/src/controllers/middlewaresControllers), [security middleware](../../backend/src/middlewares/security.js).
