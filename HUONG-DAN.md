# HoBii Story: hướng dẫn dùng

## 1. Xem thử trên máy

Mở cửa sổ lệnh trong thư mục này và chạy:

```bash
npm run dev
```

Rồi mở http://localhost:4321 trong trình duyệt. Hiện website đang dùng nội dung mẫu.

## 2. Sửa chữ trên website

Mọi chữ cố định (lời chào, câu trích, phần Thư viện, phần Về HoBii, đường dẫn fanpage và ezlib) nằm trong tệp `site.config.json`. Sửa xong chạy lại `npm run dev`.

## 3. Thêm ảnh

Bỏ ảnh vào thư mục `assets/photos/` với đúng tên:

| Tên tệp | Dùng ở đâu |
|---|---|
| `hero.jpg` | Ảnh nền phần đầu trang chủ |
| `quote.jpg` | Ảnh bên trái khung câu trích |
| `about.jpg` | Ảnh chân dung ở trang Về HoBii |
| `sach.jpg` | Ô ảnh "Sách và review" trên trang chủ (không bắt buộc) |
| `viet.jpg` | Ô ảnh "Góc viết" trên trang chủ (không bắt buộc) |
| `thuvien.jpg` | Ô ảnh "Thư viện" trên trang chủ (không bắt buộc) |

**Tự thay ảnh:** chép ảnh mới vào `assets/photos/` với đúng tên ở bảng trên (đè lên ảnh cũ), rồi chạy `npm run dev`. Website tự nhận ra ảnh đã đổi.

**Tự chỉnh phần nào của ảnh được hiện:** mở `site.config.json`, tìm mục `focus`, điền vào ảnh cần chỉnh hai số phần trăm, ví dụ `"about": "50% 20%"`. Số thứ nhất là ngang (0% sát trái, 100% sát phải), số thứ hai là dọc (0% sát trên, 100% sát dưới). Muốn thấy phần trên của ảnh thì giảm số thứ hai. Để trống thì website tự lấy giữa ảnh.

Chữ trên trang chủ đè lên ảnh, nên ảnh nền (`hero.jpg`, `quote.jpg`) nên chọn ảnh không quá nhiều chi tiết ở phần giữa và phần dưới. Website tự phủ một lớp xanh lục mờ để chữ trắng luôn đọc được.

Có thể dùng đuôi `.png` hoặc `.webp`. Chưa có ảnh thì website tự dùng hình vẽ tạm. Nên chọn ảnh sáng, ít đồ, chừa chỗ trống bên trái ảnh nền để đặt chữ.

## 4. Nối với Notion (để tự đăng bài)

**Tình trạng hiện tại: đã nối xong.** Hai bảng "HoBii Story - Sách và review" và "HoBii Story - Bài viết" đã có sẵn, kết nối "HoBii Story" đã được cấp quyền, tệp `.env` đã có đủ mã. Mỗi lần viết xong bài, đổi Trạng thái thành **Đăng**, rồi chạy `npm run dev`. Các bước 1 đến 4 bên dưới chỉ cần khi làm lại từ đầu.

**Bước 1. Tạo hai bảng trong Notion** với đúng tên cột sau.

Bảng Sách:

| Cột | Kiểu |
|---|---|
| Tên sách | Tiêu đề (có sẵn) |
| Tác giả | Văn bản |
| Thể loại | Chọn một |
| Điểm | Số (từ 1 đến 5) |
| Bìa | Tệp và phương tiện |
| Tóm tắt | Văn bản |
| Ngày | Ngày |
| Trạng thái | Chọn một, có giá trị **Nháp** và **Đăng** |
| Link ezlib | Đường dẫn (không bắt buộc) |

Bảng Bài viết:

| Cột | Kiểu |
|---|---|
| Tiêu đề | Tiêu đề (có sẵn) |
| Mục | Chọn một (Tâm sự, Ghi nhanh, Chuyện sách... tùy HoBii đặt) |
| Ảnh | Tệp và phương tiện |
| Tóm tắt | Văn bản |
| Ngày | Ngày |
| Trạng thái | Chọn một, có giá trị **Nháp** và **Đăng** |

Nội dung bài viết, bài review thì viết ngay bên trong trang của từng dòng, có thể dán ảnh, chia đoạn, in đậm, trích dẫn, dán đường dẫn YouTube.

**Bước 2. Tạo "chìa" cho Notion.** Vào notion.so/my-integrations, tạo một kết nối mới, sao chép mã bí mật. Sau đó mở từng bảng trong Notion, bấm dấu ba chấm, chọn Kết nối, rồi chọn kết nối vừa tạo.

**Bước 3. Điền vào tệp `.env`.** Sao chép `.env.example` thành `.env`, điền mã bí mật và mã của hai bảng (đoạn chữ dài trong đường dẫn của bảng). Không gửi tệp `.env` cho ai.

**Bước 4.** Chạy `npm run dev`. Chỉ những dòng có Trạng thái là **Đăng** mới lên website.

## 5. Ảnh được lưu thế nào

Mỗi lần cập nhật, website tải ảnh trong Notion về, thu nhỏ rồi lưu cùng trang. Vì vậy ảnh chụp bằng điện thoại cũng không làm trang chậm, và ảnh không bị hỏng khi đường dẫn của Notion hết hạn.

## 6. Website trên mạng và cách cập nhật

Website được lưu miễn phí trên GitHub.

- Địa chỉ website: https://hongbichdo.github.io/hobii-story/
- Nút cập nhật ngay: https://github.com/HongBichDo/hobii-story/actions/workflows/cap-nhat-website.yml (bấm **Run workflow**, rồi bấm nút xanh **Run workflow**) Bài trong Notion lên website theo hai cách:

- **Tự động mỗi ngày lúc 6 giờ sáng.** Không cần làm gì.
- **Cập nhật ngay khi muốn:** vào GitHub, mở kho `hobii-story`, chọn mục **Actions**, chọn **Cập nhật website**, bấm **Run workflow** rồi bấm nút xanh **Run workflow** lần nữa. Khoảng 1 đến 2 phút sau website đổi. Làm được cả trên điện thoại (ứng dụng GitHub hoặc trình duyệt).

Muốn ẩn một bài: đổi Trạng thái trong Notion về **Nháp**. Muốn xoá hẳn: xoá dòng đó. Bài sẽ biến khỏi website ở lần cập nhật tiếp theo.

Lưu ý: nếu kho trên GitHub không có thay đổi gì trong 60 ngày, GitHub có thể tạm dừng lịch chạy mỗi ngày. Khi đó GitHub gửi thư báo, chỉ cần bấm "Enable workflow" trong mục Actions là chạy lại.
