import { io, Socket } from 'socket.io-client';
import { GameMode, Room, RoomSettings } from '../types';

// --- SOCKET SERVICE ---
interface SocketService {
  connect: (
    onRoomUpdate: (room: Room) => void,
    onGameStart: (room: Room) => void,
    onGameOver: (room: Room) => void,
    onPlayerLeft: (data: { name: string }) => void,
    onError: (message: string) => void
  ) => void;
  createRoom: (gameMode: GameMode, playerName: string) => void;
  joinRoom: (roomId: string, playerName: string) => void;
  startGame: (roomId: string) => void;
  setDuelCode: (roomId: string, playerId: string, code: string) => void;
  submitGuess: (roomId: string, playerId: string, guess: string) => void;
  setReady: (roomId: string, playerId: string, isReady: boolean) => void;
  updateSettings: (roomId: string, settings: RoomSettings) => void;
  getSocketId: () => string | null;
  resetGame: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}

let socket: Socket;

export const socketService: SocketService = {
  connect: (onRoomUpdate, onGameStart, onGameOver, onPlayerLeft, onError) => {
    const SERVER_URL = import.meta.env.VITE_SERVER_URL;

    // Generate/Retrieve Session ID
    let sessionId = localStorage.getItem('crack_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      localStorage.setItem('crack_session_id', sessionId);
    }
    console.log("Session ID:", sessionId);

    if (!socket) {
      console.log("Connecting to real socket server at", SERVER_URL);
      // Pass sessionId in auth handshake for future proofing, though we send in events for now
      socket = io(SERVER_URL, { auth: { sessionId } });

      socket.on('connect', () => {
        console.log("Connected to server with ID:", socket.id);
      });
    } else {
      console.log("Reusing existing socket connection");
      // Remove all previous listeners to prevent duplicates/stale closures
      socket.off('room_update');
      socket.off('game_start');
      socket.off('game_over');
      socket.off('player_left');
      socket.off('error');
    }

    socket.on('room_update', (room: Room) => {
      console.log("Room update received:", room);
      onRoomUpdate(room);
    });

    socket.on('game_start', (room: Room) => {
      console.log("Game start received:", room);
      onGameStart(room);
    });

    socket.on('game_over', (room: Room) => {
      console.log("Game over received:", room);
      onGameOver(room);
    });

    socket.on('player_left', (data: { name: string }) => {
      console.log("Player left:", data);
      onPlayerLeft(data);
    });

    socket.on('error', (message: string) => {
      console.error("Socket error:", message);
      onError(message);
    });
  },

  createRoom: (gameMode, playerName) => {
    const sessionId = localStorage.getItem('crack_session_id');
    if (socket) socket.emit('create_room', { gameMode, playerName, sessionId });
  },

  joinRoom: (roomId, playerName) => {
    const sessionId = localStorage.getItem('crack_session_id');
    if (socket) socket.emit('join_room', { roomId, playerName, sessionId });
  },

  setReady: (roomId, playerId, isReady) => {
    if (socket) socket.emit('set_ready', { roomId, isReady });
  },

  updateSettings: (roomId, settings) => {
    if (socket) socket.emit('update_settings', { roomId, settings });
  },

  startGame: (roomId) => {
    if (socket) socket.emit('start_game', { roomId });
  },

  setDuelCode: (roomId, playerId, code) => {
    if (socket) socket.emit('set_duel_code', { roomId, code });
  },

  submitGuess: (roomId, playerId, guessCode) => {
    if (socket) socket.emit('submit_guess', { roomId, guessCode });
  },

  getSocketId: () => {
    return socket ? socket.id : null;
  },

  resetGame: (roomId) => {
    if (socket) socket.emit('reset_game', { roomId });
  },

  leaveRoom: (roomId) => {
    if (socket) socket.emit('leave_room', { roomId });
  }
};
