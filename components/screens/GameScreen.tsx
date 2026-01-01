import React, { useMemo } from 'react';
import { Room, GameState } from '@/types';
import { Card } from '../Card';
import { Button } from '../Button';
import { ExitIcon, ClipboardIcon } from '../Icon';
import { DuelHeader, DuelHeaderStyle } from '../DuelHeader';
import { GuessRow } from '../GuessRow';
import { GameTimer } from '../GameTimer';
import { PanicTimer } from '../PanicTimer';
import { GameBoard } from '../GameBoard';

interface GameScreenProps {
    room: Room;
    playerId: string;
    onSubmitGuess: (guess: string) => void;
    onInvalidGuess: (message: string) => void;
    onQuit: () => void;
    duelHeaderStyle: DuelHeaderStyle;
    onToggleDuelHeaderStyle: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ room, playerId, onSubmitGuess, onInvalidGuess, onQuit, duelHeaderStyle, onToggleDuelHeaderStyle }) => {
    const player = room.players.find(p => p.id === playerId);

    if (!player) return <div className="w-full h-full flex items-center justify-center">Loading game...</div>;

    const isGameOver = room.gameState === GameState.Won;

    const allGuessesSorted = useMemo(() =>
        room.players.flatMap(p => p.guesses).sort((a, b) => b.id - a.id)
        , [room.players]);

    const opponent = room.gameMode === 'DUEL' ? room.players.find(p => p.id === player.opponentId) : null;
    const yourGuesses = player.guesses.slice().sort((a, b) => b.id - a.id);
    const maxGuesses = Math.max(10, player.guesses.length, opponent?.guesses.length ?? 0);

    // Check if THIS player has solved the code (even if game is still in Panic mode)
    const hasPlayerSolved = player.guesses.some(g => g.hits === room.settings.codeLength);

    return (
        <div className="w-full h-full flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 p-2 lg:p-6 pb-safe animate-fadeIn overflow-hidden">

            {room.gameMode === 'DUEL' && opponent && (
                <DuelHeader
                    player={player}
                    opponent={opponent}
                    maxGuesses={maxGuesses}
                    style={duelHeaderStyle}
                    onToggleStyle={onToggleDuelHeaderStyle}
                />
            )}

            {/* --- History --- */}
            <div className="hidden lg:flex lg:col-span-4 flex-col h-full min-h-0">
                <h2 className="text-xs font-black uppercase tracking-widest mb-3 text-light-text/60 dark:text-dark-text/60 px-1">Your History</h2>
                <Card className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-dark-card shadow-md border border-light-subtle-border dark:border-dark-subtle-border">
                    <div className="p-4 flex-1 overflow-y-auto space-y-3">
                        {yourGuesses.length > 0 ? (
                            yourGuesses.map((guess, index) => (
                                <GuessRow key={`${guess.playerId}-${guess.id}-${index}`} guess={guess} showPlayerName={false} />
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-4">
                                <ClipboardIcon className="w-12 h-12 mb-2" />
                                <p className="font-medium">Your guesses will appear here</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* --- Mobile History (Compact - MOVED TO TOP) --- */}
            <div className="lg:hidden flex flex-col gap-2 mb-2 min-h-0 shrink-0">
                <div className="flex items-center justify-between px-1">
                    <h3 className="font-black text-secondary-accent dark:text-primary-accent uppercase text-[10px] tracking-wider">History ({yourGuesses.length})</h3>
                </div>

                <div className="max-h-[15vh] overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    {yourGuesses.length > 0 ? yourGuesses.map((guess, index) => (
                        <GuessRow key={`mob-${index}`} guess={guess} />
                    )) : (
                        <Card className="p-3 text-center text-light-text/50 dark:text-dark-text/50 border-dashed text-xs">
                            <p>Enter first code below</p>
                        </Card>
                    )}
                </div>
            </div>

            {/* --- Game Board --- */}
            <div className="flex-1 lg:col-span-4 flex flex-col h-full min-h-0">
                <Card className="flex-1 p-3 lg:p-8 flex flex-col relative shadow-2xl bg-white dark:bg-dark-card border border-light-subtle-border dark:border-dark-subtle-border overflow-y-auto">
                    {/* Timer & Header */}
                    <div className="flex justify-between items-center mb-1 lg:mb-12">
                        <div className="flex flex-col">
                            <h2 className="text-xs lg:text-sm font-black text-secondary-accent dark:text-primary-accent tracking-widest uppercase">
                                {room.gameMode === 'DUEL' ? `TARGET: ${opponent?.name}` : "CODE BREAKER"}
                            </h2>
                            <div className="h-1 w-8 bg-secondary-accent/30 dark:bg-primary-accent/30 rounded-full mt-1"></div>
                        </div>
                        <div className="flex items-center gap-4">
                            {room.gameState === GameState.Panic ? (
                                <PanicTimer startTime={room.panicStartTime} />
                            ) : (
                                <GameTimer isPlaying={!isGameOver} />
                            )}
                            {room.gameMode !== 'SINGLE' && room.gameMode !== 'DUEL' && (
                                <Button variant="ghost" onClick={onQuit} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Quit Game">
                                    <ExitIcon className="w-5 h-5" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="my-auto w-full flex flex-col items-center">
                        <GameBoard
                            codeLength={room.settings.codeLength}
                            onSubmitGuess={onSubmitGuess}
                            onInvalidGuess={onInvalidGuess}
                            isGameWon={isGameOver || hasPlayerSolved}
                            allowRepeats={room.settings.allowRepeats}
                        />
                    </div>
                </Card>
            </div>

            {/* --- Live Feed --- */}
            <div className="hidden lg:flex lg:col-span-4 flex-col h-full min-h-0">
                <h2 className="text-xs font-black uppercase tracking-widest mb-3 text-light-text/60 dark:text-dark-text/60 px-1">{room.gameMode === 'DUEL' ? "Opponent Activity" : "Live Feed"}</h2>
                <Card className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-dark-card shadow-md border border-light-subtle-border dark:border-dark-subtle-border">
                    <div className="p-4 flex-1 overflow-y-auto space-y-3">
                        {room.gameMode === 'DUEL' && opponent ? (
                            opponent.guesses.length > 0 ? opponent.guesses.slice().sort((a, b) => b.id - a.id).map(guess => (
                                <GuessRow key={`opp-${guess.id}`} guess={guess} showPlayerName={false} />
                            )) : <div className="h-full flex flex-col items-center justify-center opacity-40 font-medium text-center p-4">
                                <div className="animate-pulse mb-2">...</div>
                                <div className="text-center">Waiting for move</div>
                            </div>
                        ) : (
                            allGuessesSorted.length > 0 ? allGuessesSorted.map((guess, index) => {
                                const isMyGuess = guess.playerId === playerId;
                                // Mask code if it's not my guess and game is not over (or even if over, maybe keep masked? No, reveal on end usually, but for now mask always for opponents in feed)
                                // Actually, user said "live feeds mein player ek dusre ka code dekh le rhe h".
                                // So we mask for opponents.
                                const displayGuess = isMyGuess ? guess : { ...guess, code: '****' };

                                return (
                                    <GuessRow key={`feed-${guess.playerId}-${guess.id}-${index}`} guess={displayGuess} showPlayerName={true} />
                                );
                            }) : <div className="h-full flex items-center justify-center opacity-40 font-medium">No activity yet...</div>
                        )}
                    </div>
                </Card>
            </div>

        </div>
    );
};
