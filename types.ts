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
  Lost, // Kept for potential future modes
}

export type Theme = 'light' | 'dark';

// Multiplayer Types
export type Screen = 'landing' | 'lobby' | 'game' | 'duel-setup';

export interface Player {
  id: string;
  name:string;
  isHost: boolean;
  isReady: boolean;
  guesses: Guess[];
  isBot?: boolean;
  secretCode?: string; // For duel mode
  opponentId?: string; // For duel mode
}

export type GameMode = 'FFA' | 'DUEL' | 'SINGLE';

export interface RoomSettings {
    codeLength: number;
    allowRepeats: boolean;
}

export interface Room {
  id: string;
  players: Player[];
  gameMode: GameMode;
  gameState: GameState;
  // secretCode is for FFA/Single Player. In Duel, codes are on the Player object.
  secretCode: string; 
  settings: RoomSettings;
}