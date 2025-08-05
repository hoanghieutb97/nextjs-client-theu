import { useState, useEffect } from 'react';
import Head from 'next/head';
import AuthGuard from '../components/AuthGuard';
import Navigation from '../components/Navigation';
import QRCodeGenerator from '../components/QRCodeGenerator';
import { apiGet } from '../utils/api';

function ViewPasswordsContent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Lấy thông tin user hiện tại
  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setCurrentUser(JSON.parse(userInfo));
    }
  }, []);

  // Lấy danh sách users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/api/users');
      if (data.success) {
        setUsers(data.data);
        setMessage('Lấy danh sách users thành công!');
      } else {
        setMessage('Lỗi: ' + data.error);
      }
    } catch (error) {
      setMessage('Lỗi kết nối: ' + error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <>
      <Head>
        <title>Xem Mật Khẩu Users</title>
        <meta name="description" content="Xem mật khẩu của tất cả users" />
      </Head>
      <Navigation currentUser={currentUser} />
      
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
    

 

        {/* Refresh Button */}
        {/* <button 
          onClick={fetchUsers} 
          disabled={loading}
          style={{ 
            marginBottom: '20px', 
            padding: '10px 20px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          {loading ? 'Loading...' : '🔄 Làm mới'}
        </button> */}

        {/* Users List */}
        <h2>Tổng số lượng Users: {users.length}</h2>
        {users.length > 0 ? (
          <div style={{ display: 'grid', gap: '15px' }}>
            {users.map((user) => (
              <div 
                key={user._id} 
                style={{ 
                  padding: '20px', 
                  border: '1px solid #ddd', 
                  borderRadius: '8px',
                  backgroundColor: '#f9f9f9'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'center' }}>
                  {/* User Info */}
                  <div>
                    <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
                      👤 {user.hoTen || 'Chưa có tên'}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '18px' }}>
                      <div><strong>Xưởng:</strong> {user.xuong || 'N/A'}</div>
                      <div><strong>Vai trò:</strong> {user.vaiTro || 'N/A'}</div>
                      <div><strong>Ngày tạo:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleString('vi-VN') : 'N/A'}</div>
                    </div>
                  </div>

                  {/* Password Section */}
                  <div style={{ textAlign: 'center' }}>
                  
                    
                    {/* QR Code */}
                    {user.MatKhau && (
                      <div style={{ textAlign: 'center' }}>
                        <QRCodeGenerator password={user.MatKhau} size={200} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            color: '#666'
          }}>
            <p>Chưa có users nào trong hệ thống.</p>
          </div>
        )}
      </div>
    </>
  );
}

// Wrap với AuthGuard
export default function ViewPasswords() {
  return (
    <AuthGuard>
      <ViewPasswordsContent />
    </AuthGuard>
  );
} 