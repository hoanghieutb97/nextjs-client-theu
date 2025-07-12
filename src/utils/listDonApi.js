import { getAuthToken } from './auth';

const API_BASE_URL = '/api/listDon';

// Helper function để gọi API với authentication
const apiCall = async (url, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API call failed');
    }
    
    return data;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Lấy danh sách items có status "doiThietKe"
export const getDoiThietKeItems = async () => {
  return await apiCall(API_BASE_URL);
};

// Lấy item theo ID
export const getItemById = async (id) => {
  try {
    const response = await fetch(`/api/listDon/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching item by ID:', error);
    return { success: false, error: error.message };
  }
};

// Tạo item mới
export const createItem = async (itemData) => {
  return await apiCall(API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify(itemData)
  });
};

// Cập nhật item
export const updateItem = async (id, updateData) => {
  return await apiCall(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  });
};

// Xóa item
export const deleteItem = async (id) => {
  return await apiCall(`${API_BASE_URL}/${id}`, {
    method: 'DELETE'
  });
};

// Hàm cập nhật item theo _id
export const updateItemById = async (id, updateData) => {
  try {
    const response = await fetch(`/api/listDon/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(updateData)
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating item by ID:', error);
    return { success: false, error: error.message };
  }
};

// Hàm xóa item theo _id
export const deleteItemById = async (id) => {
  try {
    const response = await fetch(`/api/listDon/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting item by ID:', error);
    return { success: false, error: error.message };
  }
};

// Cập nhật status của item
export const updateItemStatus = async (id, newStatus) => {
  return await updateItem(id, { status: newStatus });
};

// Lấy items theo status
export const getItemsByStatus = async (status) => {
  return await apiCall(`${API_BASE_URL}?status=${status}`);
};

// Lấy tất cả items (không filter theo status)
export const getAllItems = async () => {
  return await apiCall(`${API_BASE_URL}/all`);
}; 