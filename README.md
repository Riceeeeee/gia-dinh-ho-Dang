# Gia đình họ Đặng - Ứng dụng lưu trữ kỷ niệm gia đình

Ứng dụng web cho phép mọi người trong gia đình đăng tải, xem và chia sẻ những khoảnh khắc đẹp cùng nhau.

## ✨ Tính năng

- 📸 **Đăng tải ảnh**: Bất cứ ai cũng có thể đăng ảnh kỷ niệm
- 👀 **Xem ảnh**: Tất cả mọi người có thể xem ảnh đã đăng
- ❤️ **Thích ảnh**: Thể hiện tình cảm với những khoảnh khắc đẹp
- 💬 **Bình luận**: Chia sẻ suy nghĩ và kỷ niệm
- 📱 **Responsive**: Hoạt động tốt trên mọi thiết bị (mobile, tablet, desktop)
- 🔄 **Real-time**: Cập nhật ngay lập tức khi có ảnh mới
- 🏷️ **Phân loại**: Gắn nhãn theo từng gia đình nhỏ

## 🚀 Cài đặt và chạy

### Yêu cầu
- Node.js 18+ 
- npm hoặc yarn

### Cài đặt

```bash
# Cài đặt dependencies
npm install
```

### Chạy development server

```bash
npm run dev
```

Mở trình duyệt tại `http://localhost:5173`

### Build cho production

```bash
npm run build
```

### Deploy lên GitHub Pages

```bash
npm run deploy
```

## 🔧 Cấu hình Firestore

**QUAN TRỌNG**: Bạn cần cấu hình Firestore Security Rules trước khi sử dụng.

Xem hướng dẫn chi tiết trong file [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md)

Tóm tắt:
1. Vào Firebase Console → Firestore Database → Rules
2. Cấu hình rules để cho phép đọc/ghi public (hoặc với authentication)
3. Publish rules

## 📱 Responsive Design

Ứng dụng được thiết kế để hoạt động tốt trên:
- 📱 Mobile (iPhone, Android)
- 📱 Tablet (iPad, Android tablet)
- 💻 Desktop (Windows, Mac, Linux)

## 🛠️ Công nghệ sử dụng

- **React 19** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Firebase Firestore** - Database real-time
- **Lucide React** - Icons

## 📝 Cấu trúc dự án

```
gia-dinh-ho-dang/
├── src/
│   ├── App.jsx              # Component chính
│   ├── firebase.js          # Cấu hình Firebase
│   ├── firestoreService.js  # Service làm việc với Firestore
│   └── main.jsx             # Entry point
├── public/                  # Static files
├── index.html              # HTML template
└── package.json            # Dependencies
```

## 🎨 Tính năng UI/UX

- Gradient background đẹp mắt
- Hover effects mượt mà
- Loading states rõ ràng
- Modal responsive
- Touch-friendly cho mobile
- Lazy loading ảnh

## 🔒 Bảo mật

Hiện tại ứng dụng cho phép public access. Nếu muốn bảo mật hơn:
- Thêm Firebase Authentication
- Cập nhật Firestore Rules
- Xem chi tiết trong FIRESTORE_SETUP.md

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra Firestore đã được cấu hình đúng chưa
2. Xem console browser có lỗi gì không
3. Đảm bảo Firebase project ID đúng trong `src/firebase.js`

## 📄 License

Dự án này dành riêng cho gia đình họ Đặng.

---

Made with ❤️ for Gia đình họ Đặng
