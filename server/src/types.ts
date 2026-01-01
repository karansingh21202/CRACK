export interface Feedback {
    hits: number;
    pseudoHits: number;
}

export interface Guess extends Feedback {
    id: number;
    code: string;
    feedbackMessage: string;
    playerId?: string;
    playerName?: string;
}

export enum GameState {
    Lobby,
    Playing,
    Won,
    Lost,
    Panic, // New state for 30s countdown
    Eliminated, // For Battle Royale - player knocked out
}

export type GameMode = 'FFA' | 'DUEL' | 'SINGLE' | 'SPEED_RUN' | 'BATTLE_ROYALE';

// Colors for Battle Royale mode
export type ColorCode = 'RED' | 'BLUE' | 'GREEN' | 'YELLOW' | 'PURPLE' | 'BLACK';

// Battle Royale specific state
export interface BattleRoyaleState {
    round: number;               // Current round (1, 2, 3...)
    playersAlive: number;        // Players still in game
    roundEndTime: number;        // Timestamp when round ends
    roundDuration: number;       // Seconds for current round
    eliminatedThisRound: string[]; // Player IDs eliminated
    codeLength: number;          // Current code length (4, 5, 6)
    colorCode: ColorCode[];      // Current code to guess
}

export interface RoomSettings {
    codeLength: number;
    allowRepeats: boolean;
    duelModeType?: 'PVP' | 'CPU';
    timerDurationSeconds?: number;
}

export interface Player {
    id: string;
    name: string;
    isHost: boolean;
    isReady: boolean;
    guesses: Guess[];
    isBot?: boolean;
    secretCode?: string;
    opponentId?: string;
    score: number;
    speedRunScore?: number; // Total codes cracked in Speed Run
    sessionId?: string;
    disconnectedAt?: number;
    scoreBreakdown?: {
        base: number;
        efficiency: number;
        speed: number;
        total: number;
        panicPenalty?: number;
    };
    role?: 'DETECTIVE' | 'SABOTEUR'; // Future proofing
}

export interface Room {
    id: string;
    players: Player[];
    gameMode: GameMode;
    gameState: GameState;
    // secretCode is for FFA/Single Player. In Duel, codes are on the Player object.
    secretCode: string;
    settings: RoomSettings;
    panicStartTime?: number; // Timestamp when panic mode started
    startTime?: number; // Timestamp when game started (for speed scoring)
    gameEndTime?: number; // Timestamp when game ends (for Speed Run)
    battleRoyaleState?: BattleRoyaleState; // BR-specific state
}
