import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated, getSessionTimeLeft, formatTimeLeft, logout } from '../utils/auth';

const AuthGuard = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Kiểm tra authentication
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Lấy thông tin user từ localStorage
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setCurrentUser(JSON.parse(userInfo));
    }

    setIsLoading(false);

    // Cập nhật thời gian còn lại mỗi phút
    const updateTimeLeft = () => {
      const time = getSessionTimeLeft();
      setTimeLeft(time);
      
      // Nếu hết thời gian thì logout
      if (time <= 0) {
        logout();
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000); // Cập nhật mỗi phút

    return () => clearInterval(interval);
  }, [router]);

  // Hiển thị loading khi đang kiểm tra
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  return (
    <div>
      {/* Header với thông tin session */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '10px 20px',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Phiên đăng nhập còn lại: <strong>{formatTimeLeft(timeLeft)}</strong>
        </div>
        <button
          onClick={logout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Đăng xuất
        </button>
      </div>
      
      {/* Nội dung chính */}
      {children}
    </div>
  );
};

export default AuthGuard; 