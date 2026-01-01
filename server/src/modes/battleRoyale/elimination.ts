import { Player } from '../../types';

interface PlayerScore {
    playerId: string;
    bestHits: number;
    guessCount: number;
    solved: boolean;
}

/**
 * Calculate elimination percentage based on current round
 * Early rounds: 20%, Later rounds: 25-30%
 */
export function getEliminationRate(round: number): number {
    if (round <= 2) return 0.20; // 20%
    if (round <= 4) return 0.25; // 25%
    return 0.30; // 30%
}

/**
 * Determine which players should be eliminated this round
 * @param playerScores - Array of player performance this round
 * @param round - Current round number
 * @returns Array of player IDs to eliminate
 */
export function getPlayersToEliminate(
    playerScores: PlayerScore[],
    round: number
): string[] {
    // Players who solved are safe
    const survivors = playerScores.filter(p => p.solved);
    const nonSolvers = playerScores.filter(p => !p.solved);

    // If everyone solved or no one solved, eliminate based on performance
    if (nonSolvers.length === 0) {
        // All solved - no one eliminated this round
        return [];
    }

    // Sort non-solvers by performance (worst first)
    // Lower hits = worse. If same hits, more guesses = worse
    nonSolvers.sort((a, b) => {
        if (a.bestHits !== b.bestHits) return a.bestHits - b.bestHits;
        return b.guessCount - a.guessCount; // More guesses = worse
    });

    // Calculate how many to eliminate
    const eliminationRate = getEliminationRate(round);
    const totalPlayers = playerScores.length;
    const eliminateCount = Math.max(1, Math.floor(totalPlayers * eliminationRate));

    // Don't eliminate more than non-solvers
    const actualEliminate = Math.min(eliminateCount, nonSolvers.length);

    // Take the worst performers
    return nonSolvers.slice(0, actualEliminate).map(p => p.playerId);
}

/**
 * Check if we should enter finals (2 or fewer players left)
 */
export function shouldEnterFinals(alivePlayers: number): boolean {
    return alivePlayers <= 2;
}

/**
 * Get the placement for an eliminated player
 * @param alivePlayers - Number of players still alive when this player was eliminated
 */
export function getPlacement(alivePlayers: number): number {
    return alivePlayers + 1;
}
