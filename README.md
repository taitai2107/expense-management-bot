
# 📌 BOT quản lý chi tiêu 📊

## 🔧 Cài đặt dự án

### 1️⃣ Cài đặt các gói cần thiết
Chạy lệnh sau để cài đặt các package cần thiết:

```
npm install
2️⃣ Thiết lập cơ sở dữ liệu
Điền thông tin vào file .env (dựa trên cấu trúc có sẵn).
Mở MySQL và chạy lệnh:
*mysql -u root -p
Sao chép nội dung trong file SQL:
*/project/config/createDbCommand.txt
Dán và chạy lệnh SQL trong MySQL để tạo database.

🚀 Chạy ứng dụng
Chạy lệnh sau để khởi động server:
node index.js

📦 Triển khai (Deploy)
1️⃣ Build Docker Image
docker build -t name:latest .
2️⃣ Chạy Server bằng Docker
docker run -d name
*Hoặc có thể pull docker image tại đây
docker pull taitai2107/expenses
và tạo file .env(lưu ý file env không có khoảng trắng và không dùng "" ở value)
chạy lệnh [docker run --env-file .env -d expenses:latest]


Hoặc có thể sử dụng bot tại
https://t.me/Qlct_Tai_bot

📌 Liên hệ & Hỗ trợ
 Email: tainguyencongkhanh@gmail.com
 Zalo: 0832597839
 
