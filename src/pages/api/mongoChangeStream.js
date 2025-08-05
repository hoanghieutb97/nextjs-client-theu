import { getDB } from '../../utils/database';

let changeStream = null;
let isInitialized = false;
let initializationPromise = null;
let clientCount = 0; // Đếm số client đang sử dụng

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action } = req.body;

    if (action === 'start') {
      // Tăng số client
      clientCount++;
      console.log(`Client connected. Total clients: ${clientCount}`);

      // Nếu đang khởi tạo, đợi promise hoàn thành
      if (initializationPromise) {
        console.log('MongoDB Change Stream initialization in progress, waiting...');
        await initializationPromise;
        return res.status(200).json({ 
          success: true, 
          message: 'Change stream already running',
          clientCount: clientCount
        });
      }

      // Kiểm tra nếu đã được khởi tạo rồi
      if (isInitialized && changeStream) {
        console.log('MongoDB Change Stream already running');
        return res.status(200).json({ 
          success: true, 
          message: 'Change stream already running',
          clientCount: clientCount
        });
      }

      // Tạo promise để tránh race condition
      initializationPromise = (async () => {
        try {
          // Đảm bảo Socket.IO server đã được khởi tạo
          if (!req.socket.server.io) {
            console.log('Socket.IO server not initialized, initializing...');
            // Gọi API socket để khởi tạo Socket.IO server
            try {
              const socketResponse = await fetch(`${req.headers.host ? `http://${req.headers.host}` : 'http://localhost:1002'}/api/socket`);
              if (!socketResponse.ok) {
                throw new Error('Failed to initialize Socket.IO server');
              }
            } catch (error) {
              console.error('Error initializing Socket.IO server:', error);
              throw error;
            }
          }

          // Bắt đầu theo dõi change stream
          if (changeStream) {
            changeStream.close();
          }

          const db = await getDB();
          const listDonCollection = db.collection('listDon');

          // Tạo change stream để theo dõi collection listDon
          changeStream = listDonCollection.watch([], {
            fullDocument: 'updateLookup'
          });

          console.log('MongoDB Change Stream started for listDon collection');
          isInitialized = true;
        } catch (error) {
          console.error('Error initializing change stream:', error);
          throw error;
        } finally {
          initializationPromise = null;
        }
      })();

      try {
        await initializationPromise;
      } catch (error) {
        return res.status(500).json({ error: 'Failed to initialize change stream' });
      }

      // Lắng nghe các thay đổi
      changeStream.on('change', (change) => {
        console.log('Change detected in listDon collection:', change.operationType, 'Document ID:', change.documentKey?._id);
        
        // Thông báo qua Socket.IO nếu có
        if (req.socket.server.io) {
          // Gửi event listDonChanged cho tất cả client
          req.socket.server.io.emit('listDonChanged', {
            operationType: change.operationType,
            documentId: change.documentKey?._id,
            timestamp: new Date().toISOString(),
            changeId: change._id // Thêm change ID để track
          });
          console.log('Socket notification sent for listDon change - Change ID:', change._id);
        } else {
          console.log('Socket.IO server not available');
        }
      });

      changeStream.on('error', (error) => {
        console.error('Change stream error:', error);
      });

      res.status(200).json({ 
        success: true, 
        message: 'Change stream started for listDon collection',
        clientCount: clientCount
      });

        } else if (action === 'stop') {
      // Giảm số client
      clientCount = Math.max(0, clientCount - 1);
      console.log(`Client disconnected. Total clients: ${clientCount}`);

      // Chỉ dừng change stream khi không còn client nào
      if (clientCount === 0 && changeStream) {
        changeStream.close();
        changeStream = null;
        isInitialized = false;
        console.log('MongoDB Change Stream stopped - No more clients');
      }

      res.status(200).json({ 
        success: true,
        message: clientCount === 0 ? 'Change stream stopped' : 'Client disconnected',
        clientCount: clientCount
      });

    } else {
      res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Error handling change stream:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 