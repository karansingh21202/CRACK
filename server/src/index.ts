import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { GameMode, GameState, Player, Room, RoomSettings, Guess } from './types';
import { generateSecretCode, calculateFeedback, generateFeedbackMessage } from './gameUtils';
import { calculateScore } from './utils/scoring';

dotenv.config();

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins for dev, restrict in prod
        methods: ["GET", "POST"]
    }
});

// --- GAME STATE ---
const rooms: { [key: string]: Room } = {};
const BOT_NAMES = ['Cipher', 'Logic', 'Glitch', 'Binary'];

// --- HELPERS ---
const createPlayer = (id: string, name: string, isHost: boolean = false, isBot: boolean = false): Player => ({
    id, name, isHost, isReady: isHost || isBot, guesses: [], isBot, score: 0
});

const updatePlayerInRoom = (room: Room, playerId: string, updateFn: (p: Player) => Player): Room => {
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return room;

    const updatedPlayers = [...room.players];
    updatedPlayers[playerIndex] = updateFn(updatedPlayers[playerIndex]);

    return { ...room, players: updatedPlayers };
};

// --- BROADCAST HELPER ---
const broadcastRoomUpdate = (roomId: string, room: Room, eventName: string = 'room_update') => {
    const players = room.players;

    players.forEach(player => {
        // Create a deep copy for sanitization
        const sanitizedRoom: Room = JSON.parse(JSON.stringify(room));

        // If game is active (Playing or Panic), mask sensitive data
        if (sanitizedRoom.gameState === GameState.Playing || sanitizedRoom.gameState === GameState.Panic) {

            // 1. Mask Global Secret Code (FFA / CPU / Single)
            if (sanitizedRoom.gameMode !== 'DUEL' || sanitizedRoom.settings.duelModeType === 'CPU') {
                if (sanitizedRoom.secretCode) {
                    sanitizedRoom.secretCode = '****';
                }
            }

            // 2. Mask Player Data
            sanitizedRoom.players = sanitizedRoom.players.map(p => {
                const isMe = p.id === player.id;

                // Mask Guesses for opponents
                // Logic:
                // - CPU/FFA: Everyone solves SAME code. Seeing opponent guesses = Cheating. MASK IT.
                // - PVP: I solve code B set for me. Opponent solves code A I set for them.
                //   Seeing opponent guesses (on code A) gives me no info about code B.
                //   It just lets me watch them struggle. UNMASK IT.

                const isPVP = sanitizedRoom.gameMode === 'DUEL' && sanitizedRoom.settings.duelModeType === 'PVP';

                if (!isMe && !isPVP) {
                    p.guesses = p.guesses.map(g => ({ ...g, code: '****' }));
                }

                // Mask Secret Codes in PVP
                if (sanitizedRoom.gameMode === 'DUEL' && sanitizedRoom.settings.duelModeType === 'PVP') {
                    // Logic: 
                    // I should see the code I SET (p.secretCode where p.id === me)
                    // I should NOT see the code I am GUESSING (p.secretCode where p.id === opponent)

                    if (!isMe) {
                        // This is the opponent. Their secretCode is what I am trying to guess. MASK IT.
                        if (p.secretCode) {
                            p.secretCode = '****';
                        }
                    }
                    // If isMe, p.secretCode is what I set for them. KEEP IT.
                }

                return p;
            });
        }

        io.to(player.id).emit(eventName, sanitizedRoom);
    });
};

// --- SOCKET HANDLERS ---
io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('create_room', ({ gameMode, playerName }: { gameMode: GameMode, playerName: string }) => {
        const roomId = Math.random().toString(36).substr(2, 4).toUpperCase();
        const player = createPlayer(socket.id, playerName || 'Player 1', true);
        let players = [player];

        const settings: RoomSettings = {
            codeLength: 4,
            allowRepeats: false,
            duelModeType: gameMode === 'DUEL' ? 'PVP' : undefined
        };

        if (gameMode === 'DUEL') {
            // Future: Add bot logic here if needed.
            // Currently we wait for a second human player.
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
        socket.join(roomId);
        broadcastRoomUpdate(roomId, newRoom);
        console.log(`Room ${roomId} created by ${socket.id}`);
    });

    socket.on('join_room', ({ roomId, playerName }: { roomId: string, playerName: string }) => {
        const room = rooms[roomId];
        if (!room) {
            socket.emit('error', 'Room not found');
            return;
        }

        if (room.players.find(p => p.id === socket.id)) {
            broadcastRoomUpdate(roomId, room);
            return;
        }

        if (room.gameMode === 'DUEL' && room.players.length >= 2) {
            socket.emit('error', 'Room is full');
            return;
        }

        if (room.gameMode === 'FFA' && room.players.length >= 8) {
            socket.emit('error', 'Room is full');
            return;
        }

        const newPlayer = createPlayer(socket.id, playerName || `Player ${room.players.length + 1}`, false);

        let updatedRoom = {
            ...room,
            players: [...room.players, newPlayer]
        };

        // Link opponents for DUEL
        if (updatedRoom.gameMode === 'DUEL' && updatedRoom.players.length === 2) {
            const p1 = { ...updatedRoom.players[0], opponentId: updatedRoom.players[1].id };
            const p2 = { ...updatedRoom.players[1], opponentId: updatedRoom.players[0].id };
            updatedRoom = { ...updatedRoom, players: [p1, p2] };
        }

        rooms[roomId] = updatedRoom;
        socket.join(roomId);
        broadcastRoomUpdate(roomId, updatedRoom);
        console.log(`${socket.id} joined room ${roomId}`);
    });

    socket.on('set_ready', ({ roomId, isReady }: { roomId: string, isReady: boolean }) => {
        const room = rooms[roomId];
        if (!room) return;

        const updatedRoom = updatePlayerInRoom(room, socket.id, p => ({ ...p, isReady }));
        rooms[roomId] = updatedRoom;
        broadcastRoomUpdate(roomId, updatedRoom);
    });

    socket.on('update_settings', ({ roomId, settings }: { roomId: string, settings: RoomSettings }) => {
        const room = rooms[roomId];
        if (room && room.players[0].id === socket.id && room.gameState === GameState.Lobby) {
            const updatedRoom = { ...room, settings };
            rooms[roomId] = updatedRoom;
            broadcastRoomUpdate(roomId, updatedRoom);
        }
    });

    socket.on('start_game', ({ roomId }: { roomId: string }) => {
        const room = rooms[roomId];
        if (!room || room.players[0].id !== socket.id) return;

        let updatedRoom = { ...room, gameState: GameState.Playing, startTime: Date.now() };

        if (room.gameMode === 'FFA' || room.gameMode === 'SINGLE' || (room.gameMode === 'DUEL' && room.settings.duelModeType === 'CPU')) {
            updatedRoom.secretCode = generateSecretCode(room.settings.codeLength, room.settings.allowRepeats);
        }

        updatedRoom.players = updatedRoom.players.map(p => ({
            ...p,
            guesses: [],
            secretCode: (updatedRoom.gameMode === 'DUEL' && updatedRoom.settings.duelModeType === 'PVP') ? p.secretCode : undefined
        }));

        rooms[roomId] = updatedRoom;
        broadcastRoomUpdate(roomId, updatedRoom, 'game_start');
    });

    socket.on('set_duel_code', ({ roomId, code }: { roomId: string, code: string }) => {
        const room = rooms[roomId];
        if (!room) return;

        const updatedRoom = updatePlayerInRoom(room, socket.id, p => ({ ...p, secretCode: code }));
        rooms[roomId] = updatedRoom;
        broadcastRoomUpdate(roomId, updatedRoom);
    });

    socket.on('submit_guess', ({ roomId, guessCode }: { roomId: string, guessCode: string }) => {
        const room = rooms[roomId];
        if (!room || (room.gameState !== GameState.Playing && room.gameState !== GameState.Panic)) return;

        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;

        let secretToGuess = room.secretCode;
        if (room.gameMode === 'DUEL' && room.settings.duelModeType === 'PVP') {
            const opponent = room.players.find(p => p.id === player.opponentId);
            if (!opponent || !opponent.secretCode) return;
            secretToGuess = opponent.secretCode;
        }

        const { hits, pseudoHits } = calculateFeedback(guessCode, secretToGuess);
        const feedbackMessage = generateFeedbackMessage(hits, pseudoHits, room.settings.codeLength);

        const newGuess: Guess = {
            id: player.guesses.length + 1,
            code: guessCode,
            hits,
            pseudoHits,
            feedbackMessage,
            playerId: player.id,
            playerName: player.name,
        };

        let updatedRoom = updatePlayerInRoom(room, socket.id, p => ({
            ...p,
            guesses: [...p.guesses, newGuess]
        }));

        if (hits === room.settings.codeLength) {
            // Calculate Score
            const now = Date.now();
            const startTime = room.startTime || now; // Fallback to now if missing (shouldn't happen)
            const timeTakenSeconds = Math.floor((now - startTime) / 1000);

            const isPanicSolve = room.gameState === GameState.Panic;

            // Calculate initial guess time if this is the first guess
            let initialGuessTimeSeconds: number | undefined = undefined;
            if (player.guesses.length === 0) {
                initialGuessTimeSeconds = timeTakenSeconds;
            }

            const scoreBreakdown = calculateScore(
                updatedRoom.players.find(p => p.id === socket.id)!.guesses.length,
                timeTakenSeconds,
                isPanicSolve,
                initialGuessTimeSeconds,
                room.settings.codeLength
            );

            updatedRoom = updatePlayerInRoom(updatedRoom, socket.id, p => ({
                ...p,
                score: p.score + (room.gameMode === 'FFA' ? scoreBreakdown.total : 1), // Use new scoring only for FFA
                scoreBreakdown: room.gameMode === 'FFA' ? scoreBreakdown : undefined
            }));

            if (room.gameMode === 'FFA') {
                if (room.gameState !== GameState.Panic) {
                    // First solver! Trigger Panic Mode.
                    updatedRoom.gameState = GameState.Panic;
                    updatedRoom.panicStartTime = Date.now();

                    rooms[roomId] = updatedRoom; // SAVE TO GLOBAL STATE!
                    broadcastRoomUpdate(roomId, updatedRoom);

                    // Start 30s timer to end game
                    console.log(`[Panic] Starting 30s timer for room ${roomId}`);
                    setTimeout(() => {
                        const currentRoom = rooms[roomId];
                        console.log(`[Panic] Timer expired for room ${roomId}. Current state: ${currentRoom?.gameState}`);
                        if (currentRoom && currentRoom.gameState === GameState.Panic) {
                            currentRoom.gameState = GameState.Won;
                            broadcastRoomUpdate(roomId, currentRoom, 'game_over');
                            console.log(`[Panic] Game Over emitted for room ${roomId}`);
                        }
                    }, 30000);
                } else {
                    // Subsequent solver during panic
                    rooms[roomId] = updatedRoom; // Save score updates

                    // Check if ALL players have solved the code
                    const allPlayersSolved = updatedRoom.players.every(p =>
                        p.guesses.some(g => g.hits === room.settings.codeLength)
                    );

                    if (allPlayersSolved) {
                        updatedRoom.gameState = GameState.Won;
                        rooms[roomId] = updatedRoom;
                        broadcastRoomUpdate(roomId, updatedRoom, 'game_over');
                        console.log(`[Panic] All players solved! Ending game early for room ${roomId}`);
                    }
                }
            } else {
                // Duel or Single Player - End immediately
                updatedRoom.gameState = GameState.Won;
                rooms[roomId] = updatedRoom;
                broadcastRoomUpdate(roomId, updatedRoom, 'game_over');
            }
        } else {
            rooms[roomId] = updatedRoom;
            broadcastRoomUpdate(roomId, updatedRoom);
        }
    });

    socket.on('reset_game', ({ roomId }: { roomId: string }) => {
        const room = rooms[roomId];
        if (!room) return;

        // Reset game state to Lobby
        let updatedRoom = { ...room, gameState: GameState.Lobby, secretCode: '' };

        // Reset all players (keep scores and host)
        updatedRoom.players = updatedRoom.players.map(p => ({
            ...p,
            guesses: [],
            isReady: p.isHost, // Host should remain ready, others reset to false
            secretCode: undefined, // Clear secret code for next round
            scoreBreakdown: undefined
        }));

        rooms[roomId] = updatedRoom;
        broadcastRoomUpdate(roomId, updatedRoom);
    });

    socket.on('leave_room', ({ roomId }: { roomId: string }) => {
        const room = rooms[roomId];
        if (!room) return;

        console.log(`User ${socket.id} leaving room ${roomId}`);

        // Remove player from room
        const updatedPlayers = room.players.filter(p => p.id !== socket.id);

        if (updatedPlayers.length === 0) {
            delete rooms[roomId];
            console.log(`Room ${roomId} deleted (empty)`);
        } else {
            // Update room with remaining players
            // If host left, assign new host
            if (room.players.find(p => p.id === socket.id)?.isHost && updatedPlayers.length > 0) {
                updatedPlayers[0].isHost = true;
            }

            let updatedRoom = { ...room, players: updatedPlayers };

            // If duel, reset opponentId if one player leaves
            if (updatedRoom.gameMode === 'DUEL') {
                updatedRoom.players = updatedRoom.players.map(p => ({ ...p, opponentId: undefined }));
            }

            rooms[roomId] = updatedRoom;
            broadcastRoomUpdate(roomId, updatedRoom);
            const leavingPlayer = room.players.find(p => p.id === socket.id);
            if (leavingPlayer) {
                io.to(roomId).emit('player_left', { name: leavingPlayer.name });
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);

        // Find the room the player was in
        let roomIdToDelete: string | null = null;

        Object.keys(rooms).forEach(roomId => {
            const room = rooms[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);

            if (playerIndex !== -1) {
                // Remove player from room
                const updatedPlayers = room.players.filter(p => p.id !== socket.id);

                if (updatedPlayers.length === 0) {
                    roomIdToDelete = roomId;
                } else {
                    // Update room with remaining players
                    // If host left, assign new host (optional, for now just pick first)
                    if (room.players[playerIndex].isHost && updatedPlayers.length > 0) {
                        updatedPlayers[0].isHost = true;
                    }

                    const updatedRoom = { ...room, players: updatedPlayers };

                    // If duel, reset opponentId if one player leaves
                    if (updatedRoom.gameMode === 'DUEL') {
                        updatedRoom.players = updatedRoom.players.map(p => ({ ...p, opponentId: undefined }));
                    }

                    rooms[roomId] = updatedRoom;
                    broadcastRoomUpdate(roomId, updatedRoom);
                    io.to(roomId).emit('player_left', { name: room.players[playerIndex].name });
                }
            }
        });

        if (roomIdToDelete) {
            delete rooms[roomIdToDelete];
            console.log(`Room ${roomIdToDelete} deleted (empty)`);
        }
    });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
