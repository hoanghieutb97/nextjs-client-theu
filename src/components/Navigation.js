import { useRouter } from 'next/router';
import { logout } from '../utils/auth';

const Navigation = ({ currentUser }) => {
  const router = useRouter();

  const navItems = [
    { label: 'Quản lý đơn hàng', path: '/manager', requiredRole: 'admin' },
    { label: 'Quản lý Users', path: '/test-users', requiredRole: 'admin' },
    { label: 'Thiết kế', path: '/design', requiredRole: 'Thiết Kế' },
    { label: 'Xem mật khẩu', path: '/view-passwords', requiredRole: 'admin' }
   
  ];

  const canAccess = (item) => {
    if (currentUser && currentUser.vaiTro === 'admin') return true;
    if (!item.requiredRole) return true;
    return currentUser && currentUser.vaiTro === item.requiredRole;
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <nav style={{
      backgroundColor: '#2c3e50',
      padding: '15px 20px',
      color: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Logo/Brand */}
        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
          Hệ Thống Quản Lý
        </div>

        {/* Navigation Links */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {navItems.map((item) => {
            if (!canAccess(item)) return null;

            const isActive = router.pathname === item.path;

            return (
              <a
                key={item.path}
                href={item.path}
                style={{
                  color: isActive ? '#3498db' : 'white',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  backgroundColor: isActive ? 'rgba(52, 152, 219, 0.1)' : 'transparent',
                  transition: 'all 0.3s ease',
                  fontWeight: isActive ? 'bold' : 'normal'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {item.label}
              </a>
            );
          })}
        </div>

        {/* User Info & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {currentUser && (
            <div style={{ fontSize: '14px' }}>
              <div style={{ fontWeight: 'bold' }}>{currentUser.hoTen}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                {currentUser.vaiTro} - {currentUser.xuong}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#c0392b'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#e74c3c'}
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 