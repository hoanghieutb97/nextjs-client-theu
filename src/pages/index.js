import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated } from '../utils/auth';
import Navigation from '../components/Navigation';


export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const authenticated = isAuthenticated();
    setIsLoggedIn(authenticated);

    if (authenticated) {
      // Lấy thông tin user từ localStorage
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const user = JSON.parse(userInfo);
        setCurrentUser(user);

        // Nếu user có vai trò "Thiết Kế", tự động chuyển sang trang design
        if (user.vaiTro === 'Thiết Kế') {
          router.push('/design');
        }
      }
    }
  }, [router]);

  const handleLoginRedirect = () => {
    router.push('/login');
  };

  const handleUsersRedirect = () => {
    router.push('/test-users');
  };
  if (currentUser !== "admin") {
    return (
      <div>
        {isLoggedIn && <Navigation currentUser={currentUser} />}
        <div>Bạn không có quyền truy cập trang này</div>

      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Hệ Thống Quản Lý</title>
        <meta name="description" content="Hệ thống quản lý users và thiết kế" />
      </Head>

      {/* Navigation */}


      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          {/* Header */}
          <div style={{
            marginBottom: '40px',
            padding: '40px 20px',
            backgroundColor: 'white',
            borderRadius: '15px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h1 style={{
              fontSize: '2.5rem',
              color: '#2c3e50',
              marginBottom: '10px'
            }}>
              🏭 Hệ Thống Quản Lý
            </h1>
            <p style={{
              fontSize: '1.2rem',
              color: '#7f8c8d',
              marginBottom: '20px'
            }}>
              Quản lý users và thiết kế sản phẩm
            </p>

            {!isLoggedIn ? (
              <button
                onClick={handleLoginRedirect}
                style={{
                  padding: '15px 30px',
                  fontSize: '1.1rem',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
              >
                🔐 Đăng Nhập
              </button>
            ) : (
              <button
                onClick={handleUsersRedirect}
                style={{
                  padding: '15px 30px',
                  fontSize: '1.1rem',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#229954'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#27ae60'}
              >
                👥 Quản Lý Users
              </button>
            )}
          </div>

          {/* Features Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px',
            marginBottom: '40px'
          }}>
            {/* User Management */}
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '15px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              textAlign: 'left'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                👥
              </div>
              <h2 style={{
                color: '#2c3e50',
                marginBottom: '15px',
                textAlign: 'center'
              }}>
                Quản Lý Users
              </h2>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                <li style={{ marginBottom: '10px', padding: '8px 0' }}>
                  ✅ Tạo, sửa, xóa users
                </li>
                <li style={{ marginBottom: '10px', padding: '8px 0' }}>
                  ✅ Phân quyền theo vai trò
                </li>
                <li style={{ marginBottom: '10px', padding: '8px 0' }}>
                  ✅ Tạo mật khẩu tự động
                </li>
                <li style={{ marginBottom: '10px', padding: '8px 0' }}>
                  ✅ QR code cho mật khẩu
                </li>
              </ul>
              {isLoggedIn && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <Link href="/test-users" style={{
                    padding: '10px 20px',
                    backgroundColor: '#3498db',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    display: 'inline-block'
                  }}>
                    Truy cập
                  </Link>
                </div>
              )}
            </div>

            {/* Design Management */}
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '15px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              textAlign: 'left'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                🎨
              </div>
              <h2 style={{
                color: '#2c3e50',
                marginBottom: '15px',
                textAlign: 'center'
              }}>
                Quản Lý Thiết Kế
              </h2>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                <li style={{ marginBottom: '10px', padding: '8px 0' }}>
                  ✅ Chỉ vai trò "Thiết Kế" mới truy cập
                </li>
                <li style={{ marginBottom: '10px', padding: '8px 0' }}>
                  ✅ Thêm thiết kế mới
                </li>
                <li style={{ marginBottom: '10px', padding: '8px 0' }}>
                  ✅ Quản lý trạng thái thiết kế
                </li>
                <li style={{ marginBottom: '10px', padding: '8px 0' }}>
                  ✅ Theo dõi người thiết kế
                </li>
              </ul>
              {isLoggedIn && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <Link href="/design" style={{
                    padding: '10px 20px',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    display: 'inline-block'
                  }}>
                    Truy cập
                  </Link>
                </div>
              )}
            </div>

            {/* Password Management */}
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '15px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              textAlign: 'left'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                🔐
              </div>
              <h2 style={{
                color: '#2c3e50',
                marginBottom: '15px',
                textAlign: 'center'
              }}>
                Quản Lý Mật Khẩu
              </h2>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                <li style={{ marginBottom: '10px', padding: '8px 0' }}>
                  ✅ Xem tất cả mật khẩu
                </li>
                <li style={{ marginBottom: '10px', padding: '8px 0' }}>
                  ✅ QR code cho từng user
                </li>
                <li style={{ marginBottom: '10px', padding: '8px 0' }}>
                  ✅ Thông tin chi tiết user
                </li>
                <li style={{ marginBottom: '10px', padding: '8px 0' }}>
                  ✅ Dễ dàng đăng nhập
                </li>
              </ul>
              {isLoggedIn && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <Link href="/view-passwords" style={{
                    padding: '10px 20px',
                    backgroundColor: '#f39c12',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    display: 'inline-block'
                  }}>
                    Truy cập
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* System Info */}
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            textAlign: 'left'
          }}>
            <h2 style={{
              color: '#2c3e50',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              ℹ️ Thông Tin Hệ Thống
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              <div>
                <h3 style={{ color: '#34495e', marginBottom: '10px' }}>🔐 Bảo Mật</h3>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#7f8c8d' }}>
                  <li>Xác thực bằng mật khẩu</li>
                  <li>Phiên đăng nhập 24 giờ</li>
                  <li>Phân quyền theo vai trò</li>
                </ul>
              </div>
              <div>
                <h3 style={{ color: '#34495e', marginBottom: '10px' }}>💾 Dữ Liệu</h3>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#7f8c8d' }}>
                  <li>Lưu trữ MongoDB</li>
                  <li>CRUD operations</li>
                  <li>Backup tự động</li>
                </ul>
              </div>
              <div>
                <h3 style={{ color: '#34495e', marginBottom: '10px' }}>🎯 Tính Năng</h3>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#7f8c8d' }}>
                  <li>Giao diện responsive</li>
                  <li>QR code generation</li>
                  <li>Real-time updates</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
