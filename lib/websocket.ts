import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // Check both localStorage and sessionStorage for token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
    });
    
    socket.on('connect', () => {
      console.log('WebSocket connected');
    });
    
    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
    
    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

