const DATABASE = {
    MONGODB_URI: "mongodb+srv://hoanghieutb97:r8piz5uGp6OKcOGa@cluster0.elvs6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
};

const SERVER_THEU = {
    BASE_URL: "http://101.99.6.103:1001"
};

// Định nghĩa quyền truy cập cho từng trang
 const ACCESS_ROLES = {
  '/test-users': ['admin'],
  '/design': ['Thiết Kế', 'admin'],
  '/manager': ['admin'],
  '/view-passwords': ['admin'],
  // Thêm các trang khác nếu cần
};

module.exports = {
    DATABASE,
    SERVER_THEU,
    ACCESS_ROLES
}; 