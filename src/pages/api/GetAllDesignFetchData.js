// API route để server Node.js khác gọi để trigger refresh cho tất cả client
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('External server requested GetAllDesignFetchData');
  
  // Kiểm tra xem socket server đã được khởi tạo chưa
  if (req.socket.server.io) {
    // Gửi refreshItems tới tất cả client
    req.socket.server.io.emit('refreshItems');
    console.log('Sent refreshItems to all clients');
    res.status(200).json({ 
      message: 'Refresh signal sent to all clients',
      timestamp: new Date().toISOString()
    });
  } else {
    console.log('Socket not initialized yet');
    res.status(500).json({ 
      error: 'Socket not initialized',
      timestamp: new Date().toISOString()
    });
  }
} 