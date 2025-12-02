import React from 'react';
import { Player } from '../types';

export type DuelHeaderStyle = 'classic' | 'neon' | 'retro' | 'minimal' | 'glass';

interface DuelHeaderProps {
    player: Player;
    opponent: Player;
    maxGuesses: number;
    style: DuelHeaderStyle;
    onToggleStyle: () => void;
}

export const DuelHeader: React.FC<DuelHeaderProps> = ({ player, opponent, maxGuesses, style, onToggleStyle }) => {

    const playerPercent = Math.min((player.guesses.length / maxGuesses) * 100, 100);
    const opponentPercent = Math.min((opponent.guesses.length / maxGuesses) * 100, 100);

    // Common Toggle Button
    const ToggleBtn = ({ label, colorClass = "text-gray-500 dark:text-white" }: { label: string, colorClass?: string }) => (
        <button onClick={onToggleStyle} className={`absolute -top-6 right-0 text-[10px] uppercase tracking-widest opacity-50 hover:opacity-100 ${colorClass} z-50`}>
            Style: {label}
        </button>
    );

    // 1. CLASSIC (The one you liked - Street Fighter / Tekken vibe)
    if (style === 'classic') {
        return (
            <div className="lg:col-span-12 flex-shrink-0 mb-8 relative">
                <ToggleBtn label="Classic (Street Fighter)" />
                <div className="flex items-center justify-between gap-4">
                    {/* Player Bar (Slanted) */}
                    <div className="flex-1 relative">
                        <div className="flex justify-between text-gray-900 dark:text-white font-black uppercase italic text-xl mb-1 px-2">
                            <span>{player.name}</span>
                        </div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-900/50 transform -skew-x-12 border-2 border-purple-500/50 p-1 relative overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.5)]"
                                style={{ width: `${playerPercent}%` }}
                            ></div>
                        </div>
                        <div className="absolute -bottom-6 left-0 text-purple-600 dark:text-purple-400 font-mono font-bold text-xs">GUESSES: {player.guesses.length}</div>
                    </div>

                    {/* VS Badge */}
                    <div className="relative z-10 w-16 h-16 flex items-center justify-center">
                        <div className="absolute inset-0 bg-red-600 rotate-45 transform scale-75 border-4 border-white dark:border-gray-900 shadow-xl"></div>
                        <span className="relative text-white font-black text-2xl italic">VS</span>
                    </div>

                    {/* Opponent Bar (Slanted Reverse) */}
                    <div className="flex-1 relative text-right">
                        <div className="flex justify-between text-gray-900 dark:text-white font-black uppercase italic text-xl mb-1 px-2 flex-row-reverse">
                            <span>{opponent.name}</span>
                        </div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-900/50 transform skew-x-12 border-2 border-red-500/50 p-1 relative overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-l from-red-600 to-orange-500 transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.5)] float-right"
                                style={{ width: `${opponentPercent}%` }}
                            ></div>
                        </div>
                        <div className="absolute -bottom-6 right-0 text-red-600 dark:text-red-400 font-mono font-bold text-xs">GUESSES: {opponent.guesses.length}</div>
                    </div>
                </div>
            </div>
        );
    }

    // 2. NEON (Cyberpunk / Tron - Heavy Glow)
    if (style === 'neon') {
        return (
            <div className="lg:col-span-12 flex-shrink-0 mb-8 relative">
                <ToggleBtn label="Neon (Cyberpunk)" />
                <div className="flex items-center justify-between gap-6">
                    {/* Player */}
                    <div className="flex-1">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-cyan-600 dark:text-cyan-400 font-black text-2xl tracking-tighter drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] dark:drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">{player.name}</span>
                            <span className="text-cyan-700 dark:text-cyan-200 font-mono text-xs">LVL {player.guesses.length}</span>
                        </div>
                        <div className="h-4 bg-gray-800 dark:bg-black border border-cyan-500/30 rounded-sm relative shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                            <div
                                className="h-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,1)] relative"
                                style={{ width: `${playerPercent}%` }}
                            >
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white"></div>
                            </div>
                        </div>
                    </div>

                    {/* VS */}
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-gray-400 to-gray-600 dark:from-white dark:to-gray-500 italic tracking-tighter opacity-50">
                        VS
                    </div>

                    {/* Opponent */}
                    <div className="flex-1 text-right">
                        <div className="flex justify-between items-end mb-2 flex-row-reverse">
                            <span className="text-pink-600 dark:text-pink-500 font-black text-2xl tracking-tighter drop-shadow-[0_0_10px_rgba(236,72,153,0.5)] dark:drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]">{opponent.name}</span>
                            <span className="text-pink-700 dark:text-pink-300 font-mono text-xs">LVL {opponent.guesses.length}</span>
                        </div>
                        <div className="h-4 bg-gray-800 dark:bg-black border border-pink-500/30 rounded-sm relative shadow-[0_0_15px_rgba(236,72,153,0.2)]">
                            <div
                                className="h-full bg-pink-500 shadow-[0_0_20px_rgba(236,72,153,1)] relative float-right"
                                style={{ width: `${opponentPercent}%` }}
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 3. RETRO (Pixel / 8-Bit - Blocky)
    if (style === 'retro') {
        return (
            <div className="lg:col-span-12 flex-shrink-0 mb-8 relative">
                <ToggleBtn label="Retro (8-Bit)" />
                <div className="bg-gray-100 dark:bg-gray-800 p-2 border-4 border-gray-800 dark:border-gray-400 rounded-sm">
                    <div className="flex items-center justify-between gap-2">
                        {/* Player */}
                        <div className="flex-1">
                            <div className="text-yellow-700 dark:text-yellow-400 font-bold uppercase text-xs mb-1 tracking-widest">P1: {player.name}</div>
                            <div className="h-6 bg-white dark:bg-black border-2 border-black dark:border-white p-0.5">
                                <div
                                    className="h-full bg-green-500"
                                    style={{ width: `${playerPercent}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* VS */}
                        <div className="bg-red-600 text-white font-bold px-2 py-1 border-2 border-black dark:border-white text-xs">VS</div>

                        {/* Opponent */}
                        <div className="flex-1 text-right">
                            <div className="text-blue-700 dark:text-blue-400 font-bold uppercase text-xs mb-1 tracking-widest">P2: {opponent.name}</div>
                            <div className="h-6 bg-white dark:bg-black border-2 border-black dark:border-white p-0.5">
                                <div
                                    className="h-full bg-blue-500 float-right"
                                    style={{ width: `${opponentPercent}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 4. MINIMAL (Esports / Clean - Flat)
    if (style === 'minimal') {
        return (
            <div className="lg:col-span-12 flex-shrink-0 mb-8 relative">
                <ToggleBtn label="Minimal (Esports)" />
                <div className="flex items-center gap-0">
                    {/* Player */}
                    <div className="flex-1 bg-gray-100 dark:bg-gray-900 h-12 flex items-center relative overflow-hidden">
                        <div
                            className="absolute inset-0 bg-indigo-600 opacity-10 dark:opacity-20"
                            style={{ width: `${playerPercent}%` }}
                        ></div>
                        <div className="absolute bottom-0 left-0 h-1 bg-indigo-500" style={{ width: `${playerPercent}%` }}></div>
                        <div className="px-4 z-10 font-bold text-gray-900 dark:text-white uppercase tracking-wider">{player.name}</div>
                        <div className="ml-auto px-4 z-10 font-mono text-indigo-600 dark:text-indigo-400">{player.guesses.length}</div>
                    </div>

                    {/* VS Divider */}
                    <div className="w-12 h-12 bg-white dark:bg-black flex items-center justify-center z-20 skew-x-[-20deg] mx-[-10px] border-l-2 border-r-2 border-gray-200 dark:border-gray-800">
                        <span className="text-black dark:text-white font-black text-xs skew-x-[20deg]">VS</span>
                    </div>

                    {/* Opponent */}
                    <div className="flex-1 bg-gray-100 dark:bg-gray-900 h-12 flex items-center relative overflow-hidden flex-row-reverse">
                        <div
                            className="absolute inset-0 bg-rose-600 opacity-10 dark:opacity-20"
                            style={{ width: `${opponentPercent}%`, right: 0, left: 'auto' }}
                        ></div>
                        <div className="absolute bottom-0 right-0 h-1 bg-rose-500" style={{ width: `${opponentPercent}%` }}></div>
                        <div className="px-4 z-10 font-bold text-gray-900 dark:text-white uppercase tracking-wider">{opponent.name}</div>
                        <div className="mr-auto px-4 z-10 font-mono text-rose-600 dark:text-rose-400">{opponent.guesses.length}</div>
                    </div>
                </div>
            </div>
        );
    }

    // 5. GLASS (Premium / Modern - Frosted)
    if (style === 'glass') {
        return (
            <div className="lg:col-span-12 flex-shrink-0 mb-8 relative">
                <ToggleBtn label="Glass (Premium)" />
                <div className="relative h-16 rounded-2xl overflow-hidden backdrop-blur-md bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-xl dark:shadow-2xl flex items-center px-6">
                    {/* Background Gradients */}
                    <div className="absolute inset-0 opacity-10 dark:opacity-20">
                        <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-gradient-to-r from-purple-500/50 to-transparent"></div>
                        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-orange-500/50 to-transparent"></div>
                    </div>

                    {/* Player */}
                    <div className="flex-1 flex flex-col gap-1 z-10">
                        <div className="flex justify-between text-xs font-bold tracking-widest text-gray-800 dark:text-white/80 uppercase">
                            <span>{player.name}</span>
                        </div>
                        <div className="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-600 dark:bg-white shadow-[0_0_10px_rgba(147,51,234,0.5)] dark:shadow-[0_0_10px_white]" style={{ width: `${playerPercent}%` }}></div>
                        </div>
                    </div>

                    {/* VS */}
                    <div className="mx-8 z-10">
                        <div className="w-10 h-10 rounded-full border border-black/10 dark:border-white/20 flex items-center justify-center bg-white/40 dark:bg-white/5 backdrop-blur-xl">
                            <span className="text-[10px] font-black text-gray-900 dark:text-white">VS</span>
                        </div>
                    </div>

                    {/* Opponent */}
                    <div className="flex-1 flex flex-col gap-1 z-10 text-right">
                        <div className="flex justify-between text-xs font-bold tracking-widest text-gray-800 dark:text-white/80 uppercase flex-row-reverse">
                            <span>{opponent.name}</span>
                        </div>
                        <div className="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 dark:bg-orange-400 shadow-[0_0_10px_orange]" style={{ width: `${opponentPercent}%`, float: 'right' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
