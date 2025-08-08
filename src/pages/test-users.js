import { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  DEFAULT_USER_FIELDS, 
  FIELD_CONFIG, 
  createEmptyUserData,
  validateUserData,
  generateRandomPassword
} from '../constants/userFields';
import QRCodeGenerator from '../components/QRCodeGenerator';
import AuthGuard from '../components/AuthGuard';
import Navigation from '../components/Navigation';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';
import { getAuthToken } from '../utils/auth';

function TestUsersContent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState(createEmptyUserData());
  const [errors, setErrors] = useState({});
  const [showQRCode, setShowQRCode] = useState(false);
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

  // Tạo user mới
  const createUser = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateUserData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setMessage('Vui lòng kiểm tra lại thông tin!');
      return;
    }
    
    setLoading(true);
    setErrors({});
    // Kiểm tra user đã tồn tại chưa
    const existedUser = users.find(u => u.hoTen.trim().toLowerCase() === formData.hoTen.trim().toLowerCase());
    if (existedUser) {
      alert('Đã có user với tên này!');
      setLoading(false);
      return;
    }
    
    try {
      const data = await apiPost('/api/users', formData);
      if (data.success) {
        setMessage('Tạo user thành công!');
        setFormData(createEmptyUserData());
        fetchUsers();
      } else {
        setMessage('Lỗi: ' + data.error);
      }
    } catch (error) {
      setMessage('Lỗi kết nối: ' + error.message);
    }
    setLoading(false);
  };

  // Cập nhật user
  const updateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    // Validate form
    const validation = validateUserData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setMessage('Vui lòng kiểm tra lại thông tin!');
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      const data = await apiPut(`/api/users/${selectedUser._id}`, formData);
      if (data.success) {
        setMessage('Cập nhật user thành công!');
        setSelectedUser(null);
        setFormData(createEmptyUserData());
        fetchUsers();
      } else {
        setMessage('Lỗi: ' + data.error);
      }
    } catch (error) {
      setMessage('Lỗi kết nối: ' + error.message);
    }
    setLoading(false);
  };

  // Xóa user
  const deleteUser = async (userId) => {
    if (!confirm('Bạn có chắc muốn xóa user này?')) return;
    
    setLoading(true);
    try {
      const data = await apiDelete(`/api/users/${userId}`);
      if (data.success) {
        setMessage('Xóa user thành công!');
        fetchUsers();
      } else {
        setMessage('Lỗi: ' + data.error);
      }
    } catch (error) {
      setMessage('Lỗi kết nối: ' + error.message);
    }
    setLoading(false);
  };

  // Chọn user để edit
  const selectUserForEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      ...DEFAULT_USER_FIELDS,
      ...user
    });
    setErrors({});
    setShowQRCode(false);
  };

  // Reset form
  const resetForm = () => {
    setSelectedUser(null);
    setFormData(createEmptyUserData());
    setErrors({});
    setShowQRCode(false);
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Tạo mật khẩu mới
  const generateNewPassword = () => {
    const newPassword = generateRandomPassword();
    setFormData(prev => ({ ...prev, MatKhau: newPassword }));
  };

  // Render form field
  const renderField = (field, config) => {
    const commonStyle = {
      padding: '8px',
      borderRadius: '4px',
      border: errors[field] ? '1px solid #dc3545' : '1px solid #ccc',
      width: '100%',
      fontSize: '20px',
      background: "#fff",
      color: "#000",
    };

    if (config.type === 'select') {
      return (
        <select
          value={formData[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          required={config.required && !selectedUser}
          style={commonStyle}
        >
          {config.options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (field === 'MatKhau') {
      return (
        <div style={{ display: 'flex', gap: '5px' }}>
          <input
            type={config.type}
            placeholder={config.placeholder}
            value={formData[field]}
            // onChange={(e) => handleInputChange(field, e.target.value)}
            required={config.required && !selectedUser}
            style={{ ...commonStyle, flex: 1 }}
          />
          <button
            type="button"
            onClick={generateNewPassword}
            style={{
              padding: '0px 5px',
              backgroundColor: '#cacaca',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '20px'
            }}
            title="Tạo mật khẩu mới"
          >
            🔄
          </button>
        </div>
      );
    }

    return (
      <input
        type={config.type}
        placeholder={config.placeholder}
        value={formData[field]}
        onChange={(e) => handleInputChange(field, e.target.value)}
        required={config.required && !selectedUser}
        style={commonStyle}
      />
    );
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <>
      <Head>
        <title>Test Users CRUD</title>
        <meta name="description" content="Test MongoDB Users CRUD operations" />
      </Head>
      <Navigation currentUser={currentUser} />
      
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
       
        
        {/* Form */}
        <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h2>{selectedUser ? 'Sửa User' : 'tạo User mới'}</h2>
          <form onSubmit={selectedUser ? updateUser : createUser}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {Object.entries(FIELD_CONFIG).map(([field, config]) => (
                <div key={field}>
                  {renderField(field, config)}
                  {errors[field] && (
                    <div style={{ color: '#dc3545', fontSize: '15px', marginTop: '2px' }}>
                      {errors[field]}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* QR Code Section */}
            {formData.MatKhau && (
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0 }}>QR Code cho mật khẩu</h3>
                  <button
                    type="button"
                    onClick={() => setShowQRCode(!showQRCode)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: showQRCode ? '#6c757d' : '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {showQRCode ? 'Ẩn QR Code' : 'Hiển thị QR Code'}
                  </button>
                </div>
                {showQRCode && (
                  <QRCodeGenerator password={formData.MatKhau} size={250} />
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button 
                type="submit" 
                disabled={loading}
                style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                {loading ? 'Processing...' : (selectedUser ? 'Update Userrr' : 'Create User')}
              </button>
              {selectedUser && (
                <button 
                  type="button"
                  onClick={resetForm}
                  style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Message */}
        {message && (
          <div style={{ 
            padding: '10px', 
            marginBottom: '20px',
            backgroundColor: message.includes('Lỗi') ? '#ffebee' : '#e8f5e8',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}>
            {message}
          </div>
        )}

        {/* Refresh Button */}
        <button 
          onClick={fetchUsers} 
          disabled={loading}
          style={{ marginBottom: '20px', padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'Loading...' : 'Refresh Users'}
        </button>

        {/* Users List */}
        <h2>Users List ({users.length})</h2>
        {users.length > 0 ? (
          <div style={{ display: 'grid', gap: '15px' }}>
            {users.map((user) => (
              <div 
                key={user._id} 
                style={{ 
                  padding: '20px', 
                  border: '1px solid #ddd', 
                  borderRadius: '8px',
                  backgroundColor: '#f9f9f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '5px' }}>
                    {Object.entries(FIELD_CONFIG).map(([field, config]) => (
                      <div key={field}>
                        <strong>{config.label}:</strong> {user[field] || 'N/A'}
                      </div>
                    ))}
                   
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
                  <button 
                    onClick={() => selectUserForEdit(user)}
                    style={{ padding: '8px 16px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => deleteUser(user._id)}
                    style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No users found. Create a new user above.</p>
        )}
      </div>
    </>
  );
}

// Wrap với AuthGuard
export default function TestUsers() {
  return (
    <AuthGuard>
      <TestUsersContent />
    </AuthGuard>
  );
} 