// Cấu trúc mặc định cho user fields
export const DEFAULT_USER_FIELDS = {
    hoTen: '',
    xuong: 'Xưởng 1',
    vaiTro: 'thêu',
    MatKhau: '',
    avatar: '',
    status1: '',
    status2: '',
    status3: ''
};

// Danh sách các trường bắt buộc
export const REQUIRED_FIELDS = ['hoTen'];

// Tạo mật khẩu ngẫu nhiên 7 ký tự
export const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

// Options cho dropdown
export const DROPDOWN_OPTIONS = {
    xuong: [
        { value: 'Xưởng 1', label: 'Xưởng 1' }
    ],
    vaiTro: [
        { value: 'Thiết Kế', label: 'Thiết Kế' },
        { value: 'luồn mếch', label: 'Luồn mếch' },
        { value: 'thêu', label: 'Thêu' },
        { value: 'admin', label: 'Admin' },
        { value: 'viTri1', label: 'Vị trí 1' }
    ]
};

// Cấu hình hiển thị cho form
export const FIELD_CONFIG = {
    hoTen: {
        label: 'Họ Tên',
        type: 'text',
        required: true,
        placeholder: 'Nhập họ tên'
    },
    xuong: {
        label: 'Xưởng',
        type: 'select',
        required: false,
        placeholder: 'Chọn xưởng',
        options: DROPDOWN_OPTIONS.xuong
    },
    vaiTro: {
        label: 'Vai Trò',
        type: 'select',
        required: false,
        placeholder: 'Chọn vai trò',
        options: DROPDOWN_OPTIONS.vaiTro
    },
    MatKhau: {
        label: 'Mật Khẩu',
        type: 'text',
        required: false,
        placeholder: 'Mật khẩu 7 ký tự',
        generateRandom: true
    },
    avatar: {
        label: 'Avatar',
        type: 'text',
        required: false,
        placeholder: 'URL avatar'
    },
    status1: {
        label: 'Status 1',
        type: 'text',
        required: false,
        placeholder: 'Status 1'
    },
    status2: {
        label: 'Status 2',
        type: 'text',
        required: false,
        placeholder: 'Status 2'
    },
    status3: {
        label: 'Status 3',
        type: 'text',
        required: false,
        placeholder: 'Status 3'
    }
};

// Helper function để tạo form data mới
export const createEmptyUserData = () => ({ 
    ...DEFAULT_USER_FIELDS,
    MatKhau: generateRandomPassword()
});

// Helper function để validate user data
export const validateUserData = (data) => {
    const errors = {};
    
    REQUIRED_FIELDS.forEach(field => {
        if (!data[field] || data[field].trim() === '') {
            errors[field] = `${FIELD_CONFIG[field].label} là bắt buộc`;
        }
    });
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}; 