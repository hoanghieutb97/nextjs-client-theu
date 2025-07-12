import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Kiểm tra nếu đã đăng nhập thì chuyển hướng
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const loginTime = localStorage.getItem('loginTime');
    
    if (token && loginTime) {
      const now = new Date().getTime();
      const loginTimestamp = parseInt(loginTime);
      const hoursDiff = (now - loginTimestamp) / (1000 * 60 * 60);
      
      // Nếu chưa quá 24h thì chuyển hướng
      if (hoursDiff < 24) {
        router.push('/test-users');
      } else {
        // Xóa token cũ nếu quá 24h
        localStorage.removeItem('authToken');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('userInfo');
      }
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        // Lưu token và thời gian đăng nhập
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('loginTime', new Date().getTime().toString());
        
        // Lưu thông tin user
        if (data.user) {
          localStorage.setItem('userInfo', JSON.stringify(data.user));
        }
        
        // Chuyển hướng đến trang chính
        router.push('/test-users');
      } else {
        setError(data.error || 'Mật khẩu không đúng');
      }
    } catch (error) {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    }

    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Đăng nhập</title>
        <meta name="description" content="Trang đăng nhập hệ thống" />
      </Head>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ margin: 0, color: '#333', fontSize: '28px' }}>
              Đăng Nhập Hệ Thống
            </h1>
            <p style={{ margin: '10px 0 0 0', color: '#666' }}>
              Vui lòng nhập mật khẩu để tiếp tục
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                Mật Khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: error ? '1px solid #dc3545' : '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
              {error && (
                <div style={{
                  color: '#dc3545',
                  fontSize: '14px',
                  marginTop: '5px'
                }}>
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: loading ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s'
              }}
            >
              {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
            </button>
          </form>

          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#e7f3ff',
            borderRadius: '5px',
            border: '1px solid #b3d9ff'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#0056b3' }}>
              💡 Hướng dẫn
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              color: '#0056b3',
              fontSize: '14px'
            }}>
              <li>Nhập mật khẩu chính xác để đăng nhập</li>
              <li>Phiên đăng nhập có hiệu lực trong 24 giờ</li>
              <li>Sau 24 giờ sẽ tự động đăng xuất</li>
              <li>Chỉ user có vai trò "Thiết Kế" mới vào được trang thiết kế</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
} 