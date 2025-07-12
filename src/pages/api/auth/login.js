import { getDB } from '../../../utils/database';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required' });
    }

    const db = await getDB();
    const usersCollection = db.collection('users');

    // Tìm user có mật khẩu khớp
    const user = await usersCollection.findOne({ MatKhau: password });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Mật khẩu không đúng' });
    }

    // Tạo token đơn giản (trong thực tế nên dùng JWT)
    const token = Buffer.from(`${user._id}-${Date.now()}`).toString('base64');

    // Trả về thông tin user (không bao gồm mật khẩu)
    const userInfo = {
      _id: user._id,
      hoTen: user.hoTen,
      xuong: user.xuong,
      vaiTro: user.vaiTro,
      avatar: user.avatar,
      status1: user.status1,
      status2: user.status2,
      status3: user.status3,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      token,
      user: userInfo,
      message: 'Đăng nhập thành công'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
} 