// Kiểm tra xem user đã đăng nhập chưa
export const isAuthenticated = () => {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('authToken');
    const loginTime = localStorage.getItem('loginTime');
    
    if (!token || !loginTime) return false;
    
    const now = new Date().getTime();
    const loginTimestamp = parseInt(loginTime);
    const hoursDiff = (now - loginTimestamp) / (1000 * 60 * 60);
    
    // Nếu quá 24h thì xóa token và return false
    if (hoursDiff >= 24) {
        logout();
        return false;
    }
    
    return true;
};

// Lấy token hiện tại
export const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
};

// Đăng xuất
export const logout = () => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('loginTime');
    
    // Chuyển hướng về trang login
    window.location.href = '/login';
};

// Kiểm tra thời gian còn lại của session
export const getSessionTimeLeft = () => {
    if (typeof window === 'undefined') return 0;
    
    const loginTime = localStorage.getItem('loginTime');
    if (!loginTime) return 0;
    
    const now = new Date().getTime();
    const loginTimestamp = parseInt(loginTime);
    const hoursDiff = (now - loginTimestamp) / (1000 * 60 * 60);
    
    return Math.max(0, 24 - hoursDiff);
};

// Format thời gian còn lại
export const formatTimeLeft = (hours) => {
    const hoursInt = Math.floor(hours);
    const minutes = Math.floor((hours - hoursInt) * 60);
    
    if (hoursInt > 0) {
        return `${hoursInt} giờ ${minutes} phút`;
    } else {
        return `${minutes} phút`;
    }
}; 