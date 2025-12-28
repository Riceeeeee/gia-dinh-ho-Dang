# Hướng dẫn cấu hình Firestore

Để trang web hoạt động đúng, bạn cần cấu hình Firestore Security Rules trong Firebase Console.

## Bước 1: Truy cập Firebase Console

1. Đăng nhập vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project: **gia-dinh-ho-dang**
3. Vào **Firestore Database** ở menu bên trái

## Bước 2: Cấu hình Security Rules

Vào tab **Rules** và thay thế nội dung bằng:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cho phép mọi người đọc và ghi vào collection memories
    // LƯU Ý: Đây là cấu hình cho phép public access
    // Nếu muốn bảo mật hơn, bạn có thể thêm authentication
    match /memories/{memoryId} {
      allow read: if true;
      allow create: if true;
      allow update: if true;
      allow delete: if true;
    }
  }
}
```

Sau đó nhấn **Publish** để lưu rules.

## Bước 3: Tạo Index (nếu cần)

Nếu bạn gặp lỗi về index khi query, Firebase sẽ tự động hiển thị link để tạo index. Bạn chỉ cần:
1. Click vào link trong console
2. Firebase sẽ tự động tạo index cho bạn

Hoặc bạn có thể tạo index thủ công:
- Collection: `memories`
- Fields: `createdAt` (Descending)

## Bước 4: Kiểm tra

Sau khi cấu hình xong, refresh lại trang web và thử:
- Đăng một ảnh mới
- Xem ảnh đã đăng
- Thích và bình luận

## Lưu ý bảo mật

⚠️ **Cảnh báo**: Rules hiện tại cho phép mọi người đọc và ghi dữ liệu. Nếu bạn muốn bảo mật hơn:

1. **Thêm Authentication**: Yêu cầu người dùng đăng nhập
2. **Giới hạn quyền**: Chỉ cho phép một số người được đăng/xóa
3. **Rate limiting**: Giới hạn số lượng request

Ví dụ rules với authentication:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /memories/{memoryId} {
      allow read: if true; // Mọi người có thể đọc
      allow create: if request.auth != null; // Chỉ người đã đăng nhập mới đăng
      allow update: if request.auth != null; // Chỉ người đã đăng nhập mới sửa
      allow delete: if request.auth != null; // Chỉ người đã đăng nhập mới xóa
    }
  }
}
```

## Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
- Firebase project ID đúng trong `src/firebase.js`
- Firestore đã được bật trong Firebase Console
- Security Rules đã được publish
- Browser console có lỗi gì không

