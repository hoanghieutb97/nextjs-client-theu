import { getAuthToken } from './auth';

// Wrapper cho fetch với authentication
export const apiCall = async (url, options = {}) => {
  const token = getAuthToken();
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Thêm Authorization header nếu có token
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    // Nếu response là 401, có thể token hết hạn
    if (response.status === 401) {
      // Xóa token và chuyển về login
      localStorage.removeItem('authToken');
      localStorage.removeItem('loginTime');
      window.location.href = '/login';
      return { success: false, error: 'Phiên đăng nhập đã hết hạn' };
    }

    return data;
  } catch (error) {
    console.error('API call error:', error);
    return { success: false, error: 'Lỗi kết nối' };
  }
};

// Helper functions cho các HTTP methods
export const apiGet = (url) => apiCall(url);
export const apiPost = (url, data) => apiCall(url, { method: 'POST', body: JSON.stringify(data) });
export const apiPut = (url, data) => apiCall(url, { method: 'PUT', body: JSON.stringify(data) });
export const apiDelete = (url) => apiCall(url, { method: 'DELETE' }); 