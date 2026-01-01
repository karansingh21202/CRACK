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

app.get('/', (req, res) => {
    res.send('Crack Code Server Running 🚀');
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins for dev, restrict in prod
        methods: ["GET", "POST"]
    }
});

// --- GAME STATE ---
const rooms: { [key: string]: Room } = {};
const disconnectionTimers: Map<string, NodeJS.Timeout> = new Map();
const BOT_NAMES = ['Cipher', 'Logic', 'Glitch', 'Binary'];

// --- HELPERS ---
const createPlayer = (id: string, name: string, isHost: boolean = false, isBot: boolean = false, sessionId?: string): Player => ({
    id, name, isHost, isReady: isHost || isBot, guesses: [], isBot, score: 0, sessionId, speedRunScore: 0
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

    socket.on('create_room', ({ gameMode, playerName, sessionId, timerDuration, codeLength }: { gameMode: GameMode, playerName: string, sessionId?: string, timerDuration?: number, codeLength?: number }) => {
        const roomId = Math.random().toString(36).substr(2, 4).toUpperCase();
        const player = createPlayer(socket.id, playerName || 'Player 1', true, false, sessionId);
        let players = [player];

        const settings: RoomSettings = {
            codeLength: codeLength || 4,
            allowRepeats: false,
            duelModeType: gameMode === 'DUEL' ? 'PVP' : undefined,
            timerDurationSeconds: gameMode === 'SPEED_RUN' ? (timerDuration || 180) : undefined
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

        // Initialize Battle Royale state if BR mode
        if (gameMode === 'BATTLE_ROYALE') {
            const { createInitialBRState } = require('./modes/battleRoyale/roundManager');
            newRoom.battleRoyaleState = createInitialBRState(1); // Will be updated when game starts
        }

        rooms[roomId] = newRoom;
        socket.join(roomId);
        broadcastRoomUpdate(roomId, newRoom);
        console.log(`Room ${roomId} created by ${socket.id} (mode: ${gameMode})`);
    });

    socket.on('join_room', ({ roomId, playerName, sessionId }: { roomId: string, playerName: string, sessionId?: string }) => {
        const room = rooms[roomId];
        if (!room) {
            socket.emit('error', 'Room not found');
            return;
        }

        // Check for RECONNECTION via Session ID
        if (sessionId) {
            const existingPlayerIndex = room.players.findIndex(p => p.sessionId === sessionId);
            if (existingPlayerIndex !== -1) {
                const oldSocketId = room.players[existingPlayerIndex].id;

                // Cancel disconnection timer if exists
                if (disconnectionTimers.has(oldSocketId)) {
                    clearTimeout(disconnectionTimers.get(oldSocketId));
                    disconnectionTimers.delete(oldSocketId);
                    console.log(`Cancelled disconnection timer for ${oldSocketId} (Reconnected as ${socket.id})`);
                }

                // Update Player Connection
                const updatedPlayers = [...room.players];
                updatedPlayers[existingPlayerIndex] = {
                    ...updatedPlayers[existingPlayerIndex],
                    id: socket.id, // Update to new socket ID
                    disconnectedAt: undefined // Clear disconnection flag
                };

                const updatedRoom = { ...room, players: updatedPlayers };
                rooms[roomId] = updatedRoom;

                socket.join(roomId);
                broadcastRoomUpdate(roomId, updatedRoom);
                console.log(`Player reconnected: ${sessionId} -> ${socket.id}`);
                return;
            }
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

        const newPlayer = createPlayer(socket.id, playerName || `Player ${room.players.length + 1}`, false, false, sessionId);

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

        // Handle Speed Run Timer
        if (room.gameMode === 'SPEED_RUN') {
            const duration = room.settings.timerDurationSeconds || 180; // Default 3 mins
            updatedRoom.gameEndTime = Date.now() + (duration * 1000);

            // Set timeout to end game
            setTimeout(() => {
                const currentRoom = rooms[roomId];
                if (currentRoom && currentRoom.gameState === GameState.Playing) {
                    currentRoom.gameState = GameState.Won; // Or 'Finished'
                    broadcastRoomUpdate(roomId, currentRoom, 'game_over');
                }
            }, duration * 1000);
        }

        // Handle Battle Royale initialization
        if (room.gameMode === 'BATTLE_ROYALE') {
            const { createInitialBRState, advanceRound, isGameOver } = require('./modes/battleRoyale/roundManager');
            const { getPlayersToEliminate, getPlacement } = require('./modes/battleRoyale/elimination');
            const brState = createInitialBRState(room.players.length);
            updatedRoom.battleRoyaleState = brState;

            // BR Round End Handler Function
            const handleBRRoundEnd = (currentRoomId: string) => {
                const currentRoom = rooms[currentRoomId];
                if (!currentRoom || currentRoom.gameState !== GameState.Playing) return;
                if (currentRoom.gameMode !== 'BATTLE_ROYALE' || !currentRoom.battleRoyaleState) return;

                const brState = currentRoom.battleRoyaleState;

                // Collect player performance for this round
                const playerScores = currentRoom.players
                    .filter(p => !p.isBot) // Exclude bots if any
                    .map(p => {
                        const bestGuess = p.guesses.reduce((best, g) =>
                            g.hits > best.hits ? g : best,
                            { hits: 0, pseudoHits: 0 }
                        );
                        return {
                            playerId: p.id,
                            bestHits: bestGuess.hits,
                            guessCount: p.guesses.length,
                            solved: p.guesses.some((g: any) => g.solved === true)
                        };
                    });

                // Determine who to eliminate
                const toEliminate = getPlayersToEliminate(playerScores, brState.round);
                const alivePlayers = currentRoom.players.length - toEliminate.length;

                // Emit elimination events to eliminated players
                toEliminate.forEach((playerId: string) => {
                    const placement = getPlacement(alivePlayers);
                    io.to(playerId).emit('br_eliminated', {
                        placement,
                        totalPlayers: currentRoom.players.length,
                        roundEliminated: brState.round,
                        stats: {
                            roundsSurvived: brState.round,
                            totalRounds: brState.round, // So far
                            codesGuessed: playerScores.find(p => p.playerId === playerId)?.solved ? 1 : 0,
                            totalGuesses: playerScores.find(p => p.playerId === playerId)?.guessCount || 0,
                            gameDuration: Math.floor((Date.now() - (currentRoom.startTime || Date.now())) / 1000)
                        }
                    });
                });

                // Remove eliminated players from active game
                let updatedPlayers = currentRoom.players.filter(p => !toEliminate.includes(p.id));

                // Check for game over (1 or 0 players left)
                if (isGameOver(updatedPlayers.length)) {
                    // Game over - declare winner
                    const winner = updatedPlayers[0];
                    if (winner) {
                        const winnerStats = playerScores.find(p => p.playerId === winner.id);
                        io.to(currentRoomId).emit('br_game_over', {
                            winnerId: winner.id,
                            winnerName: winner.name,
                            placement: 1,
                            totalPlayers: currentRoom.players.length,
                            stats: {
                                roundsSurvived: brState.round,
                                totalRounds: brState.round,
                                codesGuessed: winnerStats?.solved ? brState.round : brState.round - 1,
                                totalGuesses: winnerStats?.guessCount || 0,
                                gameDuration: Math.floor((Date.now() - (currentRoom.startTime || Date.now())) / 1000)
                            }
                        });
                    }

                    currentRoom.gameState = GameState.Won;
                    rooms[currentRoomId] = currentRoom;
                    broadcastRoomUpdate(currentRoomId, currentRoom, 'game_over');
                    return;
                }

                // Advance to next round
                const newBrState = advanceRound(brState, updatedPlayers.length, toEliminate);

                // Reset guesses for surviving players
                updatedPlayers = updatedPlayers.map(p => ({ ...p, guesses: [] }));

                const updatedRoom = {
                    ...currentRoom,
                    players: updatedPlayers,
                    battleRoyaleState: newBrState
                };
                rooms[currentRoomId] = updatedRoom;

                // Broadcast round results
                io.to(currentRoomId).emit('br_round_end', {
                    roomId: currentRoomId,
                    eliminated: toEliminate,
                    playersAlive: updatedPlayers.length,
                    nextRound: newBrState.round,
                    nextCodeLength: newBrState.codeLength,
                    nextDuration: newBrState.roundDuration
                });

                // Schedule next round start after brief delay
                setTimeout(() => {
                    io.to(currentRoomId).emit('br_round_start', {
                        round: newBrState.round,
                        codeLength: newBrState.codeLength,
                        duration: newBrState.roundDuration,
                        playersAlive: updatedPlayers.length
                    });

                    // Schedule next round end
                    setTimeout(() => handleBRRoundEnd(currentRoomId), newBrState.roundDuration * 1000);
                }, 5000); // 5 second break between rounds

                broadcastRoomUpdate(currentRoomId, updatedRoom);
            };

            // Set initial round timer
            setTimeout(() => handleBRRoundEnd(roomId), brState.roundDuration * 1000);
        }

        if (room.gameMode === 'FFA' || room.gameMode === 'SINGLE' || (room.gameMode === 'DUEL' && room.settings.duelModeType === 'CPU')) {
            updatedRoom.secretCode = generateSecretCode(room.settings.codeLength, room.settings.allowRepeats);
        }

        updatedRoom.players = updatedRoom.players.map(p => ({
            ...p,
            guesses: [],
            // In Speed Run, everyone gets their OWN secret code initially
            secretCode: (room.gameMode === 'SPEED_RUN')
                ? generateSecretCode(room.settings.codeLength, room.settings.allowRepeats)
                : ((updatedRoom.gameMode === 'DUEL' && updatedRoom.settings.duelModeType === 'PVP') ? p.secretCode : undefined)
        }));

        rooms[roomId] = updatedRoom;

        // For BR, also emit the BR state
        if (room.gameMode === 'BATTLE_ROYALE') {
            io.to(roomId).emit('br_game_start', {
                round: updatedRoom.battleRoyaleState?.round,
                codeLength: updatedRoom.battleRoyaleState?.codeLength,
                roundDuration: updatedRoom.battleRoyaleState?.roundDuration,
                playersAlive: updatedRoom.battleRoyaleState?.playersAlive
            });
        }

        broadcastRoomUpdate(roomId, updatedRoom, 'game_start');
    });

    socket.on('set_duel_code', ({ roomId, code }: { roomId: string, code: string }) => {
        const room = rooms[roomId];
        if (!room) return;

        const updatedRoom = updatePlayerInRoom(room, socket.id, p => ({ ...p, secretCode: code }));
        rooms[roomId] = updatedRoom;
        broadcastRoomUpdate(roomId, updatedRoom);
    });

    // ============================================
    // BATTLE ROYALE: Color Guess Submission
    // ============================================
    socket.on('br_submit_guess', ({ roomId, colors }: { roomId: string, colors: string[] }) => {
        const room = rooms[roomId];
        if (!room || room.gameState !== GameState.Playing) return;
        if (room.gameMode !== 'BATTLE_ROYALE' || !room.battleRoyaleState) return;

        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;

        const brState = room.battleRoyaleState;
        const secretCode = brState.colorCode;

        // Check if player already solved this round (prevent spam)
        const alreadySolved = player.guesses.some((g: any) => g.solved === true);
        if (alreadySolved) {
            console.log(`[BR] Player ${socket.id} already solved this round. Ignoring.`);
            return;
        }

        // Evaluate guess using colorCode utility
        const { evaluateColorGuess } = require('./modes/battleRoyale/colorCode');
        const { hits, pseudoHits } = evaluateColorGuess(colors, secretCode);
        const solved = hits === secretCode.length;

        // Create guess record
        const feedbackMsg = solved
            ? 'Perfect! You cracked it!'
            : hits > 0
                ? `${hits} exact, ${pseudoHits} close`
                : pseudoHits > 0
                    ? `${pseudoHits} close`
                    : 'No matches';

        const newGuess = {
            id: player.guesses.length + 1,
            code: colors.join(''),
            colors: colors,
            hits,
            pseudoHits,
            feedbackMessage: feedbackMsg,
            solved,
            playerId: player.id,
            playerName: player.name,
            timestamp: Date.now()
        };

        // Update player with new guess
        const updatedRoom = updatePlayerInRoom(room, socket.id, p => ({
            ...p,
            guesses: [...p.guesses, newGuess]
        }));
        rooms[roomId] = updatedRoom;

        // Send result back to player
        socket.emit('br_guess_result', {
            colors,
            hits,
            pseudoHits,
            solved
        });

        // If solved, notify everyone
        if (solved) {
            io.to(roomId).emit('br_player_solved', {
                playerId: player.id,
                playerName: player.name,
                guessCount: player.guesses.length + 1
            });
        }

        // Broadcast player progress to room (for live updates)
        const playerProgress = updatedRoom.players.map(p => ({
            id: p.id,
            name: p.name,
            guessCount: p.guesses.length,
            hasSolved: p.guesses.some((g: any) => g.solved === true)
        }));
        io.to(roomId).emit('br_player_progress', { players: playerProgress });
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
        } else if (room.gameMode === 'SPEED_RUN') {
            // Speed Run: Player guesses their OWN allocated code
            if (!player.secretCode) return;
            secretToGuess = player.secretCode;
        }
        // Now secretToGuess is set for ALL modes - process the guess

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
            // ANTI-SPAM: Check if player already solved this round (prevents duplicate scoring)
            // Universal protection for ALL game modes
            const alreadySolved = player.guesses.some(g => g.hits === room.settings.codeLength);
            if (alreadySolved) {
                // Player already cracked - ignore duplicate submissions
                console.log(`[AntiSpam] Player ${socket.id} tried to re-submit correct code in ${room.gameMode}. Ignoring.`);
                rooms[roomId] = updatedRoom; // Still save the guess for history
                broadcastRoomUpdate(roomId, updatedRoom);
                return;
            }

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
            } else if (room.gameMode === 'SPEED_RUN') {
                // --- SPEED RUN LOGIC ---
                // 1. Increment Speed Score
                const currentSpeedScore = (player.speedRunScore || 0) + 1;

                // 2. Generate NEW Secret Code for this player
                const newSecretCode = generateSecretCode(room.settings.codeLength, room.settings.allowRepeats);

                updatedRoom = updatePlayerInRoom(updatedRoom, socket.id, p => ({
                    ...p,
                    speedRunScore: currentSpeedScore,
                    secretCode: newSecretCode,
                    guesses: [] // Clear guesses for the new round
                }));

                rooms[roomId] = updatedRoom;
                // Send specific event so frontend knows to show "Success" animation
                io.to(roomId).emit('speed_run_success', { playerId: socket.id, newScore: currentSpeedScore });
                broadcastRoomUpdate(roomId, updatedRoom);

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

        // Have socket leave the room channel
        socket.leave(roomId);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);

        // Find the room the player was in
        Object.keys(rooms).forEach(roomId => {
            const room = rooms[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);

            if (playerIndex !== -1) {
                const player = room.players[playerIndex];

                // 1. Mark as disconnected immediately
                const updatedPlayersAsDisconnected = [...room.players];
                updatedPlayersAsDisconnected[playerIndex] = { ...player, disconnectedAt: Date.now() };
                rooms[roomId] = { ...room, players: updatedPlayersAsDisconnected };

                // Broadcast "Disconnected" state (Player stays in list)
                broadcastRoomUpdate(roomId, rooms[roomId]);

                // 2. Start 90s Grace Period Timer
                const timer = setTimeout(() => {
                    // Fetch fresh state
                    const currentRoom = rooms[roomId];
                    if (!currentRoom) return;

                    // Execute Removal Logic
                    console.log(`Connection timeout for ${socket.id}. Removing from room ${roomId}.`);

                    const remainingPlayers = currentRoom.players.filter(p => p.id !== socket.id);

                    if (remainingPlayers.length === 0) {
                        delete rooms[roomId];
                        console.log(`Room ${roomId} deleted (empty)`);
                    } else {
                        // Reassign Host if needed
                        if (player.isHost && remainingPlayers.length > 0) {
                            remainingPlayers[0].isHost = true;
                        }

                        let updatedRoom = { ...currentRoom, players: remainingPlayers };

                        // Reset Duel Opponents
                        if (updatedRoom.gameMode === 'DUEL') {
                            updatedRoom.players = updatedRoom.players.map(p => ({ ...p, opponentId: undefined }));
                        }

                        rooms[roomId] = updatedRoom;
                        broadcastRoomUpdate(roomId, updatedRoom);
                        io.to(roomId).emit('player_left', { name: player.name });
                    }

                    disconnectionTimers.delete(socket.id);

                }, 90000); // 90 Seconds Timeout

                disconnectionTimers.set(socket.id, timer);
            }
        });
    });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
