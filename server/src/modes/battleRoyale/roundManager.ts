import { BattleRoyaleState, ColorCode } from '../../types';
import { generateColorCode } from './colorCode';

// Round configuration: [codeLength, durationSeconds]
const ROUND_CONFIG: [number, number][] = [
    [4, 90],  // Round 1: 4 colors, 90 seconds
    [4, 75],  // Round 2: 4 colors, 75 seconds
    [5, 60],  // Round 3: 5 colors, 60 seconds
    [5, 45],  // Round 4: 5 colors, 45 seconds
    [6, 30],  // Round 5+: 6 colors, 30 seconds
];

/**
 * Get configuration for a specific round
 */
export function getRoundConfig(round: number): { codeLength: number; duration: number } {
    const index = Math.min(round - 1, ROUND_CONFIG.length - 1);
    const [codeLength, duration] = ROUND_CONFIG[index];
    return { codeLength, duration };
}

/**
 * Create initial Battle Royale state
 */
export function createInitialBRState(totalPlayers: number): BattleRoyaleState {
    const config = getRoundConfig(1);

    return {
        round: 1,
        playersAlive: totalPlayers,
        roundEndTime: Date.now() + (config.duration * 1000),
        roundDuration: config.duration,
        eliminatedThisRound: [],
        codeLength: config.codeLength,
        colorCode: generateColorCode(config.codeLength)
    };
}

/**
 * Advance to the next round
 */
export function advanceRound(
    currentState: BattleRoyaleState,
    playersAlive: number,
    eliminatedIds: string[]
): BattleRoyaleState {
    const nextRound = currentState.round + 1;
    const config = getRoundConfig(nextRound);

    return {
        round: nextRound,
        playersAlive,
        roundEndTime: Date.now() + (config.duration * 1000),
        roundDuration: config.duration,
        eliminatedThisRound: eliminatedIds,
        codeLength: config.codeLength,
        colorCode: generateColorCode(config.codeLength)
    };
}

/**
 * Check if game is over (1 player left = winner)
 */
export function isGameOver(playersAlive: number): boolean {
    return playersAlive <= 1;
}

/**
 * Check if it's finals time (2 players left)
 */
export function isFinals(playersAlive: number): boolean {
    return playersAlive === 2;
}
