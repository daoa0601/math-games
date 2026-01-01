[English](README.md) | Tieng Viet

# Math Gymnasium

Mot bo suu tap cac tro choi toan hoc tuong tac danh cho hoc sinh tieu hoc va trung hoc co so, xay dung bang React va TypeScript.

## Cac tro choi

### Magic Graph (Do thi ky dieu)
Dien cac so vao nut cua do thi sao cho moi duong thang co tong bang gia tri muc tieu. Tinh nang:
- Nhieu hinh dang cau do (Tam giac, Vuong, Ngoi sao, Chu H-A-N-O-I, Kim cuong M, Luc giac)
- Bon muc do kho (De, Trung binh, Kho, Cao thu)
- Che do Cao thu: Tong muc tieu an, nguoi choi phai suy luan
- Goi y nang cao: Kiem tra vien, Nguoi khoi dau, Nha dai so
- Thach thuc 60 giay
- Hoan tac/Lam lai voi phim tat (Ctrl+Z/Y)
- Hoa giay chuc mung khi thang

### Sequence Sprinter (Chay dua day so)
Tro choi chien luoc "Chay den N" chong lai AI. Tinh nang:
- **7 loai day so**: Cap so cong, Cap so nhan, Fibonacci, So nguyen to, So chinh phuong, So tam giac, Luy thua 3
- AI Minimax voi ba muc do kho
- Che do Giao vien hien thi nuoc di toi uu
- Hoa giay chuc mung khi nguoi choi thang

### Shape Architect (Kien truc su hinh khoi)
Cau do hinh hoc dang voxel. Dien vao vung "hinh bong" muc tieu bang cach dat cac khoi tu kho. Tinh nang:
- **7 Tetromino** + **12 Pentomino** (bo day du)
- Keo tha hoac nhan de dat
- Xoay khoi (tung 90 do)
- Hoan tac khoi dat cuoi cung
- Hoa giay chuc mung khi hoan thanh

## Bat dau

```bash
npm install
npm run dev
```

Mo http://localhost:5173 de choi.

## Cac lenh

| Lenh | Mo ta |
|------|-------|
| `npm run dev` | Khoi dong may chu phat trien |
| `npm run build` | Build cho production |
| `npm run lint` | Chay ESLint |
| `npm test` | Chay test voi Vitest |
| `npm run test:coverage` | Chay test voi bao cao do phu |

## Cong nghe su dung

- React 19 + TypeScript
- Vite 7
- Vitest (testing)
- react-router-dom (dieu huong)
- @dnd-kit (keo tha)
- react-i18next (Tieng Anh/Tieng Viet)
- canvas-confetti (hieu ung chuc mung)
- howler.js (hieu ung am thanh - san sang)

## Quoc te hoa

Ung dung ho tro Tieng Anh va Tieng Viet. Chuyen doi ngon ngu bang nut trong header.
