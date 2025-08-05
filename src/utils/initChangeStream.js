import { getDB } from './database';

let changeStream = null;
let isInitialized = false;

// Khởi tạo MongoDB Change Stream
export const initializeChangeStream = async (io) => {
  if (isInitialized && changeStream) {
    console.log('MongoDB Change Stream already initialized');
    return;
  }

  try {
    console.log('Initializing MongoDB Change Stream on server start...');
    
    const db = await getDB();
    const listDonCollection = db.collection('listDon');

    // Tạo change stream để theo dõi collection listDon
    // Không theo dõi những item có status === "done"
    changeStream = listDonCollection.watch([
      {
        $match: {
          $or: [
            // Trường hợp 1: Không có status field
            { status: { $exists: false } },
            // Trường hợp 2: status không phải "done"
            { status: { $ne: "done" } }
          ]
        }
      }
    ], {
      fullDocument: 'updateLookup'
    });

    console.log('MongoDB Change Stream started for listDon collection');

    // Lắng nghe các thay đổi
    changeStream.on('change', (change) => {
      console.log('Change detected in listDon collection:', change.operationType, 'Document ID:', change.documentKey?._id);
      
      // Thông báo qua Socket.IO nếu có
      if (io) {
        // Gửi event listDonChanged cho tất cả client
        io.emit('listDonChanged', {
          operationType: change.operationType,
          documentId: change.documentKey?._id,
          timestamp: new Date().toISOString(),
          changeId: change._id
        });
        console.log('Socket notification sent for listDon change - Change ID:', change._id);
      } else {
        console.log('Socket.IO not available for change notification');
      }
    });

    changeStream.on('error', (error) => {
      console.error('Change stream error:', error);
    });

    isInitialized = true;
    console.log('MongoDB Change Stream initialization completed');

  } catch (error) {
    console.error('Error initializing MongoDB Change Stream:', error);
    throw error;
  }
};

// Dừng MongoDB Change Stream
export const stopChangeStream = () => {
  if (changeStream) {
    changeStream.close();
    changeStream = null;
    isInitialized = false;
    console.log('MongoDB Change Stream stopped');
  }
};

// Kiểm tra trạng thái
export const isChangeStreamRunning = () => {
  return isInitialized && changeStream;
}; 