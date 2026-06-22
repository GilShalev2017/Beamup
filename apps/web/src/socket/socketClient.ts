import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
      // Auto-join inventory room
      socket.emit('join:inventory');
    });

    socket.on('disconnect', (reason) => {
      console.warn('🔌 Socket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });
  }
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket?.connected) socket.disconnect();
};
