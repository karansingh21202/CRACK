export interface Feedback {
    hits: number;
    pseudoHits: number;
}
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
}

export type GameMode = 'FFA' | 'DUEL' | 'SINGLE';

export interface RoomSettings {
    codeLength: number;
    allowRepeats: boolean;
    duelModeType?: 'PVP' | 'CPU';
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
    scoreBreakdown?: {
        base: number;
        efficiency: number;
        speed: number;
        total: number;
    };
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
}
