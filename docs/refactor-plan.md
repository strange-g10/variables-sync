# Refactor Plan for Figma Variables Sync Plugin

## 1. Mục tiêu refactor
- Tách biệt rõ ràng UI và business logic
- Chuẩn hóa message passing giữa UI và backend
- Gom nhóm, mô-đun hóa các tính năng để dễ bảo trì, mở rộng
- Cải thiện khả năng phát triển UI mới, thêm tính năng, sửa lỗi

## 2. Liệt kê các tính năng hiện có
- **Export**: Export full, export IDs, clear collections
- **Import**: Fetch sheet list, import variables, exclude sheets, cancel import
- **Assign**: Assign variables, force assign
- **Sheet link cache**: Lưu, lấy link Google Sheet gần đây
- **Log/Progress**: Hiển thị log, progress bar, export log
- **UI state**: Enable/disable button, hiển thị thông báo, multi-step UI
- **Collections**: Lấy danh sách collections, clear collections

## 3. Định hướng refactor
### a. Tách UI thành các component nhỏ
- Mỗi tab (Export, Import, Assign, Log) là một component riêng
- Các phần tử nhỏ hơn (button, input, sheet list, progress bar, log area) cũng là component riêng
- Sử dụng event hoặc message để giao tiếp giữa các component UI

### b. Tách logic xử lý từng tính năng
- Mỗi tính năng (import, export, assign, log, sheet cache) là một module riêng trong `features/`
- Các hàm xử lý chỉ nhận dữ liệu đầu vào, trả về kết quả hoặc trạng thái, không thao tác trực tiếp với DOM

### c. Chuẩn hóa message passing
- Định nghĩa rõ các loại message, payload, response giữa UI và backend
- Sử dụng TypeScript interface cho message để tránh lỗi truyền dữ liệu

### d. Quy hoạch lại state
- State UI (sheet list, excludeSheets, trạng thái import, ...) nên lưu ở component hoặc một store chung
- State logic (danh sách variable, collection, log) nên lưu ở backend, chỉ gửi lên UI khi cần

### e. Tách biệt các bước xử lý
- Các thao tác nhiều bước (multi-step) như import:
  1. Nhập link → 2. Fetch sheet list → 3. Chọn sheet → 4. Import
  Nên tách thành các hàm riêng, UI chuyển trạng thái theo từng bước

## 4. Lộ trình refactor
- **Bước 1:** Liệt kê, mô tả các tính năng hiện có, xác định các điểm giao nhau
- **Bước 2:** Refactor từng tính năng một, ưu tiên các tính năng hay thay đổi hoặc có UI phức tạp (ví dụ: import)
- **Bước 3:** Chuẩn hóa message passing và interface giữa UI/logic
- **Bước 4:** Tách UI thành các component nhỏ, dễ tái sử dụng
- **Bước 5:** Viết lại/tối ưu các hàm xử lý logic, đảm bảo dễ test và mở rộng

## 4.1. Kế hoạch chi tiết cho Bước 1: Liệt kê, mô tả các tính năng hiện có, xác định các điểm giao nhau

### Mục tiêu ưu tiên
- Đảm bảo mọi tính năng hiện tại vẫn hoạt động ổn định trong suốt quá trình refactor (không đứt gẫy pipeline import/export/assign/log).
- Chỉ refactor từng phần nhỏ, kiểm thử kỹ sau mỗi thay đổi.
- Ghi chú rõ các điểm giao nhau giữa các module/tính năng để tránh ảnh hưởng lẫn nhau.

### Các bước thực hiện
1. **Tổng hợp chi tiết các tính năng hiện có**
   - Mô tả ngắn gọn từng tính năng, input/output, các file liên quan.
   - Đánh dấu các tính năng có liên quan trực tiếp đến nhau (ví dụ: import và log, export và collections).
2. **Vẽ sơ đồ luồng hoạt động chính**
   - Sơ đồ hóa các bước chính của pipeline: import, export, assign, log, UI state.
   - Xác định các điểm giao tiếp giữa UI và backend, giữa các module logic.
3. **Kiểm thử lại toàn bộ tính năng hiện tại**
   - Viết checklist kiểm thử cho từng tính năng (manual test hoặc script test nếu có).
   - Đảm bảo mọi tính năng đều pass trước khi bắt đầu refactor.
4. **Ghi chú các ràng buộc, dependency**
   - Ghi rõ các module dùng chung (ví dụ: log, progress, sheet cache).
   - Đánh dấu các phần code cần chú ý khi refactor (ví dụ: message passing, state share giữa các tab UI).

### Ưu tiên thực hiện
- **Không thay đổi logic xử lý chính** khi refactor UI/structure.
- **Luôn giữ một nhánh code ổn định** (có thể tạo branch `refactor-base` để phát triển song song, tránh ảnh hưởng production).
- **Kiểm thử lại sau mỗi lần refactor nhỏ** để phát hiện lỗi sớm.

### Kết quả mong đợi sau Bước 1
- Có tài liệu mô tả chi tiết từng tính năng, luồng hoạt động, các điểm giao nhau.
- Có checklist kiểm thử cho toàn bộ tính năng hiện tại.
- Sẵn sàng cho các bước refactor tiếp theo mà không làm gián đoạn hoạt động của plugin.

## 4.2. Phương pháp ghi chú và quản lý tiến độ refactor từng bước

### Cách ghi chú cho từng bước
- Tạo một bảng checklist cho mỗi bước lớn (ví dụ: Bước 1, Bước 2, ...)
- Mỗi checklist gồm các mục việc cần làm (To do), đang làm (In progress), đã hoàn thành (Done)
- Ghi rõ ngày bắt đầu, ngày hoàn thành, người thực hiện (nếu làm teamwork)
- Ghi chú chi tiết các vấn đề phát sinh, giải pháp, link commit/code liên quan

### Mẫu bảng quản lý tiến độ cho từng bước

| Việc cần làm                | Trạng thái      | Người thực hiện | Ngày bắt đầu | Ngày hoàn thành | Ghi chú/Link liên quan |
|----------------------------|-----------------|-----------------|--------------|-----------------|-----------------------|
| Mô tả chi tiết tính năng X | To do/In progress/Done | Tên | yyyy-mm-dd   | yyyy-mm-dd      | ...                   |

### Hướng dẫn sử dụng
- Thêm bảng này vào cuối mỗi mục lớn (ví dụ: sau 4.1, 4.2, ...)
- Cập nhật trạng thái từng việc sau mỗi lần thực hiện/thay đổi
- Ghi chú rõ các vấn đề gặp phải và cách xử lý để dễ truy vết
- Có thể tách riêng file `refactor-progress.md` nếu muốn quản lý độc lập tiến độ

### Ví dụ áp dụng cho Bước 1

#### Checklist Bước 1: Liệt kê, mô tả các tính năng hiện có (dạng checklist)
- [x] Tổng hợp danh sách tính năng hiện có
- [ ] Mô tả input/output, file liên quan từng tính năng
- [ ] Đánh dấu các tính năng liên quan trực tiếp
- [ ] Vẽ sơ đồ pipeline hoạt động chính
- [ ] Viết checklist kiểm thử cho từng tính năng
- [ ] Ghi chú các dependency, module dùng chung

> Cập nhật trạng thái bằng cách thay đổi [ ] thành [x] khi hoàn thành từng mục.

## 5. Ghi chú
- Nên refactor từng phần nhỏ, kiểm thử kỹ sau mỗi bước
- Có thể bổ sung thêm các đề xuất chi tiết cho từng tính năng nếu cần
