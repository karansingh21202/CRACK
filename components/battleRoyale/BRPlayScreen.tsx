import React, { useState } from 'react';
import { FaUsers, FaArrowLeft, FaCrown, FaFire, FaCheck, FaCircle, FaQuestionCircle } from 'react-icons/fa';
import { BRRulesModal } from './BRRulesModal';

// Color definitions
const COLORS = [
    { key: 'RED', hex: '#EF4444', name: 'Red' },
    { key: 'BLUE', hex: '#3B82F6', name: 'Blue' },
    { key: 'GREEN', hex: '#22C55E', name: 'Green' },
    { key: 'YELLOW', hex: '#EAB308', name: 'Yellow' },
    { key: 'PURPLE', hex: '#A855F7', name: 'Purple' },
    { key: 'BLACK', hex: '#374151', name: 'Black' },
];

interface ColorGuess {
    colors: string[];
    hits: number;
    pseudoHits: number;
}

interface PlayerProgress {
    id: string;
    name: string;
    guessCount: number;
    hasSolved: boolean;
}

interface BRPlayScreenProps {
    roomId: string;
    playerCount: number;
    codeLength: number;
    roundNumber: number;
    timeLeft: number;
    onSubmitGuess: (colors: string[]) => void;
    onLeave: () => void;
    guessHistory: ColorGuess[];
    otherPlayers?: PlayerProgress[];
    hasSolved?: boolean;
}

export const BRPlayScreen: React.FC<BRPlayScreenProps> = ({
    roomId,
    playerCount,
    codeLength,
    roundNumber,
    timeLeft,
    onSubmitGuess,
    onLeave,
    guessHistory,
    otherPlayers = [],
    hasSolved = false
}) => {
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showRulesModal, setShowRulesModal] = useState(false);

    const handleColorClick = (colorKey: string) => {
        if (selectedColors.length < codeLength && !hasSolved && !isSubmitting) {
            const newColors = [...selectedColors, colorKey];
            setSelectedColors(newColors);

            // Auto-submit when all colors are selected
            if (newColors.length === codeLength) {
                // Set isSubmitting IMMEDIATELY to prevent double-clicks
                setIsSubmitting(true);

                setTimeout(() => {
                    onSubmitGuess(newColors);
                    setSelectedColors([]);
                    setTimeout(() => setIsSubmitting(false), 300);
                }, 150); // Brief delay for visual feedback
            }
        }
    };

    const handleSlotClick = (index: number) => {
        if (selectedColors[index] && !hasSolved && !isSubmitting) {
            setSelectedColors(selectedColors.filter((_, i) => i !== index));
        }
    };

    // Manual submit handler (backup, mostly disabled by auto-submit)
    const handleSubmit = () => {
        if (selectedColors.length === codeLength && !isSubmitting && !hasSolved) {
            setIsSubmitting(true);
            onSubmitGuess(selectedColors);
            setSelectedColors([]);
            setTimeout(() => setIsSubmitting(false), 300);
        }
    };

    const getColor = (key: string) => COLORS.find(c => c.key === key);
    const canSubmit = selectedColors.length === codeLength && !isSubmitting && !hasSolved;
    const latestGuess = guessHistory.length > 0 ? guessHistory[guessHistory.length - 1] : null;

    return (
        <div className="w-full h-full flex flex-col bg-gradient-to-br from-[#0a0a0f] via-[#0f1a2e] to-[#0a0a0f] overflow-hidden pb-safe">

            {/* Header */}
            <div className="flex items-center justify-between p-3 md:p-4 border-b border-cyan-500/20 shrink-0">
                <button onClick={onLeave} className="text-white/40 hover:text-white transition-colors p-2">
                    <FaArrowLeft size={16} />
                </button>

                <div className="flex items-center gap-3 md:gap-6">
                    <div className="text-center">
                        <p className="text-[8px] md:text-[10px] text-white/40 uppercase">Round</p>
                        <p className="text-lg md:text-2xl font-black text-cyan-400">{roundNumber}</p>
                    </div>

                    <div className={`px-4 md:px-6 py-2 md:py-3 rounded-xl border ${timeLeft <= 10 ? 'border-red-500 bg-red-500/10' : 'border-cyan-500/30 bg-black/40'
                        }`}>
                        <span className={`text-2xl md:text-3xl font-black font-mono ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'
                            }`}>
                            {timeLeft}s
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-white/60">
                        <FaUsers size={16} />
                        <span className="font-bold text-base md:text-lg">{playerCount}</span>
                    </div>
                </div>

                <button
                    onClick={() => setShowRulesModal(true)}
                    className="text-white/40 hover:text-cyan-400 transition-colors p-2"
                    title="How to Play"
                >
                    <FaQuestionCircle size={18} />
                </button>
            </div>

            {/* Rules Modal */}
            {showRulesModal && <BRRulesModal onClose={() => setShowRulesModal(false)} />}

            {/* Main Content - Mobile: Stack, Desktop: Side by Side */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

                {/* Left Panel - Game Controls */}
                <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">

                    {/* Players Solved Counter - Shows how many others have solved */}
                    {!hasSolved && otherPlayers.filter(p => p.hasSolved).length > 0 && (
                        <div className="bg-amber-500/20 border border-amber-500/40 rounded-xl px-4 py-2 mb-4 animate-pulse">
                            <span className="text-amber-400 font-bold text-sm">
                                ⚡ {otherPlayers.filter(p => p.hasSolved).length} player{otherPlayers.filter(p => p.hasSolved).length > 1 ? 's' : ''} solved! Hurry!
                            </span>
                        </div>
                    )}

                    {/* Solved Status */}
                    {hasSolved && (
                        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-xl px-6 py-4 mb-6">
                            <div className="flex items-center gap-3 text-green-400">
                                <FaCrown size={24} />
                                <span className="font-bold text-lg">✓ Solved! Waiting for round to end...</span>
                            </div>
                        </div>
                    )}

                    {/* Title */}
                    <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4 md:mb-6">
                        Crack the Color Code!
                    </h1>

                    {/* Last Guess Feedback - BIG AND CLEAR */}
                    {latestGuess && (
                        <div className="mb-6 w-full max-w-sm">
                            <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border border-cyan-500/40 rounded-2xl p-4 md:p-5">
                                <p className="text-xs text-white/50 uppercase tracking-widest mb-2">Last Guess Result</p>
                                <div className="flex items-center justify-center gap-4 md:gap-6">
                                    <div className="text-center">
                                        <p className="text-3xl md:text-4xl font-black text-green-400">{latestGuess.hits}</p>
                                        <p className="text-xs md:text-sm text-green-400/70">EXACT</p>
                                    </div>
                                    <div className="h-10 w-px bg-white/20"></div>
                                    <div className="text-center">
                                        <p className="text-3xl md:text-4xl font-black text-yellow-400">{latestGuess.pseudoHits}</p>
                                        <p className="text-xs md:text-sm text-yellow-400/70">CLOSE</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Color Code Slots */}
                    <div className="flex justify-center gap-3 md:gap-4 mb-6">
                        {Array(codeLength).fill(0).map((_, i) => {
                            const colorKey = selectedColors[i];
                            const color = colorKey ? getColor(colorKey) : null;

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleSlotClick(i)}
                                    disabled={hasSolved}
                                    className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl border-3 flex items-center justify-center transition-all shadow-lg ${color
                                        ? 'border-white/40 hover:border-white/70 active:scale-95'
                                        : 'border-cyan-500/40 border-dashed'
                                        } ${hasSolved ? 'opacity-60' : ''}`}
                                    style={{ backgroundColor: color?.hex || 'rgba(255,255,255,0.05)' }}
                                >
                                    {!color && <span className="text-white/30 text-2xl md:text-3xl">?</span>}
                                </button>
                            );
                        })}
                    </div>

                    {/* Color Picker Buttons */}
                    <div className="grid grid-cols-6 gap-3 md:gap-4 max-w-xs md:max-w-lg mx-auto mb-6">
                        {COLORS.map((color) => (
                            <button
                                key={color.key}
                                onClick={() => handleColorClick(color.key)}
                                disabled={selectedColors.length >= codeLength || hasSolved}
                                className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl transition-all shadow-lg ${selectedColors.length >= codeLength || hasSolved
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:scale-110 active:scale-95 hover:shadow-xl'
                                    }`}
                                style={{ backgroundColor: color.hex }}
                                title={color.name}
                            />
                        ))}
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className={`px-8 md:px-12 py-3 md:py-4 rounded-2xl font-bold text-lg md:text-xl transition-all ${canSubmit
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/30'
                            : 'bg-white/10 text-white/30 cursor-not-allowed'
                            }`}
                    >
                        {hasSolved ? '✓ SOLVED' : canSubmit ? 'SUBMIT GUESS' : `Select ${codeLength - selectedColors.length} more`}
                    </button>

                    {/* Other Players - Mobile only */}
                    {otherPlayers.length > 0 && (
                        <div className="mt-6 md:hidden overflow-x-auto w-full">
                            <div className="flex gap-2 min-w-max justify-center">
                                {otherPlayers.map((player) => (
                                    <div
                                        key={player.id}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${player.hasSolved
                                            ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                                            : 'bg-white/5 border border-white/10 text-white/60'
                                            }`}
                                    >
                                        {player.hasSolved ? <FaCrown size={10} /> : <FaFire size={10} />}
                                        <span className="font-medium">{player.name.slice(0, 8)}</span>
                                        <span className="text-white/40">#{player.guessCount}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel - Guess History (Desktop Only) */}
                <div className="hidden md:flex md:w-80 lg:w-96 flex-col border-l border-cyan-500/20 bg-black/30">
                    <div className="p-4 border-b border-cyan-500/20">
                        <h2 className="text-lg font-bold text-white">
                            Your Guesses <span className="text-cyan-400">({guessHistory.length})</span>
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {guessHistory.length === 0 ? (
                            <p className="text-white/40 text-center py-8">No guesses yet. Start guessing!</p>
                        ) : (
                            guessHistory.slice().reverse().map((guess, i) => (
                                <div
                                    key={i}
                                    className="bg-white/5 border border-white/10 rounded-xl p-4"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold text-white/60">
                                            Guess #{guessHistory.length - i}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1 text-green-400 font-bold">
                                                <FaCheck size={12} /> {guess.hits}
                                            </span>
                                            <span className="flex items-center gap-1 text-yellow-400 font-bold">
                                                <FaCircle size={8} /> {guess.pseudoHits}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {guess.colors.map((colorKey, j) => {
                                            const color = getColor(colorKey);
                                            return (
                                                <div
                                                    key={j}
                                                    className="w-10 h-10 rounded-lg shadow-inner"
                                                    style={{ backgroundColor: color?.hex }}
                                                    title={color?.name}
                                                />
                                            );
                                        })}
                                    </div>
                                    <p className="mt-2 text-xs text-white/50">
                                        {guess.hits > 0 ? `${guess.hits} exact match${guess.hits > 1 ? 'es' : ''}` : 'No exact matches'}
                                        {guess.pseudoHits > 0 ? `, ${guess.pseudoHits} close` : ''}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Other Players - Desktop */}
                    {otherPlayers.length > 0 && (
                        <div className="p-4 border-t border-cyan-500/20">
                            <h3 className="text-xs text-white/40 uppercase tracking-widest mb-3">Other Players</h3>
                            <div className="space-y-2">
                                {otherPlayers.map((player) => (
                                    <div
                                        key={player.id}
                                        className={`flex items-center justify-between p-3 rounded-lg ${player.hasSolved
                                            ? 'bg-green-500/10 border border-green-500/30'
                                            : 'bg-white/5'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {player.hasSolved ? (
                                                <span className="text-green-400"><FaCrown size={14} /></span>
                                            ) : (
                                                <span className="text-orange-400"><FaFire size={14} /></span>
                                            )}
                                            <span className={`font-medium ${player.hasSolved ? 'text-green-400' : 'text-white/80'}`}>
                                                {player.name}
                                            </span>
                                        </div>
                                        <span className="text-white/50 text-sm">
                                            {player.guessCount} guess{player.guessCount !== 1 ? 'es' : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Bottom - Guess History */}
            {guessHistory.length > 0 && (
                <div className="md:hidden border-t border-cyan-500/20 p-3 max-h-28 overflow-y-auto">
                    <div className="space-y-1.5">
                        {guessHistory.slice().reverse().slice(0, 3).map((guess, i) => (
                            <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                                <span className="text-[10px] text-white/40 w-4">#{guessHistory.length - i}</span>
                                <div className="flex gap-1">
                                    {guess.colors.map((colorKey, j) => (
                                        <div
                                            key={j}
                                            className="w-5 h-5 rounded"
                                            style={{ backgroundColor: getColor(colorKey)?.hex }}
                                        />
                                    ))}
                                </div>
                                <span className="text-xs text-white/60 ml-auto">
                                    <span className="text-green-400">{guess.hits}✓</span>
                                    {' '}
                                    <span className="text-yellow-400">{guess.pseudoHits}○</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
