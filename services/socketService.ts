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
  createRoom: (gameMode: GameMode, playerName: string, timerDuration?: number, codeLength?: number) => void;
  joinRoom: (roomId: string, playerName: string) => void;
  startGame: (roomId: string) => void;
  setDuelCode: (roomId: string, playerId: string, code: string) => void;
  submitGuess: (roomId: string, playerId: string, guess: string) => void;
  setReady: (roomId: string, playerId: string, isReady: boolean) => void;
  updateSettings: (roomId: string, settings: RoomSettings) => void;
  getSocketId: () => string | null;
  resetGame: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  // Battle Royale
  brSubmitGuess: (roomId: string, colors: string[]) => void;
  onBrGuessResult: (callback: (data: { colors: string[], hits: number, pseudoHits: number, solved: boolean }) => void) => void;
  onBrPlayerSolved: (callback: (data: { playerId: string, playerName: string, guessCount: number }) => void) => void;
  onBrRoundEnd: (callback: (data: { roomId: string, eliminated: string[], playersAlive: number, nextRound: number, nextCodeLength: number, nextDuration: number }) => void) => void;
  onBrPlayerProgress: (callback: (data: { players: { id: string, name: string, guessCount: number, hasSolved: boolean }[] }) => void) => void;
  onBrEliminated: (callback: (data: { placement: number, totalPlayers: number, roundEliminated: number, stats: any }) => void) => void;
  onBrGameOver: (callback: (data: { winnerId: string, winnerName: string, placement: number, totalPlayers: number, stats: any }) => void) => void;
  onBrRoundStart: (callback: (data: { round: number, codeLength: number, duration: number, playersAlive: number }) => void) => void;
}

let socket: Socket;

export const socketService: SocketService = {
  connect: (onRoomUpdate, onGameStart, onGameOver, onPlayerLeft, onError) => {
    const SERVER_URL = import.meta.env.VITE_SERVER_URL;

    // Generate/Retrieve Session ID - wrapped in try-catch for incognito mode
    let sessionId: string;
    try {
      sessionId = localStorage.getItem('crack_session_id') || '';
      if (!sessionId) {
        sessionId = crypto.randomUUID?.() || Math.random().toString(36).substring(2);
        localStorage.setItem('crack_session_id', sessionId);
      }
    } catch (e) {
      // localStorage blocked (incognito or privacy settings)
      console.warn('localStorage unavailable, using temporary session ID');
      sessionId = crypto.randomUUID?.() || Math.random().toString(36).substring(2);
    }
    console.log("Session ID:", sessionId);

    if (!socket) {
      console.log("Connecting to real socket server at", SERVER_URL);
      socket = io(SERVER_URL, { auth: { sessionId } });

      socket.on('connect', () => {
        console.log("Connected to server with ID:", socket.id);
      });

      socket.on('connect_error', (error) => {
        console.error("Socket connection error:", error);
        onError('Failed to connect to server');
      });
    } else {
      console.log("Reusing existing socket connection");
      // Remove all previous listeners to prevent duplicates/stale closures
      socket.off('room_update');
      socket.off('game_start');
      socket.off('game_over');
      socket.off('player_left');
      socket.off('error');
      // Also clean up BR listeners to prevent duplicates
      socket.off('br_guess_result');
      socket.off('br_player_solved');
      socket.off('br_round_end');
      socket.off('br_round_start');
      socket.off('br_player_progress');
      socket.off('br_eliminated');
      socket.off('br_game_over');
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

  createRoom: (gameMode, playerName, timerDuration, codeLength) => {
    let sessionId: string | null = null;
    try { sessionId = localStorage.getItem('crack_session_id'); } catch (e) { /* incognito */ }
    if (socket) socket.emit('create_room', { gameMode, playerName, sessionId, timerDuration, codeLength });
  },

  joinRoom: (roomId, playerName) => {
    let sessionId: string | null = null;
    try { sessionId = localStorage.getItem('crack_session_id'); } catch (e) { /* incognito */ }
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
  },

  // Battle Royale methods
  brSubmitGuess: (roomId: string, colors: string[]) => {
    if (socket) socket.emit('br_submit_guess', { roomId, colors });
  },

  onBrGuessResult: (callback: (data: { colors: string[], hits: number, pseudoHits: number, solved: boolean }) => void) => {
    if (socket) {
      socket.off('br_guess_result'); // Remove old listener first
      socket.on('br_guess_result', callback);
    }
  },

  onBrPlayerSolved: (callback: (data: { playerId: string, playerName: string, guessCount: number }) => void) => {
    if (socket) {
      socket.off('br_player_solved');
      socket.on('br_player_solved', callback);
    }
  },

  onBrRoundEnd: (callback: (data: { roomId: string, eliminated: string[], playersAlive: number, nextRound: number, nextCodeLength: number, nextDuration: number }) => void) => {
    if (socket) {
      socket.off('br_round_end');
      socket.on('br_round_end', callback);
    }
  },

  onBrPlayerProgress: (callback: (data: { players: { id: string, name: string, guessCount: number, hasSolved: boolean }[] }) => void) => {
    if (socket) {
      socket.off('br_player_progress');
      socket.on('br_player_progress', callback);
    }
  },

  onBrEliminated: (callback: (data: { placement: number, totalPlayers: number, roundEliminated: number, stats: any }) => void) => {
    if (socket) {
      socket.off('br_eliminated');
      socket.on('br_eliminated', callback);
    }
  },

  onBrGameOver: (callback: (data: { winnerId: string, winnerName: string, placement: number, totalPlayers: number, stats: any }) => void) => {
    if (socket) {
      socket.off('br_game_over');
      socket.on('br_game_over', callback);
    }
  },

  onBrRoundStart: (callback: (data: { round: number, codeLength: number, duration: number, playersAlive: number }) => void) => {
    if (socket) {
      socket.off('br_round_start');
      socket.on('br_round_start', callback);
    }
  }
};
