import React, { forwardRef } from 'react';
import { Room, Player } from '../types';
import { TrophyIcon, TargetIcon, PartyIcon, CrownIcon } from './Icon';
import { Logo } from './Logo';

interface ShareResultProps {
    room: Room;
    playerId: string;
    winner: Player;
}

export const ShareResult = forwardRef<HTMLDivElement, ShareResultProps>(({ room, playerId, winner }, ref) => {
    const isPlayerWinner = winner.id === playerId;
    const guessCount = winner.guesses.length;
    const codeLength = room.settings.codeLength;
    const isFFA = room.gameMode === 'FFA';

    // Get the last 6 guesses (or fewer) to show the pattern
    const guessesToShow = winner.guesses.slice(-6);

    return (
        <div
            ref={ref}
            className="w-[600px] h-[800px] bg-[#09090b] text-white p-8 flex flex-col relative overflow-hidden font-sans"
            style={{ backgroundImage: 'radial-gradient(circle at top right, #4c1d95 0%, #09090b 40%)' }}
        >
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-10 left-10 w-64 h-64 bg-purple-500 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-10 right-10 w-64 h-64 bg-blue-500 rounded-full blur-[100px]"></div>
            </div>

            {/* Header */}
            <div className="flex justify-between items-center mb-8 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12">
                        <Logo className="w-full h-full text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter leading-none">CRACK<br />THE CODE</h1>
                    </div>
                </div>
                <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    {room.gameMode === 'DUEL' ? <><TargetIcon className="w-4 h-4" /> Duel</> :
                        room.gameMode === 'FFA' ? <><PartyIcon className="w-4 h-4" /> Party</> :
                            <><CrownIcon className="w-4 h-4" /> Solo</>}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center z-10 text-center">
                <div className="mb-6 relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.5)]">
                        <TrophyIcon className="w-16 h-16 text-white" />
                    </div>
                    {isPlayerWinner && (
                        <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-black text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                            You Won!
                        </div>
                    )}
                </div>

                <h2 className="text-5xl font-black mb-2 tracking-tight">
                    {isPlayerWinner ? "MASTERMIND" : "CRACKED IT"}
                </h2>
                <p className="text-white/60 text-lg font-medium mb-10">
                    {isPlayerWinner ? "You solved the puzzle!" : `${winner.name} cracked the code.`}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-10">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                        <div className="text-3xl font-black text-purple-400">{guessCount}</div>
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Guesses</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                        <div className="text-3xl font-black text-blue-400">
                            {isFFA ? winner.scoreBreakdown?.total || 0 : (winner.guesses.find(g => g.hits === codeLength)?.code || "????")}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                            {isFFA ? "Score" : "Code"}
                        </div>
                    </div>
                </div>

                {/* Pattern Visualization */}
                <div className="flex flex-col gap-2 items-center">
                    {guessesToShow.map((guess, i) => (
                        <div key={i} className="flex gap-1">
                            {Array.from({ length: codeLength }).map((_, j) => {
                                let color = 'bg-white/10'; // miss
                                if (j < guess.hits) color = 'bg-green-500';
                                else if (j < guess.hits + guess.pseudoHits) color = 'bg-yellow-500';

                                return (
                                    <div key={j} className={`w-3 h-3 rounded-sm ${color}`}></div>
                                );
                            })}
                        </div>
                    ))}
                    {winner.guesses.length > 6 && (
                        <div className="text-[10px] text-white/20 mt-1 font-mono">...and {winner.guesses.length - 6} more</div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-8 border-t border-white/10 flex justify-between items-end z-10">
                <div className="text-xs text-white/40 font-medium">
                    Generated on {new Date().toLocaleDateString()}
                </div>
                <div className="text-right">
                    <div className="text-lg font-black tracking-tight">crackthecode.com</div>
                    <div className="text-xs text-purple-400 font-bold uppercase tracking-widest">Play for free</div>
                </div>
            </div>
        </div>
    );
});

ShareResult.displayName = 'ShareResult';
