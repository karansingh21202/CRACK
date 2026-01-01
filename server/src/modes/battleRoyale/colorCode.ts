import { ColorCode } from '../../types';

// Available colors for BR mode
export const COLORS: ColorCode[] = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'BLACK'];

/**
 * Generate a random color code for Battle Royale
 * @param length - Number of colors in the code (4, 5, or 6)
 * @param allowRepeats - Whether colors can repeat
 */
export function generateColorCode(length: number, allowRepeats: boolean = true): ColorCode[] {
    const code: ColorCode[] = [];
    const available = [...COLORS];

    for (let i = 0; i < length; i++) {
        if (allowRepeats) {
            const randomIndex = Math.floor(Math.random() * COLORS.length);
            code.push(COLORS[randomIndex]);
        } else {
            if (available.length === 0) break;
            const randomIndex = Math.floor(Math.random() * available.length);
            code.push(available[randomIndex]);
            available.splice(randomIndex, 1);
        }
    }

    return code;
}

/**
 * Evaluate a guess against the secret code
 * @param guess - Player's guessed colors
 * @param secret - The secret code
 * @returns Number of exact hits (correct color in correct position)
 */
export function evaluateColorGuess(guess: ColorCode[], secret: ColorCode[]): { hits: number; pseudoHits: number } {
    let hits = 0;
    let pseudoHits = 0;

    const secretCopy = [...secret];
    const guessCopy = [...guess];

    // First pass: exact hits
    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === secret[i]) {
            hits++;
            secretCopy[i] = null as any;
            guessCopy[i] = null as any;
        }
    }

    // Second pass: pseudo-hits (right color, wrong position)
    for (let i = 0; i < guessCopy.length; i++) {
        if (guessCopy[i] === null) continue;

        const secretIndex = secretCopy.indexOf(guessCopy[i]);
        if (secretIndex !== -1) {
            pseudoHits++;
            secretCopy[secretIndex] = null as any;
        }
    }

    return { hits, pseudoHits };
}

/**
 * Check if player solved the code
 */
export function isSolved(hits: number, codeLength: number): boolean {
    return hits === codeLength;
}
