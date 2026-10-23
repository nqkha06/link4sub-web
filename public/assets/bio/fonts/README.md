# Font tự host cho trang bio

Font riêng (không có trên Google Fonts / Fontshare) đặt ở đây dạng `.woff2`, rồi
khai báo tên font trong `INSTALLED_LOCAL_FONTS`
(`src/features/link-in-bio/public/bio-public-fonts.tsx`). Font chưa khai báo dùng
font Google gần giống (cột "Dự phòng") và không tải file (tránh request 404).
Font đã khai báo mà tải lỗi cũng tự chuyển sang font dự phòng.

| Font        | File                | Trạng thái                                            | Dự phòng     |
|-------------|---------------------|-------------------------------------------------------|--------------|
| Minecraft   | `minecraft.woff2`   | ✅ Đã cài — Pwnage_Block, CC BY-SA 3.0 (xem LICENSE-minecraft.txt) | Silkscreen |
| Starborn    | `starborn.woff2`    | ❌ Chưa cài — Hawtpixel: dùng thương mại phải mua giấy phép | Luckiest Guy |
| MetalGothic | `metalgothic.woff2` | ❌ Chưa cài — Nirmana Visual: bản demo, chỉ dùng cá nhân | Pirata One   |
| Drippy      | `drippy.woff2`      | ❌ Chưa cài — chưa xác định được font gốc              | Creepster    |
| Sakura      | `sakura.woff2`      | ❌ Chưa cài — chưa xác định được font gốc              | Sniglet      |

Thêm font: chép file `.woff2` (đổi định dạng nếu cần, vd.
`python3 -c "from fontTools.ttLib import TTFont; f=TTFont('a.ttf'); f.flavor='woff2'; f.save('a.woff2')"`),
kèm file giấy phép, rồi thêm tên vào `INSTALLED_LOCAL_FONTS`. Chỉ dùng font có
giấy phép cho phép dùng thương mại và nhúng/tự host trên web.
