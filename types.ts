export type Theme = 'light' | 'dark';

export type Screen = 'landing' | 'lobby' | 'game' | 'duel-setup';

// Re-export shared types from server
export type {
  Player,
  Room,
  GameMode,
  Guess,
  RoomSettings,
  Feedback
} from './server/src/types';

// Ensure GameState enum is available for value usage if needed (re-exporting as value)
export { GameState } from './server/src/types';