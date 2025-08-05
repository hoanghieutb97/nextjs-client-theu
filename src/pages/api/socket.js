import { Server } from 'socket.io';
import { initializeChangeStream } from '../../utils/initChangeStream';

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
    res.end();
    return;
  }

  console.log('Setting up Socket');
  const io = new Server(res.socket.server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  res.socket.server.io = io;

  // Khởi tạo MongoDB Change Stream khi Socket.IO server start
  initializeChangeStream(io).catch(error => {
    console.error('Failed to initialize MongoDB Change Stream:', error);
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Khi client gửi fetchItems event
    socket.on('fetchItems', () => {
      console.log('Client requested fetchItems, broadcasting to others...');
      console.log('Total connected clients:', io.engine.clientsCount);
      // Broadcast cho tất cả client khác (trừ client hiện tại)
      socket.broadcast.emit('refreshItems');
      console.log('Broadcast sent to other clients');
    });
    
    // Khi client disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  console.log('Socket is set up');
  res.end();
};

export default SocketHandler; 