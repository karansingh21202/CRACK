import React, { useState, useCallback } from 'react';
import { ColorPicker, ColorKey } from './ColorPicker';
import { PlayerCounter } from './PlayerCounter';
import { RoundTimer } from './RoundTimer';
import { EliminationOverlay } from './EliminationOverlay';
import { BattleRoyaleState } from '../../server/src/types';

interface Guess {
    colors: ColorKey[];
    hits: number;
    submitted: boolean;
}

interface BRGameScreenProps {
    brState: BattleRoyaleState;
    playersAlive: number;
    totalPlayers: number;
    round: number;
    roundEndTime: number;
    isEliminated: boolean;
    placement?: number;
    onSubmitGuess: (colors: ColorKey[]) => void;
    guessHistory: Guess[];
    onLeave: () => void;
}

export const BRGameScreen: React.FC<BRGameScreenProps> = ({
    brState,
    playersAlive,
    totalPlayers,
    round,
    roundEndTime,
    isEliminated,
    placement,
    onSubmitGuess,
    guessHistory,
    onLeave
}) => {
    const [selectedColors, setSelectedColors] = useState<ColorKey[]>([]);
    const codeLength = brState.codeLength;

    const handleColorSelect = useCallback((color: ColorKey) => {
        if (selectedColors.length < codeLength) {
            setSelectedColors([...selectedColors, color]);
        }
    }, [selectedColors, codeLength]);

    const handleColorRemove = useCallback((index: number) => {
        setSelectedColors(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleSubmit = useCallback(() => {
        if (selectedColors.length === codeLength) {
            onSubmitGuess(selectedColors);
            setSelectedColors([]); // Reset after submit
        }
    }, [selectedColors, codeLength, onSubmitGuess]);

    return (
        <div className="w-full h-full flex flex-col bg-gradient-to-br from-[#0a0a0f] via-[#0f1a2e] to-[#0a0a0f] overflow-hidden">

            {/* Elimination Overlay */}
            {isEliminated && placement && (
                <EliminationOverlay
                    isEliminated={isEliminated}
                    placement={placement}
                    totalPlayers={totalPlayers}
                    onDismiss={() => { }}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-cyan-500/20">
                <PlayerCounter
                    alive={playersAlive}
                    total={totalPlayers}
                />

                <div className="text-center">
                    <p className="text-xs text-white/40 uppercase tracking-widest">Round</p>
                    <p className="text-2xl font-black text-cyan-400">{round}</p>
                </div>

                <RoundTimer
                    endTime={roundEndTime}
                />
            </div>

            {/* Main Game Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                {/* Color Picker */}
                <div className="w-full max-w-sm">
                    <ColorPicker
                        selectedColors={selectedColors}
                        codeLength={codeLength}
                        onColorSelect={handleColorSelect}
                        onColorRemove={handleColorRemove}
                        onSubmit={handleSubmit}
                        disabled={isEliminated}
                    />
                </div>
            </div>

            {/* Guess History */}
            <div className="p-4 border-t border-cyan-500/20 max-h-40 overflow-y-auto">
                <h3 className="text-xs text-white/40 uppercase tracking-widest mb-2">Your Guesses</h3>
                <div className="space-y-2">
                    {guessHistory.map((guess, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 bg-white/5 rounded-lg p-2"
                        >
                            <span className="text-xs text-white/40 w-6">#{i + 1}</span>
                            <div className="flex gap-1">
                                {guess.colors.map((color, j) => (
                                    <div
                                        key={j}
                                        className="w-6 h-6 rounded"
                                        style={{ backgroundColor: `var(--br-${color.toLowerCase()})` }}
                                    />
                                ))}
                            </div>
                            <span className="text-sm font-bold text-cyan-400">
                                {guess.hits} hits
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
