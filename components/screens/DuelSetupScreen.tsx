import React, { useState, useEffect } from 'react';
import { Room } from '@/types';
import { Card } from '../Card';
import { Button } from '../Button';
import { useSound } from '../../hooks/useSound';
import { generateSecretCode } from '../../utils/feedback';
import { CheckCircleIcon, ZapIcon } from '../Icon';
import { GameBoard } from '../GameBoard';

interface DuelSetupScreenProps {
    room: Room;
    playerId: string;
    onSetCode: (code: string) => void;
    onCountdownComplete: () => void;
}

export const DuelSetupScreen: React.FC<DuelSetupScreenProps> = ({ room, playerId, onSetCode, onCountdownComplete }) => {
    const player = room.players.find(p => p.id === playerId);
    const opponent = room.players.find(p => p.id !== playerId);
    const { playPop } = useSound();
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        if (player?.secretCode && opponent?.secretCode) {
            setCount(3);
        }
    }, [player?.secretCode, opponent?.secretCode]);

    useEffect(() => {
        if (count === null) return;
        if (count > 0) {
            const timer = setTimeout(() => setCount(count - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            onCountdownComplete();
        }
    }, [count, onCountdownComplete]);

    if (!player) return <div className="w-full h-full flex items-center justify-center">Loading...</div>;

    const handleGenerateCode = () => {
        playPop();
        const code = generateSecretCode(room.settings.codeLength, room.settings.allowRepeats);
        onSetCode(code);
    }

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8 text-center animate-fadeIn shadow-xl">
                <h2 className="text-2xl font-bold text-secondary-accent dark:text-primary-accent mb-2">Set Your Secret Code</h2>
                <p className="text-light-text dark:text-dark-text mb-6 opacity-80">Your opponent, <span className="font-bold">{opponent?.name || '...'}</span>, will try to guess this code.</p>
                {player.secretCode ? (
                    <div className="flex flex-col items-center gap-4 animate-popIn">
                        <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mb-2 shadow-lg shadow-green-500/30">
                            <CheckCircleIcon className="w-10 h-10" />
                        </div>
                        <div className="text-4xl font-mono font-bold tracking-[0.5em] p-6 bg-light-bg dark:bg-dark-bg rounded-xl border border-light-subtle-border dark:border-dark-subtle-border shadow-inner text-light-text dark:text-dark-text">
                            {player.secretCode}
                        </div>
                        <p className="text-sm font-medium text-light-text/60 dark:text-dark-text/60 mt-2 animate-pulse">
                            {opponent?.secretCode ? (
                                <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                                    Starting in {count}...
                                </span>
                            ) : "Waiting for opponent..."}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-6">
                        {opponent?.secretCode && (
                            <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-lg text-sm font-bold animate-pulse flex items-center gap-2">
                                <ZapIcon className="w-4 h-4" />
                                Opponent is ready! Set your code to start.
                            </div>
                        )}
                        <GameBoard
                            codeLength={room.settings.codeLength}
                            onSubmitGuess={onSetCode}
                            isGameWon={false}
                            allowRepeats={room.settings.allowRepeats}
                        />
                        <div className="w-full border-t border-light-subtle-border dark:border-dark-subtle-border"></div>
                        <Button variant="ghost" onClick={handleGenerateCode} className="w-full text-light-text/70 hover:text-secondary-accent">
                            Randomize Code
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
};
