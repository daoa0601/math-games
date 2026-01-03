# ShapeArchitect: Xưởng Xây Dựng

**Khẩu hiệu:** Xây dựng hình khối 3D bằng các khối trên bàn thợ thủ công

**Độ tuổi mục tiêu:** Lớp 1-8 / 6-14 tuổi

**Thời lượng buổi chơi:** 5-20 phút mỗi câu đố

---

## Tổng quan trò chơi

ShapeArchitect là trò chơi giải đố giáo dục thách thức học sinh lấp đầy các hình dạng mục tiêu bằng các mảnh ghép hình học trong không gian 2D và 3D. Người chơi kéo các khối màu sắc lên lưới bàn gỗ, xoay chúng để tìm vị trí khớp hoàn hảo. Trò chơi phát triển khả năng tư duy không gian, trực giác hình học và kỹ năng giải quyết vấn đề thông qua các cấp độ khó tăng dần.

### Mục tiêu học tập cốt lõi

1. **Tư duy không gian:** Phát triển khả năng xoay và thao tác vật thể 3D trong tâm trí
2. **Bảo toàn thể tích:** Hiểu rằng các mảnh ghép có thể sắp xếp lại mà không thay đổi tổng thể tích
3. **Phép biến hình:** Thực hành phép quay trong 2D (trục Z) và 3D (trục X, Y, Z)
4. **Lập kế hoạch chiến lược:** Học cách làm việc ngược từ mục tiêu và quản lý tài nguyên hạn chế

### Chủ đề hình ảnh: Xưởng xây dựng

Trò chơi sử dụng **phong cách xưởng mộc** để làm cho các khái niệm hình học trở nên cụ thể:

- **Nền bàn làm việc:** Kết cấu vân gỗ tạo ra không gian làm việc của thợ thủ công
- **Lưới bản vẽ:** Các ô mục tiêu hiển thị mẫu bản vẽ với đường trắng trên nền xanh
- **Khối màu sắc:** Các mảnh tetromino và polycube rực rỡ với màu sắc riêng biệt
- **Hiệu ứng lắp vào:** Các mảnh ghép "rung lắc" vào chỗ với tiếng kêu đáp ứng khi đặt
- **Vụ nổ bụi:** Đặt thành công kích hoạt hiệu ứng hạt với vòng tròn mở rộng

Tất cả hoạt ảnh sử dụng CSS tăng tốc GPU (`transform`, `opacity`, `filter`) và tôn trọng `prefers-reduced-motion` cho khả năng tiếp cận.

---

## Nền tảng toán học

### Khái niệm cốt lõi

#### 1. Hình học không gian

ShapeArchitect hoạt động trong **hệ tọa độ 3D** ngay cả đối với các câu đố 2D:

- **Trục X:** Ngang (trái-phải)
- **Trục Y:** Dọc (lên-xuống)
- **Trục Z:** Chiều sâu (trước-sau)

Các cấp độ 2D chỉ sử dụng mặt phẳng XY (z=0), trong khi các cấp độ 3D sử dụng cả ba chiều.

#### 2. Hệ thống xoay 3D

Các mảnh ghép xoay sử dụng **góc Euler** với bước nhảy 90 độ:

| Trục | Tên | Phép biến đổi | Hiệu ứng |
|------|------|----------------|--------|
| X | Pitch | `(x, y, z) → (x, -z, y)` | Nghiêng trước/sau |
| Y | Yaw | `(x, y, z) → (z, y, -x)` | Quay trái/phải |
| Z | Roll | `(x, y, z) → (-y, x, z)` | Xoay trên mặt phẳng sàn |

**Số lần xoay:**
- **Cấp độ 2D:** 4 hướng duy nhất (chỉ trục Z)
- **Cấp độ 3D:** 24 hướng duy nhất (cả ba trục)

24 hướng đến từ thực tế là một khối lập phương có:
- 6 mặt có thể hướng lên trên
- 4 vị trí xoay cho mỗi mặt
- Tổng: 6 × 4 = 24 hướng duy nhất

#### 3. Bảo toàn thể tích

Một nguyên tắc cơ bản: **Tổng thể tích mảnh ghép phải bằng thể tích mục tiêu** để câu đố có thể giải được.

Nếu bạn có 4 mảnh tetromino (mỗi mảnh 4 ô), mục tiêu phải chứa chính xác 16 ô:
```
Thể tích mảnh = 4 mảnh × 4 ô = 16 ô
Thể tích mục tiêu = 16 ô
Có thể giải: CÓ
```

Nếu thể tích không khớp, câu đố không thể giải:
```
Thể tích mảnh = 20 ô
Thể tích mục tiêu = 16 ô
Có thể giải: KHÔNG (4 ô sẽ không vừa)
```

#### 4. Polyomino và Polycube

ShapeArchitect sử dụng các mảnh ghép lát cổ điển từ toán học:

**Tetromino (4 ô):** 7 hình dạng từ Tetris (I, O, T, S, Z, J, L)

**Pentomino (5 ô):** 12 hình dạng độc nhất được tạo thành bằng cách nối 5 hình vuông (F, I, L, N, P, T, U, V, W, X, Y, Z)

**Polycube (3D):** Mở rộng vào ba chiều (Corner3D, Tower, L3D, Cube2x2x2, v.v.)

Những hình dạng này đã được các nhà toán học nghiên cứu trong nhiều thế kỷ và xuất hiện trong toán học giải trí, khoa học máy tính và thiết kế câu đố.

### Liên kết chương trình giảng dạy

#### Tiêu chuẩn Common Core (Mỹ)

| Tiêu chuẩn | Mô tả | Cách ShapeArchitect giải quyết |
|----------|-------------|--------------------------------|
| 1.G.A.2 | Tạo hình 2D để tạo hình phức hợp | Xây dựng hình chữ nhật và hình phức tạp từ tetromino |
| 3.MD.C.5 | Nhận biết diện tích có tính cộng | Hiểu rằng tổng diện tích mảnh bằng diện tích mục tiêu |
| 5.MD.C.3 | Hiểu thể tích như xếp các khối lập phương đơn vị | Cấp độ 3D yêu cầu lấp đầy không gian bằng khối lập phương đơn vị |

#### Chương trình Việt Nam (SGK)

| Lớp | Chủ đề | Liên kết |
|-------|-------|------------|
| Lớp 2 | Hình học phẳng | Tetromino và pentomino 2D |
| Lớp 3 | Diện tích | Bảo toàn diện tích trong cấp độ 2D |
| Lớp 4-5 | Hình học không gian | Polycube 3D và thể tích |

### Mục tiêu học tập theo cấp lớp

**Lớp 1-3 (6-9 tuổi):**
- Nhận biết và đặt tên các hình cơ bản (hình vuông, hình chữ nhật, hình chữ L)
- Hiểu rằng các hình có thể xoay và vẫn giữ nguyên
- Phát triển nhận thức không gian thông qua thao tác

**Lớp 4-6 (9-12 tuổi):**
- Tính diện tích bằng cách đếm ô vuông đơn vị
- Hiểu rằng phép quay bảo toàn diện tích/thể tích
- Thực hành chiến lược giải quyết vấn đề có hệ thống

**Lớp 7-8 (12-14 tuổi):**
- Áp dụng phép biến hình (phép quay trong không gian 3D)
- Sử dụng tư duy đại số để xác minh bảo toàn thể tích
- Phát triển chiến lược quay lui và thỏa mãn ràng buộc

---

## Cơ chế trò chơi

### Mục tiêu

Lấp đầy **hình dạng mục tiêu** (các ô bản vẽ màu xanh) bằng tất cả **mảnh ghép** được cung cấp chính xác một lần mà không có khoảng trống hoặc chồng chéo.

### Quy tắc

1. **Kéo mảnh ghép** từ khay mảnh lên lưới
2. **Xoay mảnh ghép** bằng các nút xoay X/Y/Z (cấp độ 3D) hoặc chỉ Z (cấp độ 2D)
3. **Không chồng lấp:** Các mảnh ghép không thể đặt chồng lên nhau
4. **Phủ mục tiêu:** Ít nhất một ô của mỗi mảnh ghép phải nằm trên ô mục tiêu (xanh)
5. **Lấp đầy hoàn toàn:** Thắng khi tất cả các ô mục tiêu được phủ chính xác

### Phản hồi trực quan

| Trạng thái | Hình ảnh | Mô tả |
|-------|--------|-------------|
| Ô mục tiêu | Xanh với mẫu bản vẽ | Các ô bạn cần lấp đầy |
| Bóng ma hợp lệ | Xanh bán trong suốt | Xem trước vị trí mảnh ghép sẽ đặt |
| Bóng ma không hợp lệ | Đỏ bán trong suốt | Không thể đặt mảnh ghép ở đây |
| Mảnh ghép đã đặt | Màu đặc khớp với mảnh | Mảnh ghép đã đặt thành công |
| Hiệu ứng lắp vào | Rung lắc + vụ nổ bụi | Phản hồi thỏa mãn khi đặt |

### Điều khiển

**Chuột/Chạm:**
- **Kéo:** Nhấp và kéo mảnh từ khay lên lưới
- **Xoay:** Nhấp nút X/Y/Z để xoay mảnh hiện tại
- **Hoàn tác:** Nhấp nút hoàn tác để xóa mảnh cuối cùng
- **Đặt lại:** Nhấp nút đặt lại để bắt đầu lại cấp độ

**Bàn phím (khả năng tiếp cận):**
- **Tab:** Điều hướng giữa các mảnh và nút
- **Enter/Space:** Chọn mảnh hoặc kích hoạt nút
- **Phím mũi tên:** Di chuyển xem trước bóng ma trên lưới
- **R:** Xoay quanh trục Z

### Tính năng lắp vào vị trí gần nhất

Khi bạn kéo một mảnh ghép gần vị trí hợp lệ, trò chơi tự động **lắp** nó vào vị trí hợp lệ gần nhất trong phạm vi 2 ô. Điều này giúp người chơi tránh khỏi sự thất vọng khi phải định vị chính xác từng pixel trong khi vẫn duy trì thách thức.

Ví dụ: Bạn kéo khối I gần hàng 3 nhưng hơi lệch. Trò chơi phát hiện vị trí hợp lệ ở hàng 3 và tự động điều chỉnh mảnh ghép để lắp vào đó.

---

## Tham khảo mảnh ghép

### Tetromino (7 mảnh cổ điển)

Mỗi tetromino bao gồm **4 ô** được sắp xếp theo một mẫu độc nhất. Tất cả đều dựa trên các mảnh ghép nổi tiếng của trò chơi Tetris.

| Tên | Hình vẽ ASCII | Mô tả | Số ô |
|------|---------------------|-------------|-------|
| **I-Block** | `████` | Bốn ô thẳng hàng | 4 |
| **O-Block** | `██`<br>`██` | Hình vuông 2×2 | 4 |
| **T-Block** | `███`<br>` █` | Hình chữ T với tâm bên dưới | 4 |
| **S-Block** | ` ██`<br>`██` | Hình chữ S zic-zắc (lệch phải) | 4 |
| **Z-Block** | `██`<br>` ██` | Hình chữ Z zic-zắc (lệch trái) | 4 |
| **J-Block** | `█`<br>`███` | Hình chữ L hướng trái | 4 |
| **L-Block** | `  █`<br>`███` | Hình chữ L hướng phải | 4 |

**Ví dụ xoay (I-Block):**
```
0°:  ████        90°:  █
                        █
                        █
                        █
```

### Pentomino (12 mảnh độc nhất)

Mỗi pentomino bao gồm **5 ô**. Chúng được sử dụng trong các cấp độ 2D khó hơn.

| Tên | Mẫu hình dạng | Số ô |
|------|---------------|-------|
| **F-Pento** | ` ██`<br>`██`<br>` █` | 5 |
| **I-Pento** | `█`<br>`█`<br>`█`<br>`█`<br>`█` | 5 |
| **L-Pento** | `█`<br>`█`<br>`█`<br>`██` | 5 |
| **N-Pento** | `█`<br>`██`<br>` █`<br>` █` | 5 |
| **P-Pento** | `██`<br>`██`<br>`█` | 5 |
| **T-Pento** | `███`<br>` █`<br>` █` | 5 |
| **U-Pento** | `█ █`<br>`███` | 5 |
| **V-Pento** | `█`<br>`█`<br>`███` | 5 |
| **W-Pento** | `█`<br>`██`<br>` ██` | 5 |
| **X-Pento** | ` █`<br>`███`<br>` █` | 5 |
| **Y-Pento** | ` █`<br>`██`<br>` █`<br>` █` | 5 |
| **Z-Pento** | `██`<br>` █`<br>` ██` | 5 |

### Polycube 3D

Những mảnh này mở rộng vào chiều thứ ba (z > 0). Chỉ được sử dụng trong các cấp độ 3D.

| Tên | Mô tả | Số ô | Loại |
|------|-------------|-------|------|
| **Cube2x2** | Khối phẳng 2×2 (chỉ z=0) | 4 | Tetracube |
| **Cube2x2x2** | Khối lập phương đặc 2×2×2 | 8 | Octacube |
| **Corner3D** | Mảnh góc ba chiều | 4 | Tetracube |
| **Tower4** | Chồng dọc 4 khối lập phương | 4 | Tetracube |
| **L3D** | Hình chữ L mở rộng theo chiều dọc | 4 | Tetracube |
| **T3D** | Hình chữ T với phần mở rộng dọc | 4 | Tetracube |
| **Step3D** | Cầu thang trong 3D | 4 | Tetracube |
| **Plus3D** | Dấu cộng trong 3D (chữ thập) | 5 | Pentacube |
| **Stairs3D** | Cầu thang ba bậc | 5 | Pentacube |
| **Hook3D** | Hình chữ L với phần mở rộng vuông góc | 5 | Pentacube |
| **Bracket3D** | Khung hình chữ U trong 3D | 6 | Hexacube |

**Ví dụ xoay 3D (Corner3D):**
```
Gốc (0°, 0°, 0°):         Sau khi xoay Y 90° (0°, 90°, 0°):
  z=0: ██                   z=0:  █
       █                          ██
  z=1: █                    z=1: █
```

---

## Tiến triển độ khó

### Cấp độ 2D

| Độ khó | Kích thước lưới | Số mảnh | Loại mảnh | Kích thước mục tiêu | Số lần xoay |
|------------|-----------|--------|-------------|-------------|-----------|
| **Dễ** | 6×6 đến 8×5 | 4-6 | O-block, I-block | 16-24 ô | Chỉ Z (4) |
| **Trung bình** | 8×8 | 5-6 | Tetromino hỗn hợp | 20 ô | Chỉ Z (4) |
| **Khó** | 8×5 đến 11×7 | 6-8 | Tetromino + pentomino | 24-32 ô | Chỉ Z (4) |

**Chiến lược tiến triển (2D):**
- **Dễ:** Hình dạng đơn giản (hình vuông, hình chữ nhật) chỉ với O-block hoặc I-block
- **Trung bình:** Hình dạng không đều (dấu cộng, chữ H, cầu thang) với tetromino hỗn hợp
- **Khó:** Hình dạng phức tạp yêu cầu tất cả 7 tetromino hoặc pentomino

### Cấp độ 3D

| Độ khó | Kích thước lưới | Số mảnh | Loại mảnh | Kích thước mục tiêu | Số lần xoay |
|------------|-----------|--------|-------------|-------------|-----------|
| **Dễ** | 4×4×3 | 2-3 | Khối Cube2x2 | 8-12 ô | X,Y,Z (24) |
| **Trung bình** | 4×4×5 đến 6×6×3 | 4 | Cube2x2 hoặc Cube2x2x2 | 16 ô | X,Y,Z (24) |
| **Khó** | 4×4×7 đến 7×6×3 | 3-6 | Polycube hỗn hợp | 24 ô | X,Y,Z (24) |

**Chiến lược tiến triển (3D):**
- **Dễ:** Khối lập phương và tháp đơn giản với mảnh đồng nhất
- **Trung bình:** Cấu trúc nhiều tầng (nền tảng, khối lập phương kép)
- **Khó:** Hình dạng 3D phức tạp yêu cầu đặt chiến lược

---

## Cấp độ sẵn có (Tổng 18)

### Cấp độ 2D Dễ (4 cấp độ)

#### 1. Hình vuông 4×4
- **Mục tiêu:** Hình vuông 4×4 (16 ô)
- **Mảnh ghép:** 4 O-block (vàng, xanh lá, xanh dương, hồng)
- **Lưới:** 6×6
- **Trọng tâm học tập:** Lấp đầy hình cơ bản với mảnh đồng nhất

#### 2. Dải dài
- **Mục tiêu:** Hình chữ nhật 8×2 (16 ô)
- **Mảnh ghép:** 4 I-block (xanh lơ, xanh lá, cam, tím)
- **Lưới:** 8×5
- **Trọng tâm học tập:** Cơ bản xoay (ngang ↔ dọc)

#### 3. Hình chữ T
- **Mục tiêu:** Hình chữ T (16 ô)
- **Mảnh ghép:** 4 O-block (xanh lơ, tím, hồng, cam)
- **Lưới:** 7×7
- **Trọng tâm học tập:** Lắp mảnh vào hình không chữ nhật

#### 4. Hình chữ nhật
- **Mục tiêu:** Hình chữ nhật 6×4 (24 ô)
- **Mảnh ghép:** 6 O-block (màu khác nhau)
- **Lưới:** 8×5
- **Trọng tâm học tập:** Tăng số lượng mảnh

### Cấp độ 2D Trung bình (3 cấp độ)

#### 5. Dấu cộng
- **Mục tiêu:** Hình dấu cộng (20 ô)
- **Mảnh ghép:** 5 O-block (vàng, xanh lá, xanh lơ, tím, hồng)
- **Lưới:** 8×8
- **Trọng tâm học tập:** Hình đối xứng với chữ thập trung tâm

#### 6. Cầu thang
- **Mục tiêu:** Mẫu cầu thang (20 ô)
- **Mảnh ghép:** 5 O-block (vàng, xanh lá, xanh dương, cam, hồng)
- **Lưới:** 8×5
- **Trọng tâm học tập:** Mẫu lệch yêu cầu đặt chiến lược

#### 7. Hình chữ H
- **Mục tiêu:** Mẫu chữ H (20 ô)
- **Mảnh ghép:** 4 O-block + 1 I-block (màu hỗn hợp)
- **Lưới:** 8×6
- **Trọng tâm học tập:** Kết hợp các loại mảnh khác nhau

### Cấp độ 2D Khó (6 cấp độ)

#### 8. Tetris Master
- **Mục tiêu:** Hình chữ nhật 6×4 (24 ô)
- **Mảnh ghép:** 2 I-block + 4 O-block (hỗn hợp)
- **Lưới:** 8×5
- **Trọng tâm học tập:** Đóng gói hiệu quả với mảnh hỗn hợp

#### 9. Hình chữ nhật lớn
- **Mục tiêu:** Hình chữ nhật 8×4 (32 ô)
- **Mảnh ghép:** 8 O-block (8 màu khác nhau)
- **Lưới:** 10×5
- **Trọng tâm học tập:** Tổ chức quy mô lớn

#### 10. Bảng dài
- **Mục tiêu:** Hình chữ nhật 8×4 (32 ô)
- **Mảnh ghép:** 8 I-block (8 màu khác nhau)
- **Lưới:** 10×5
- **Trọng tâm học tập:** Thành thạo mẫu xoay

#### 11. Ultimate
- **Mục tiêu:** Hình chữ nhật 8×4 (32 ô)
- **Mảnh ghép:** 2 I-block + 2 O-block + 2 T-block + 1 L-block + 1 J-block
- **Lưới:** 11×7
- **Trọng tâm học tập:** Tất cả 7 loại tetromino làm việc cùng nhau

#### 12. Hình chữ nhật Pentomino
- **Mục tiêu:** Hình chữ nhật 5×4 (20 ô)
- **Mảnh ghép:** 4 pentomino (I-Pento, L-Pento, V-Pento, P-Pento)
- **Lưới:** 8×6
- **Trọng tâm học tập:** Giới thiệu pentomino

#### 13. Lưới rộng
- **Mục tiêu:** Hình chữ nhật 8×3 (24 ô)
- **Mảnh ghép:** 6 I-block (6 màu khác nhau)
- **Lưới:** 9×5
- **Trọng tâm học tập:** Đóng gói ngang mỏng

### Cấp độ 3D Dễ (2 cấp độ)

#### 14. Chồng khối lập phương
- **Mục tiêu:** Khối lập phương 2×2×2 (8 ô)
- **Mảnh ghép:** 2 khối Cube2x2 (cam, xanh lá)
- **Lưới:** 4×4×3
- **Trọng tâm học tập:** Câu đố 3D đầu tiên với chồng dọc đơn giản

#### 15. Tháp nhỏ
- **Mục tiêu:** Tháp 2×2×3 (12 ô)
- **Mảnh ghép:** 3 khối Cube2x2 (hồng, xanh dương, vàng)
- **Lưới:** 4×5×4
- **Trọng tâm học tập:** Xây dựng cấu trúc dọc

### Cấp độ 3D Trung bình (3 cấp độ)

#### 16. Tháp khối lập phương
- **Mục tiêu:** Tháp 2×2×4 (16 ô)
- **Mảnh ghép:** 4 khối Cube2x2 (cam, xanh lá, xanh dương, tím)
- **Lưới:** 4×4×5
- **Trọng tâm học tập:** Cấu trúc dọc cao hơn

#### 17. Khối lập phương kép
- **Mục tiêu:** Hai khối lập phương 2×2×2 cạnh nhau (16 ô)
- **Mảnh ghép:** 2 khối Cube2x2x2 (hồng, xanh dương)
- **Lưới:** 5×4×3
- **Trọng tâm học tập:** Sắp xếp 3D theo chiều ngang

#### 18. Nền phẳng
- **Mục tiêu:** Nền 4×4×1 (16 ô)
- **Mảnh ghép:** 4 khối Cube2x2 (cam, xanh lá, xanh dương, hồng)
- **Lưới:** 6×6×3
- **Trọng tâm học tập:** Tư duy 2D trong không gian 3D

### Cấp độ 3D Khó (3 cấp độ)

#### 19. Tháp cao
- **Mục tiêu:** Tháp 2×2×6 (24 ô)
- **Mảnh ghép:** 6 khối Cube2x2 (cam, xanh lá, xanh dương, tím, hồng, nâu)
- **Lưới:** 4×4×7
- **Trọng tâm học tập:** Chồng dọc tối đa

#### 20. Chồng ba
- **Mục tiêu:** Ba khối lập phương 2×2×2 theo hình chữ L (24 ô)
- **Mảnh ghép:** 3 khối Cube2x2x2 (hồng, xanh dương, cam)
- **Lưới:** 5×5×4
- **Trọng tâm học tập:** Sắp xếp không gian 3D phức tạp

#### 21. Nền rộng
- **Mục tiêu:** Nền 6×4×1 (24 ô)
- **Mảnh ghép:** 6 khối Cube2x2 (cam, xanh lá, xanh dương, tím, hồng, nâu)
- **Lưới:** 7×6×3
- **Trọng tâm học tập:** Đóng gói 2D quy mô lớn trong không gian 3D

---

## Thuật toán giải (Giải thích dành cho giáo viên)

ShapeArchitect bao gồm một **bộ giải quay lui** có thể tìm giải pháp cho các câu đố theo chương trình. Điều này giúp xác thực rằng các cấp độ có thể giải được trước khi trình bày chúng cho học sinh.

### Tổng quan thuật toán: Phép loại suy Tetris

Hãy nghĩ về bộ giải như một người chơi Tetris cực nhanh có thể:

1. **Nhìn thấy toàn bộ lưới** cùng một lúc (không chỉ các mảnh rơi)
2. **Thử mọi vị trí có thể** cho mọi mảnh
3. **Hoàn tác sai lầm ngay lập tức** và thử một cách tiếp cận khác
4. **Dừng lại ngay khi tìm thấy giải pháp** (hoặc chứng minh là không thể)

### Quy trình từng bước

#### Bước 0: Kiểm tra thể tích (Loại bỏ nhanh)
```
Tổng thể tích mảnh = Tổng tất cả ô mảnh
Thể tích mục tiêu = Số ô mục tiêu

NẾU thể tích mảnh ≠ thể tích mục tiêu:
    TRẢ VỀ "Không thể giải" (mảnh sẽ không vừa)
```

Ví dụ:
```
Mảnh: 4 tetromino = 4 × 4 = 16 ô
Mục tiêu: Hình vuông 4×4 = 16 ô
✓ Thể tích khớp, tiếp tục Bước 1
```

#### Bước 1: Tìm ô mục tiêu trống đầu tiên

Nhìn vào hình dạng mục tiêu và tìm ô đầu tiên chưa được lấp đầy.

```
Thứ tự quét lưới: Trái sang phải, trên xuống dưới, trước ra sau
Mục tiêu trống đầu tiên = (1, 2, 0) trong tọa độ XYZ
```

#### Bước 2: Thử từng mảnh còn lại

Đối với mỗi mảnh chưa được đặt:

```python
ĐỐI VỚI mỗi unused_piece TRONG remaining_pieces:
    # Bước 3: Thử tất cả các lần xoay
    ĐỐI VỚI mỗi rotation TRONG [0°, 90°, 180°, 270°]:  # 2D
        # Hoặc 24 lần xoay cho cấp độ 3D

        # Bước 4: Thử tất cả các vị trí bao phủ mục tiêu trống
        ĐỐI VỚI mỗi position KHI piece_covers_empty_target:

            # Bước 5: Kiểm tra xem việc đặt có hợp lệ không
            NẾU can_place(piece, position, rotation):
                # Đặt tạm thời
                place_piece(piece, position, rotation)

                # Đệ quy: Thử lấp đầy phần còn lại
                result = solve_recursively(grid, remaining_pieces)

                NẾU result == "Thành công":
                    TRẢ VỀ "Thành công"

                # Quay lui: Điều này không hiệu quả, hoàn tác và thử tiếp
                remove_piece(piece, position)

    # Nếu đến đây, không có vị trí nào hiệu quả cho mảnh này
    # Thử mảnh tiếp theo
```

#### Bước 6: Quay lui nếu bị kẹt

Nếu không có mảnh nào có thể lấp đầy ô mục tiêu trống hiện tại, **quay lui**:
- Hoàn tác vị trí cuối cùng
- Thử một vị trí/xoay khác cho mảnh trước đó
- Tiếp tục cho đến khi tìm thấy giải pháp hoặc cạn kiệt tất cả khả năng

#### Bước 7: Bảo vệ thời gian chờ

Để ngăn chặn tìm kiếm vô hạn trên các câu đố phức tạp, bộ giải có **thời gian chờ 5 giây**:
```
NẾU elapsed_time > 5000 mili giây:
    TRẢ VỀ "Hết giờ" (không thể giải trong thời gian hợp lý)
```

### Tối ưu hóa: Xoay độc nhất

Bộ giải thông minh về các lần xoay. Một số mảnh trông giống hệt nhau sau một số lần xoay nhất định:

**O-block (hình vuông 2×2):**
```
Xoay 0° = Xoay 90° = Xoay 180° = Xoay 270°
Tất cả trông giống nhau!
```

Bộ giải phát hiện những **hướng trùng lặp** này và chỉ thử mỗi hướng độc nhất một lần, tăng tốc đáng kể quá trình tìm kiếm.

### Đặc điểm hiệu suất

| Số liệu | Giá trị điển hình | Ghi chú |
|--------|---------------|-------|
| 2D Dễ (4 mảnh) | <10ms | Gần như tức thì |
| 2D Trung bình (6 mảnh) | 10-100ms | Giải pháp nhanh |
| 2D Khó (8 mảnh) | 100ms-1s | Có thể khám phá hàng nghìn trạng thái |
| Cấp độ 3D | 500ms-5s | 24 lần xoay tăng độ phức tạp |

### Sử dụng giáo dục

Giáo viên có thể sử dụng bộ giải để:
1. **Xác thực cấp độ tùy chỉnh** trước khi giao cho học sinh
2. **Kiểm tra xem giải pháp của học sinh có tối ưu không** (so sánh số lượng mảnh)
3. **Trình diễn tư duy thuật toán** (chiến lược quay lui)
4. **Thảo luận về độ phức tạp tính toán** (tại sao 3D khó hơn 2D)

Bộ giải triển khai một thuật toán **thỏa mãn ràng buộc** cổ điển, cùng loại được sử dụng trong:
- Bộ giải Sudoku
- Máy chơi cờ (khám phá nước đi)
- Phần mềm lập lịch
- Lập kế hoạch tuyến đường

---

## Mẹo giáo dục cho giáo viên

### Tích hợp lớp học

#### Bài học: Bảo toàn diện tích và thể tích (Lớp 3-5)

**Mục tiêu:** Học sinh sẽ hiểu rằng các hình có thể được phân tách và sắp xếp lại mà không thay đổi tổng diện tích.

**Vật liệu:**
- Trò chơi ShapeArchitect (chiếu hoặc thiết bị cá nhân)
- Khối tetromino vật lý (tùy chọn)

**Trình tự hoạt động:**

1. **Khởi động (5 phút):** Chơi cấp độ "Hình vuông 4×4" như một lớp
   - Hỏi: "Mỗi O-block bao phủ bao nhiêu ô?" (4)
   - Hỏi: "Chúng ta cần bao nhiêu O-block?" (4)
   - Tính: 4 khối × 4 ô = 16 ô tổng cộng

2. **Thực hành có hướng dẫn (10 phút):** Học sinh thử "Dải dài" riêng lẻ
   - Quan sát: Học sinh có xoay I-block không?
   - Thảo luận: "Tại sao các mảnh ngang lại trở thành dọc?"

3. **Thách thức (15 phút):** Cấp độ "Dấu cộng"
   - Câu hỏi: "Em có thể tính diện tích mục tiêu mà không đếm từng ô không?"
   - Mở rộng: "Vẽ một cách sắp xếp khác của 5 O-block trên giấy kẻ ô"

4. **Suy ngẫm (5 phút):**
   - "Em đã sử dụng chiến lược gì khi bị kẹt?"
   - "Điều này giống như giải câu đố ghép hình như thế nào? Khác như thế nào?"

#### Câu hỏi thảo luận

**Về tư duy không gian:**
- "Trước khi xoay, em có thể dự đoán mảnh ghép sẽ trông như thế nào không?"
- "Em có thể xoay mảnh này bao nhiêu cách khác nhau để làm cho nó khớp?"
- "Điều gì sẽ xảy ra nếu chúng ta lật mảnh thay vì xoay nó?"

**Về bảo toàn thể tích:**
- "Nếu tôi có 6 O-block, tôi có thể lấp đầy bao nhiêu ô?" (24)
- "4 mảnh có thể lấp đầy một mục tiêu 20 ô không? Tại sao không?" (Không, 4×4=16≠20)
- "Nếu tôi chia một O-block thành 4 khối lập phương đơn lẻ thì sao? Nó vẫn hoạt động không?" (Có, thể tích được bảo toàn)

**Về giải quyết vấn đề:**
- "Khi bị kẹt, em đã thử gì khác?"
- "Em bắt đầu từ góc hay giữa? Tại sao?"
- "Câu đố này giống như sắp xếp sách trên kệ như thế nào?"

### Quan niệm sai lầm thường gặp

#### Quan niệm sai 1: "Xoay thay đổi kích thước của mảnh"

**Bằng chứng:** Học sinh cố gắng lắp một mảnh 4 ô vào khoảng trống 3 ô sau khi xoay

**Sửa chữa:** Sử dụng đồ dùng vật lý để cho thấy xoay chỉ thay đổi **hướng**, không phải **diện tích**
- Đếm ô trước khi xoay: 4
- Xoay mảnh
- Đếm ô sau khi xoay: Vẫn 4

#### Quan niệm sai 2: "Tất cả các mảnh phải bắt đầu ở cạnh lưới"

**Bằng chứng:** Học sinh chỉ đặt mảnh dọc theo viền ngoài

**Sửa chữa:** Cho ví dụ khi cần đặt ở giữa
- Trình diễn cấp độ "Dấu cộng" nơi trung tâm phải được lấp đầy trước
- Khuyến khích thử nghiệm với vị trí bên trong

#### Quan niệm sai 3: "Xoay 3D chỉ là quay tròn"

**Bằng chứng:** Học sinh chỉ sử dụng xoay trục Z trong cấp độ 3D

**Sửa chữa:** Trình diễn trực quan ba trục xoay
- Trục X (pitch): "Nghiêng ly về phía trước"
- Trục Y (yaw): "Quay đầu trái/phải"
- Trục Z (roll): "Quay đồng xu trên bàn"

#### Quan niệm sai 4: "Chỉ có một giải pháp đúng"

**Bằng chứng:** Học sinh nghĩ giải pháp của họ "sai" nếu khác với bạn

**Sửa chữa:** Tôn vinh nhiều giải pháp hợp lệ
- Hiển thị hai giải pháp khác nhau cạnh nhau
- Thảo luận: "Cả hai đều lấp đầy tất cả các ô mục tiêu bằng tất cả các mảnh!"
- Mở rộng: "Em có thể tìm giải pháp thứ ba không?"

### Chiến lược phân biệt

#### Cho người học gặp khó khăn:

1. **Bắt đầu chỉ với cấp độ Dễ** (mảnh đồng nhất như tất cả O-block)
2. **Sử dụng đồ dùng vật lý** cùng với trò chơi kỹ thuật số
3. **Cung cấp câu đố đã hoàn thành một phần** (giáo viên đặt 2-3 mảnh đầu tiên)
4. **Cho phép thời gian không giới hạn** với chế độ luyện tập (không theo dõi thống kê)
5. **Ghép đôi với người hướng dẫn đồng trang lứa** để giải quyết cộng tác

#### Cho người học nâng cao:

1. **Thách thức: Giải bằng số lần xoay tối thiểu** (đếm số lần nhấp nút xoay)
2. **Tạo cấp độ tùy chỉnh** trên giấy kẻ ô để bạn bè giải
3. **Khám phá pentomino** (12 mảnh độc nhất với 5 ô mỗi mảnh)
4. **Nghiên cứu: Nghiên cứu toán học về polyomino** (mở rộng học thuật)
5. **Thách thức tốc độ:** Hoàn thành tất cả cấp độ Dễ dưới 10 phút tổng cộng

#### Cho người học tiếng Anh (ELL):

1. **Trình diễn trực quan** (trò chơi ít ngôn ngữ theo thiết kế)
2. **Hỗ trợ từ vựng:** "xoay," "ngang," "dọc," "chồng lấp"
3. **Chế độ song ngữ:** Chuyển sang tiếng Việt nếu có
4. **Gợi ý cử chỉ:** Sử dụng chuyển động tay để hiển thị hướng xoay
5. **Ghép đôi với bạn thành thạo** để làm rõ hướng dẫn

### Ý tưởng đánh giá

#### Đánh giá hình thành (Trong khi chơi):

- **Danh sách kiểm tra quan sát:**
  - [ ] Học sinh xoay mảnh một cách phù hợp
  - [ ] Học sinh kiểm tra phủ mục tiêu trước khi đặt
  - [ ] Học sinh sử dụng hoàn tác khi bị kẹt
  - [ ] Học sinh nói rõ chiến lược ("Em sẽ đặt I-block ở đây vì...")

- **Phiếu ra cửa:**
  - "Vẽ hình chữ nhật 3×4. Em cần bao nhiêu O-block để lấp đầy nó?" (3)
  - "Nếu một mảnh có 5 ô, nó được gọi là gì?" (Pentomino)

#### Đánh giá tổng kết (Cuối đơn vị):

- **Dự án tạo câu đố:**
  - Học sinh thiết kế một cấp độ 16 ô có thể giải bằng 4 tetromino
  - Kiểm tra đồng trang lứa: Bạn cùng lớp cố gắng giải câu đố của nhau
  - Tiêu chí: Khả năng giải (4 điểm), Sáng tạo (3 điểm), Gọn gàng (3 điểm)

- **Suy ngẫm giải quyết vấn đề:**
  - "Mô tả chiến lược của em để giải một câu đố khó trong 3-5 câu"
  - Tiêu chí: Đề cập đến xoay, thử và sai, và bảo toàn thể tích

### Kết nối liên môn

#### Nghệ thuật:
- **Tessellation:** Khám phá các mẫu lặp lại của M.C. Escher
- **Lý thuyết màu sắc:** Thảo luận tại sao mỗi mảnh có một màu riêng biệt (phân biệt trực quan)

#### Lịch sử:
- **Câu đố cổ đại:** Nghiên cứu tangram (câu đố Trung Quốc từ 1000+ năm trước)
- **Lịch sử Tetris:** Tìm hiểu về phát minh năm 1984 của Alexey Pajitnov

#### Khoa học máy tính:
- **Thuật toán:** Giới thiệu quay lui như một khái niệm khoa học máy tính
- **Tư duy tính toán:** Thảo luận về cách bộ giải "suy nghĩ" qua các khả năng

#### Ngữ văn:
- **Viết thủ tục:** Viết hướng dẫn từng bước để giải một cấp độ
- **Từ vựng:** Thuật ngữ hình học (vuông góc, liền kề, đối xứng)

---

## Mở rộng và thách thức

### Ý tưởng chế độ thách thức

1. **Speedrun:** Hoàn thành tất cả cấp độ Dễ trong vòng dưới 5 phút
2. **Nước đi tối thiểu:** Giải câu đố với số lần đặt mảnh ít nhất (không hoàn tác)
3. **Không xoay:** Giải cấp độ "Hình chữ nhật" chỉ sử dụng xoay 0°
4. **Bậc thầy 3D:** Hoàn thành tất cả cấp độ 3D mà không sử dụng hoàn tác
5. **Bịt mắt (Có hướng dẫn):** Bạn chỉ đạo vị trí bằng lời nói trong khi người giải nhắm mắt

### Kết nối thực tế

**Vấn đề đóng gói:**
- Xếp hộp vào xe tải (tối đa hóa không gian)
- Sắp xếp đồ nội thất trong phòng
- Tổ chức đồ tạp hóa trong tủ lạnh

**Kiến trúc:**
- Thiết kế mặt bằng với các phòng mô-đun
- Tạo khảm đá lát gạch
- Lập kế hoạch khối xây dựng trong trò chơi điện tử (Minecraft)

**Sản xuất:**
- Cắt mảnh vải từ vải (giảm thiểu lãng phí)
- Dập kim loại tấm (cắt khuôn công nghiệp)
- Cấu trúc hỗ trợ in 3D

### Khám phá thêm

**Sách:**
- "The Tangram Magician" của Lisa Campbell Ernst (K-2)
- "Block City" của Robert Louis Stevenson (Thơ, K-3)
- "Polyominoes: Puzzles, Patterns, Problems, and Packings" của Solomon W. Golomb (Nâng cao)

**Tài nguyên trực tuyến:**
- Hội đồng giáo viên toán học quốc gia (NCTM) các hoạt động hình học
- KenKen và Sudoku (câu đố logic liên quan)
- Scratch programming: Tạo trò chơi tetromino của riêng bạn

**Đồ dùng:**
- Bộ tetromino vật lý (có sẵn từ các nhà cung cấp giáo dục)
- Khối mẫu (tư duy không gian tương tự)
- Khối Soma (câu đố 3D với 7 mảnh polycube)

---

## Tính năng khả năng tiếp cận

ShapeArchitect được thiết kế với **nguyên tắc thiết kế toàn diện** để đảm bảo tất cả học sinh có thể tham gia:

### Khả năng tiếp cận trực quan

- **Màu sắc tương phản cao:** Mỗi mảnh có một màu riêng biệt, rực rỡ
- **Mẫu bản vẽ:** Các ô mục tiêu có kết cấu nhìn thấy được ngoài màu sắc
- **Xem trước bóng ma:** Lớp phủ bán trong suốt hiển thị chính xác vị trí mảnh sẽ đặt
- **Khoảng cách đủ:** Các ô lưới đủ lớn để nhìn rõ (tối thiểu 40px)

### Khả năng tiếp cận vận động

- **Điều hướng bàn phím:** Trò chơi đầy đủ có thể chơi không cần chuột
  - Tab để điều hướng, Enter để chọn, Phím mũi tên để di chuyển
- **Lắp vào vị trí gần nhất:** Các mảnh tự động căn chỉnh vào vị trí hợp lệ (giảm yêu cầu vận động tinh)
- **Mục tiêu nhấp lớn:** Nút tối thiểu 44×44px (tuân thủ WCAG AAA)
- **Không áp lực thời gian:** Câu đố có thể giải ở bất kỳ tốc độ nào (chế độ luyện tập không có đồng hồ)

### Khả năng tiếp cận nhận thức

- **Mục tiêu rõ ràng:** Hình dạng mục tiêu trực quan hiển thị chính xác những gì cần lấp đầy
- **Phản hồi tức thì:** Vị trí không hợp lệ chuyển sang đỏ ngay lập tức
- **Nút hoàn tác:** Sai lầm dễ dàng đảo ngược (không có hình phạt)
- **Độ khó tăng dần:** Bắt đầu với câu đố 4 mảnh trước khi tiến đến 8 mảnh

### Hỗ trợ giảm chuyển động

Tất cả hoạt ảnh tôn trọng `prefers-reduced-motion: reduce`:
- Rung lắc lắp vào bị vô hiệu hóa
- Hạt vụ nổ bụi bị vô hiệu hóa
- Lễ kỷ niệm chiến thắng confetti bị vô hiệu hóa
- Chỉ phản hồi trực quan thiết yếu còn lại

### Hỗ trợ trình đọc màn hình

- Nhãn ARIA trên tất cả các yếu tố tương tác
- Thông báo vùng trực tiếp cho các thay đổi trạng thái trò chơi ("Mảnh đã đặt", "Câu đố đã giải")
- Cấu trúc HTML ngữ nghĩa cho điều hướng logic

---

## Ghi chú triển khai kỹ thuật

Dành cho nhà phát triển và nhà giáo dục nâng cao quan tâm đến cơ chế cơ bản:

### Hệ thống lưới

```typescript
type CellState = 0 | 1 | 2;
// 0 = Không gian trống
// 1 = Ô mục tiêu (bản vẽ)
// 2 = Ô đã lấp đầy (mảnh đã đặt)
```

Lưới được biểu diễn dưới dạng mảng 3D: `grid[x][y][z]`

### Toán học xoay

Mỗi lần xoay được xác định bởi góc Euler với bước nhảy 90°:

```typescript
interface Rotation3D {
    x: 0 | 90 | 180 | 270;  // Pitch
    y: 0 | 90 | 180 | 270;  // Yaw
    z: 0 | 90 | 180 | 270;  // Roll
}
```

Các lần xoay được áp dụng theo thứ tự: X → Y → Z

Ví dụ: Xoay điểm (1, 0, 0) 90° quanh trục Z:
```typescript
(x, y, z) → (-y, x, z)
(1, 0, 0) → (0, 1, 0)
```

### Xác thực đặt

Một mảnh có thể đặt nếu:
1. Tất cả các ô nằm trong giới hạn lưới
2. Không có ô chồng lấp với các ô đã lấp đầy (trạng thái 2)
3. Ít nhất một ô nằm trên ô mục tiêu (trạng thái 1)

### Hiệu suất bộ giải

Phân tích độ phức tạp:
- **Kích thước không gian trạng thái:** O(P! × R^P × G^P)
  - P = số lượng mảnh
  - R = số lần xoay mỗi mảnh (4 hoặc 24)
  - G = kích thước lưới
- **Chiến lược cắt tỉa:**
  - Kiểm tra thể tích sớm (loại bỏ O(1))
  - Tìm kiếm mục tiêu trước (giảm hệ số phân nhánh)
  - Phát hiện xoay độc nhất (loại bỏ trạng thái đối xứng)

Độ sâu tìm kiếm điển hình:
- Dễ (4 mảnh): ~10-100 trạng thái
- Trung bình (6 mảnh): ~1,000-10,000 trạng thái
- Khó (8 mảnh): ~100,000+ trạng thái (có thể hết giờ)

---

## Kết luận

ShapeArchitect thu hẹp khoảng cách giữa **chơi và học** bằng cách biến đổi hình học không gian thành trải nghiệm xưởng hấp dẫn. Thông qua các câu đố thách thức tăng dần, học sinh phát triển:

- **Tư duy không gian** chuyển giao sang các lĩnh vực STEM
- **Kiên trì giải quyết vấn đề** thông qua thử và sai
- **Tự tin toán học** bằng cách làm chủ các phép biến hình
- **Tư duy tính toán** thông qua chiến lược thỏa mãn ràng buộc

Cho dù được sử dụng như một hoạt động trung tâm toán học, phần thưởng cho công việc hoàn thành, hay một bài học đầy đủ về diện tích và thể tích, ShapeArchitect cung cấp **luyện tập có ý nghĩa** với các khái niệm hình học cốt lõi. Cơ chế tha thứ của trò chơi (hoàn tác, lắp vào gần nhất, chế độ luyện tập) đảm bảo rằng **tất cả học sinh có thể trải nghiệm thành công** trong khi được thách thức một cách phù hợp.

Bằng cách làm cho hình học **cụ thể, trực quan và vui vẻ**, ShapeArchitect giúp học sinh xây dựng trực giác không gian làm nền tảng cho mọi thứ từ đọc bản đồ đến thiết kế tòa nhà đến hiểu cấu trúc phân tử.

---

## Thẻ tham khảo nhanh

### Dành cho học sinh

**Mục tiêu:** Lấp đầy bản vẽ màu xanh bằng các khối màu

**Điều khiển:**
- **Kéo** mảnh lên lưới
- **Nhấp X/Y/Z** nút để xoay
- **Nhấp Hoàn tác** nếu em mắc lỗi
- **Thắng** khi tất cả các ô xanh được lấp đầy!

**Mẹo:**
- Bắt đầu với các mảnh góc
- Xoay mảnh trước khi đặt
- Nếu nó chuyển sang đỏ, thử một vị trí khác
- Đếm ô: Các mảnh của em có khớp với mục tiêu không?

### Dành cho giáo viên

**Cấp lớp:** 1-8 (6-14 tuổi)

**Tiêu chuẩn toán học:** Hình học, Diện tích, Thể tích, Tư duy không gian

**Thời lượng buổi học:** 5-20 phút

**Khả năng tiếp cận:** Điều hướng bàn phím, tương phản cao, không áp lực thời gian

**Phân biệt:**
- Dễ: Chỉ O-block (mảnh đồng nhất)
- Trung bình: Tetromino hỗn hợp
- Khó: Pentomino và polycube 3D

**Đánh giá:** Quan sát sử dụng xoay, lập kế hoạch chiến lược và hiểu biết về thể tích

---

**Phiên bản tài liệu:** 1.0
**Cập nhật lần cuối:** Tháng 1 năm 2026
**Phiên bản trò chơi:** ShapeArchitect 2.0 (với cấp độ 3D và lắp vào gần nhất)
