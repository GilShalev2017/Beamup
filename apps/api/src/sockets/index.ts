import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer;

export const initSocketIO = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
      ],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Client joins the inventory room to receive inventory updates
    socket.on('join:inventory', () => {
      socket.join('inventory');
      console.log(`${socket.id} joined inventory room`);
    });

    socket.on('leave:inventory', () => {
      socket.leave('inventory');
    });

    // Client can request an agent action via socket (optional)
    socket.on('agent:run', (data: { prompt: string }) => {
      console.log(`Agent task requested by ${socket.id}:`, data.prompt);
      // Emit back a stub response; replace with real AgentService call
      socket.emit('agent:response', {
        status: 'queued',
        message: `Agent received: "${data.prompt}"`,
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

export const getSocketIO = (): SocketIOServer => {
  if (!io) throw new Error('Socket.IO not initialized. Call initSocketIO() first.');
  return io;
};
