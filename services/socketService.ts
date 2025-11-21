
import { GameMode, Room, Guess, RoomSettings } from '../types';
import { generateSecretCode, calculateFeedback, generateFeedbackMessage } from '../utils/feedback';
import { GameState, Player } from '../types';

// --- MOCK SERVER STATE ---
let rooms: { [key: string]: Room } = {};
const BOT_NAMES = ['Cipher', 'Logic', 'Glitch', 'Binary'];
const PLAYER_ID = 'player-human'; // Static ID for the human player in simulation

// --- MOCK SOCKET SERVICE ---
interface SocketService {
  connect: (
    onRoomUpdate: (room: Room) => void,
    onGameStart: (room: Room) => void,
    onGameOver: (room: Room) => void,
    onError: (message: string) => void
  ) => void;
  createRoom: (gameMode: GameMode) => void;
  joinRoom: (roomId: string) => void;
  startGame: (roomId: string) => void;
  setDuelCode: (roomId: string, playerId: string, code: string) => void;
  submitGuess: (roomId: string, playerId: string, guess: string) => void;
  setReady: (roomId: string, playerId: string, isReady: boolean) => void;
  updateSettings: (roomId: string, settings: RoomSettings) => void;
}

// --- CALLBACKS to notify React UI ---
let onRoomUpdateCallback: (room: Room) => void;
let onGameStartCallback: (room: Room) => void;
let onGameOverCallback: (room: Room) => void;
let onErrorCallback: (message: string) => void;

const createPlayer = (id: string, name: string, isHost: boolean = false, isBot: boolean = false): Player => ({
  id, name, isHost, isReady: isHost || isBot, guesses: [], isBot,
});

// Helper to ensure React triggers re-render by creating a new object reference
// We use JSON parse/stringify to simulate a network boundary and ensure deep cloning
const broadcast = (callback: ((room: Room) => void) | undefined, room: Room) => {
    if (callback && room) {
        try {
            const deepClone = JSON.parse(JSON.stringify(room));
            setTimeout(() => callback(deepClone), 10);
        } catch (e) {
            console.error("Failed to broadcast room update", e);
        }
    }
};

// Helper to immutably update a player in a room
const updatePlayerInRoom = (room: Room, playerId: string, updateFn: (p: Player) => Player): Room => {
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return room;

    const updatedPlayers = [...room.players];
    updatedPlayers[playerIndex] = updateFn(updatedPlayers[playerIndex]);

    return { ...room, players: updatedPlayers };
};

export const socketService: SocketService = {
  connect: (onRoomUpdate, onGameStart, onGameOver, onError) => {
    console.log("Mock socket service connected.");
    onRoomUpdateCallback = onRoomUpdate;
    onGameStartCallback = onGameStart;
    onGameOverCallback = onGameOver;
    onErrorCallback = onError;
  },

  createRoom: (gameMode) => {
    const roomId = `R${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const humanPlayer = createPlayer(PLAYER_ID, 'You', true);
    let players = [humanPlayer];
    
    const settings: RoomSettings = { codeLength: 4, allowRepeats: false };

    if (gameMode === 'DUEL') {
        const bot = createPlayer('bot1', BOT_NAMES[0], false, true);
        players.push(bot);
        // Link opponents
        players[0].opponentId = players[1].id;
        players[1].opponentId = players[0].id;
    }

    const newRoom: Room = {
      id: roomId,
      players,
      gameMode,
      gameState: GameState.Lobby,
      secretCode: '',
      settings,
    };

    rooms[roomId] = newRoom;
    console.log(`[Server Sim] Room ${roomId} created.`);
    broadcast(onRoomUpdateCallback, newRoom);
  },

  joinRoom: (roomId) => {
    const room = rooms[roomId];
    if (!room) {
      setTimeout(() => onErrorCallback("Room not found."), 100);
      return;
    }
    
    if (room.players.find(p => p.id === PLAYER_ID)) {
       console.log(`[Server Sim] Already in room ${roomId}.`);
       broadcast(onRoomUpdateCallback, room);
       return;
    }

    if(room.gameMode === 'DUEL' && room.players.length >= 2) {
       setTimeout(() => onErrorCallback("Duel room is full."), 100);
       return;
    }
     if(room.gameMode === 'FFA' && room.players.length >= 8) {
       setTimeout(() => onErrorCallback("Room is full."), 100);
       return;
    }
    
    const newPlayerName = `Player ${room.players.length + 1}`;
    const newPlayer = createPlayer(PLAYER_ID, newPlayerName, false);
    
    // Immutable join
    let updatedRoom = {
        ...room,
        players: [...room.players, newPlayer]
    };
    
    // Duel Logic: Link players if now full - Create completely new player objects
    if (updatedRoom.gameMode === 'DUEL' && updatedRoom.players.length === 2) {
        const p1 = { ...updatedRoom.players[0], opponentId: updatedRoom.players[1].id };
        const p2 = { ...updatedRoom.players[1], opponentId: updatedRoom.players[0].id };
        updatedRoom = { ...updatedRoom, players: [p1, p2] };
    }

    rooms[roomId] = updatedRoom;
    console.log(`[Server Sim] Player joined room ${roomId}. Broadcasting update.`);
    broadcast(onRoomUpdateCallback, updatedRoom);
  },
  
  setReady: (roomId, playerId, isReady) => {
    const room = rooms[roomId];
    if (!room) return;
    
    const updatedRoom = updatePlayerInRoom(room, playerId, p => ({ ...p, isReady }));
    rooms[roomId] = updatedRoom;
    broadcast(onRoomUpdateCallback, updatedRoom);
  },

  updateSettings: (roomId, settings) => {
      const room = rooms[roomId];
      if (room && room.gameState === GameState.Lobby) {
          const updatedRoom = { ...room, settings };
          rooms[roomId] = updatedRoom;
          console.log(`[Server Sim] Room ${roomId} settings updated.`);
          broadcast(onRoomUpdateCallback, updatedRoom);
      }
  },

  startGame: (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    let updatedRoom = { ...room, gameState: GameState.Playing };

    if (room.gameMode === 'FFA' || room.gameMode === 'SINGLE') {
      updatedRoom.secretCode = generateSecretCode(room.settings.codeLength, room.settings.allowRepeats);
    }
    
    // Reset players for game start
    updatedRoom.players = updatedRoom.players.map(p => ({
        ...p,
        guesses: [],
        secretCode: updatedRoom.gameMode === 'DUEL' ? p.secretCode : undefined
    }));
    
    rooms[roomId] = updatedRoom;
    console.log(`[Server Sim] Game started in room ${roomId}.`);
    broadcast(onGameStartCallback, updatedRoom);
    
    if(updatedRoom.gameMode === 'DUEL') {
        const bot = updatedRoom.players.find(p => p.isBot);
        if(bot) {
            setTimeout(() => {
                const botCode = generateSecretCode(updatedRoom.settings.codeLength, updatedRoom.settings.allowRepeats);
                socketService.setDuelCode(roomId, bot.id, botCode);
            }, 1000);
        }
    }
  },

  setDuelCode: (roomId, playerId, code) => {
      const room = rooms[roomId];
      if (!room) return;
      
      const updatedRoom = updatePlayerInRoom(room, playerId, p => ({ ...p, secretCode: code }));
      rooms[roomId] = updatedRoom;
      console.log(`[Server Sim] Player ${playerId} set secret code.`);
      broadcast(onRoomUpdateCallback, updatedRoom);
  },

  submitGuess: (roomId, playerId, guessCode) => {
    const room = rooms[roomId];
    if (!room || room.gameState !== GameState.Playing) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return;
    
    let secretToGuess = room.secretCode;
    if (room.gameMode === 'DUEL') {
        const opponent = room.players.find(p => p.id === player.opponentId);
        if (!opponent || !opponent.secretCode) {
            console.error("[Server Sim] Opponent code missing.");
            return;
        }
        secretToGuess = opponent.secretCode;
    }

    if (!secretToGuess) return;

    const { hits, pseudoHits } = calculateFeedback(guessCode, secretToGuess);
    const feedbackMessage = generateFeedbackMessage(hits, pseudoHits, room.settings.codeLength);
    
    const newGuess: Guess = {
      id: player.guesses.length + 1,
      code: guessCode,
      hits,
      pseudoHits,
      feedbackMessage,
      playerId,
      playerName: player.name,
    };
    
    // Immutable update of player guesses
    const updatedRoom = updatePlayerInRoom(room, playerId, p => ({
        ...p,
        guesses: [...p.guesses, newGuess]
    }));

    if (hits === room.settings.codeLength) {
      updatedRoom.gameState = GameState.Won;
      rooms[roomId] = updatedRoom;
      console.log(`[Server Sim] Player ${playerId} won!`);
      broadcast(onGameOverCallback, updatedRoom);
    } else {
      rooms[roomId] = updatedRoom;
      console.log(`[Server Sim] Guess processed.`);
      broadcast(onRoomUpdateCallback, updatedRoom);
      
      if(room.gameMode === 'DUEL') {
          // Pass roomId to avoid closure capturing stale room state
          setTimeout(() => handleBotGuess(roomId), 1500);
      }
    }
  }
};


// --- MOCK BOT LOGIC ---
function handleBotGuess(roomId: string) {
    const room = rooms[roomId];
    if (!room || room.gameState !== GameState.Playing) return;

    const bot = room.players.find(p => p.isBot);
    const human = room.players.find(p => !p.isBot);
    
    if (!bot || !human || !human.secretCode) return; 

    const guessCode = generateSecretCode(room.settings.codeLength, room.settings.allowRepeats);
    const { hits, pseudoHits } = calculateFeedback(guessCode, human.secretCode);
    const feedbackMessage = generateFeedbackMessage(hits, pseudoHits, room.settings.codeLength);

    const newGuess: Guess = {
        id: bot.guesses.length + 1, code: guessCode, hits, pseudoHits, feedbackMessage, playerId: bot.id, playerName: bot.name,
    };

    const updatedRoom = updatePlayerInRoom(room, bot.id, p => ({
        ...p,
        guesses: [...p.guesses, newGuess]
    }));
    
    if (hits === room.settings.codeLength) {
      updatedRoom.gameState = GameState.Won;
      rooms[roomId] = updatedRoom;
      console.log(`[Server Sim] Bot won!`);
      broadcast(onGameOverCallback, updatedRoom);
    } else {
      rooms[roomId] = updatedRoom;
      broadcast(onRoomUpdateCallback, updatedRoom);
    }
}
