# Rà soát upload member — 2026-10-23

Phạm vi: Bio (avatar, gallery, background, music), tạo link (cover, file đích),
Media Manager của member và luồng multipart dùng chung. Đọc thêm implementation
`stu-api/src/modules/files/{files.controller,files.service,multipart-upload.storage}.ts`
để đối chiếu; bản sửa này nằm trong stu-web.

## Đã xử lý

- Bio chọn nhạc dùng phần mở rộng cụ thể thay `audio/*`, tránh picker iOS lọc
  nhầm sang video. Cho phép MP3, M4A, AAC, WAV, FLAC, OGG/OGA, Opus, AIFF.
- Nếu File Provider không trả MIME hoặc trả octet-stream, suy ra MIME cho các
  định dạng audio, ảnh và video phổ biến từ đuôi file. Không ghi đè MIME cụ thể
  do trình duyệt cung cấp. Backend vẫn giữ validation và chính sách nội dung.
- Chặn file rỗng; picker kiểm dung lượng theo cấu hình trước khi upload.
- Khởi tạo/hoàn tất có deadline 120 giây, gồm cả đọc response body.
- Mỗi part có watchdog 90 giây không có tiến triển; reset khi có thêm dữ liệu.
  Không đặt giới hạn tổng thời gian truyền file, để mạng chậm còn tiến triển
  vẫn tiếp tục. Timer trình duyệt có thể bị trì hoãn khi tab chạy nền.
- Dọn phiên lỗi chạy riêng, giới hạn 10 giây; không giữ UI ở trạng thái chờ.
- Không tự DELETE phiên sau khi bắt đầu complete: mất response chưa chắc server
  thất bại, DELETE có thể chạy đua và xóa file đang được hoàn tất.
- Chỉ báo 100% sau khi API hoàn tất trả thành công. Chuẩn hóa progress FormData
  theo kích thước part, tránh tính cả overhead multipart vào số byte file.
- Bio picker hiển thị progress/finalizing, chặn khởi chạy trùng, hủy khi đóng hoặc
  unmount; upload batch tuần tự, giữ các file đã thành công nếu file sau bị lỗi.
  Tạo link cũng giữ ngay file đã upload thành công trong danh sách.
- Giữ hàng đợi Media Manager tối đa hai upload đồng thời và retry thủ công.
- Thông báo timeout/network/file rỗng và trạng thái mới có vi/en/id.

## Giới hạn và rủi ro còn lại

| Rủi ro | Bằng chứng / ảnh hưởng | Hướng tiếp theo |
| --- | --- | --- |
| Reload, đóng tab, iOS thu hồi tab | Hàng đợi, File và uploadId chỉ ở bộ nhớ; không có resume client | Thêm API tra cứu part và lưu phiên; yêu cầu chọn lại file khi cần |
| Hoàn tất mất response | Server có thể đã lưu file; retry toàn file có thể tạo bản thứ hai | Kiểm tra Media Manager trước retry; thêm status/idempotency ở API |
| Khởi tạo chậm khi tồn nhiều phiên hết hạn | `initiate()` await `cleanupExpiredUploads()`; cleanup vòng lặp tuần tự và gọi object storage từng phiên | Chuyển sang job nền, xử lý theo batch |
| Hủy part đang xử lý ở server | Abort client không bảo đảm dừng công việc đã chạy; API abort/putPart cần xét race ở object storage | Thêm kiểm tra trạng thái/khóa phiên và job dọn |
| Bộ nhớ và độ trễ proxy | BFF đọc cả request thành ArrayBuffer; API multer memoryStorage; mỗi part 5 MiB đi qua browser → BFF → API → storage | Load test đồng thời; cân nhắc presigned upload trực tiếp |
| Giới hạn hạ tầng | Chưa kiểm cấu hình reverse proxy/deployment thực tế | Body limit phải lớn hơn 5 MiB cộng overhead; kiểm timeout BFF/API/storage và log 413/502/504 |
| Codec / file giả đuôi | Chọn hoặc upload thành công không bảo đảm trình duyệt phát được nội dung; đuôi/MIME chỉ là metadata | Test decode trên thiết bị; validation/transcode theo chính sách sản phẩm |

Không tự retry request complete vì chưa có contract idempotency. Phiên không xác
định kết quả được để backend dọn theo TTL 24 giờ; khi không có upload mới,
cleanup hiện tại có thể không chạy ngay sau TTL.

## Mức kiểm chứng

Đã chạy lint, typecheck, test và production build. Test deterministic bao phủ
MIME thiếu/sai, timeout, hủy, progress mạng chậm, HTTP error và dọn watchdog.

Chưa có phiên kiểm thử trên iPhone 17 Pro Max thật, Android hoặc từng bản Safari,
Chrome, Firefox, Edge. Không thể xác nhận tương thích toàn bộ thiết bị chỉ từ
test code hay giả lập kích thước màn hình. Các primitive dùng là File/Blob,
FormData, XMLHttpRequest, fetch và AbortController; không phụ thuộc user-agent.

Cần test thiết bị thật: MP3 trong On My iPhone/iCloud/Files provider, M4A từ
Voice Memos, JPEG/HEIC/MOV, chọn lại cùng file, batch lỗi giữa chừng, hủy khi đang
truyền/hoàn tất, đổi Wi-Fi sang 4G, offline, khóa màn hình rồi quay lại, quota đầy
và access token hết hạn. Với HEIC/codec đặc biệt, upload và khả năng preview/phát
là hai bước kiểm tra riêng.

Nguồn: [WebKit audio picker bug](https://bugs.webkit.org/show_bug.cgi?id=242110),
[WebKit file upload panel](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/UIProcess/ios/forms/WKFileUploadPanel.mm),
[WebKit báo cáo file không còn đọc được sau khi tab được phục hồi](https://bugs.webkit.org/show_bug.cgi?id=319396).
