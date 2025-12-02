export interface ScoreBreakdown {
    base: number;
    efficiency: number;
    speed: number;
    total: number;
}

export const SCORING_CONFIG = {
    BASE_SCORE: 500,
    EFFICIENCY_PER_GUESS: 100,
    SPEED_PER_SECOND: 2,
    MAX_GUESSES_PAR: 10,
    MAX_TIME_PAR_SECONDS: 300, // 5 minutes
    MIN_TIME_THRESHOLD: 5, // Minimum seconds to be considered "genuine" thinking
    PANIC_SPEED_PENALTY: 0.5, // 50% speed score reduction if solved during Panic Mode

    // New: Anti-cheat for delayed first guess
    INITIAL_GUESS_SUSPICIOUS_SECONDS: 3,      // isse zyada time liya to suspicious
    INITIAL_GUESS_PENALTY_PER_SECOND: 10,     // har extra second pe base se kitna minus
    MAX_INITIAL_GUESS_PENALTY: 300            // max base cut cap
};

export const calculateScore = (
    guessesTaken: number,
    timeTakenSeconds: number,
    isPanicSolve: boolean = false,
    initialGuessTimeSeconds?: number, // ⬅️ game start se first guess tak ka time
    codeLength: number = 4 // Default to 4 if not provided
): ScoreBreakdown => {
    const {
        BASE_SCORE,
        EFFICIENCY_PER_GUESS,
        SPEED_PER_SECOND,
        MAX_TIME_PAR_SECONDS,
        MIN_TIME_THRESHOLD,
        PANIC_SPEED_PENALTY,
        INITIAL_GUESS_SUSPICIOUS_SECONDS,
        INITIAL_GUESS_PENALTY_PER_SECOND,
        MAX_INITIAL_GUESS_PENALTY
    } = SCORING_CONFIG;

    // Dynamic Par: More digits = more allowed guesses
    // 4 digits -> 12 guesses
    // 6 digits -> 18 guesses
    const MAX_GUESSES_PAR = codeLength * 3;

    // 1) Base score + first-guess delay penalty
    let base = BASE_SCORE;

    // Agar first guess bohot late aaya ho (cheaty vibes) to base se cut karo
    if (
        typeof initialGuessTimeSeconds === "number" &&
        initialGuessTimeSeconds > INITIAL_GUESS_SUSPICIOUS_SECONDS
    ) {
        const extraSeconds = initialGuessTimeSeconds - INITIAL_GUESS_SUSPICIOUS_SECONDS;

        const penalty = Math.min(
            Math.floor(extraSeconds * INITIAL_GUESS_PENALTY_PER_SECOND),
            MAX_INITIAL_GUESS_PENALTY
        );

        base = Math.max(0, base - penalty);
    }

    // 2) Efficiency: fewer guesses = more reward
    let efficiencyMultiplier = 1;

    // Instant / near-instant solve → luck/spam → efficiency ka half
    if (timeTakenSeconds < MIN_TIME_THRESHOLD) {
        efficiencyMultiplier = 0.5;
    }

    // Calculate Efficiency
    // If guessesTaken > Par, this becomes negative. We clamp it to 0.
    // Example: Par 12, Taken 1 -> (11 * 100) = 1100 pts
    // Example: Par 12, Taken 12 -> (0 * 100) = 0 pts
    // Example: Par 12, Taken 20 -> (-8 * 100) = -800 -> 0 pts (Spamming punished)
    const savedGuesses = MAX_GUESSES_PAR - guessesTaken;
    let efficiency = Math.floor(savedGuesses * EFFICIENCY_PER_GUESS * efficiencyMultiplier);
    efficiency = Math.max(30, efficiency); 

    // 3) Speed: finish faster than Par → more reward
    const timeSaved = Math.max(30, MAX_TIME_PAR_SECONDS - timeTakenSeconds);
    let speed = timeSaved * SPEED_PER_SECOND;

    // Panic mode solve → speed reward cut
    if (isPanicSolve) {
        speed = Math.floor(speed * PANIC_SPEED_PENALTY);
    }

    const total = base + efficiency + speed;

    return {
        base,
        efficiency,
        speed,
        total
    };
};
