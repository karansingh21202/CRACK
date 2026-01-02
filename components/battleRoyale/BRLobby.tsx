import React, { useState, useEffect } from 'react';
import { FaUsers, FaPlay, FaArrowLeft, FaCopy, FaCheck } from 'react-icons/fa';

interface BRLobbyProps {
    roomId: string; // Room code for sharing
    playerCount: number;
    minPlayers: number;
    maxPlayers: number;
    isHost: boolean;
    onStart: () => void;
    onLeave: () => void;
    players: { id: string; name: string }[];
}

export const BRLobby: React.FC<BRLobbyProps> = ({
    roomId,
    playerCount,
    minPlayers,
    maxPlayers,
    isHost,
    onStart,
    onLeave,
    players
}) => {
    const [copied, setCopied] = useState(false);
    const canStart = playerCount >= minPlayers;

    // Copy room code to clipboard
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(roomId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // REMOVED: Auto-countdown when min players reached
    // Host will manually start when ready

    // REMOVED: Auto-start countdown - host controls start now

    const progressPercent = (playerCount / maxPlayers) * 100;

    return (
        <div className="w-full h-full flex items-center justify-center p-4 pb-safe bg-gradient-to-br from-gray-50 via-purple-50/30 to-gray-50 dark:from-[#0a0a0f] dark:via-[#0f1a2e] dark:to-[#0a0a0f]">
            <div className="w-full max-w-lg bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-emerald-200 dark:border-cyan-500/30 rounded-2xl p-6 shadow-2xl shadow-emerald-500/10 dark:shadow-cyan-500/10">

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={onLeave}
                        className="text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white transition-colors"
                    >
                        <FaArrowLeft size={18} />
                    </button>
                    <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-cyan-400 dark:to-purple-500">
                        COLOR KNOCKOUT
                    </h1>
                    <div className="w-8" /> {/* Spacer */}
                </div>

                {/* Room Code for Sharing */}
                <div className="bg-emerald-50 dark:bg-white/5 border border-emerald-200 dark:border-cyan-500/30 rounded-xl p-4 mb-4">
                    <p className="text-xs text-gray-500 dark:text-white/40 uppercase tracking-widest mb-2 text-center">Room Code</p>
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-3xl font-black text-emerald-600 dark:text-cyan-400 tracking-widest font-mono">
                            {roomId}
                        </span>
                        <button
                            onClick={handleCopy}
                            className="p-2 rounded-lg bg-emerald-100 dark:bg-cyan-500/20 text-emerald-600 dark:text-cyan-400 hover:bg-emerald-200 dark:hover:bg-cyan-500/30 transition-colors"
                            title="Copy room code"
                        >
                            {copied ? <FaCheck size={16} /> : <FaCopy size={16} />}
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-white/30 text-center mt-2">
                        Share this code with friends to join!
                    </p>
                </div>

                {/* Player Count */}
                <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-cyan-400 mb-2">
                        <FaUsers size={20} />
                        <span className="text-3xl font-black">{playerCount}</span>
                        <span className="text-lg text-gray-400 dark:text-white/40">/ {maxPlayers}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-cyan-500 dark:to-purple-500 transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-white/40 mt-2">
                        {canStart ? 'Ready to start!' : `Need ${minPlayers - playerCount} more players`}
                    </p>
                </div>

                {/* Waiting for host to start */}
                <div className="text-center mb-6">
                    {isHost ? (
                        <p className="text-sm text-emerald-600 dark:text-amber-400">You're the host. Start when ready!</p>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-white/40">Waiting for host to start...</p>
                    )}
                </div>

                {/* Player Grid */}
                <div className="grid grid-cols-5 gap-2 mb-6 max-h-40 overflow-y-auto">
                    {players.map((player) => (
                        <div
                            key={player.id}
                            className="aspect-square rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-cyan-500/20 dark:to-purple-500/20 border border-emerald-200 dark:border-cyan-500/30 flex items-center justify-center"
                            title={player.name}
                        >
                            <span className="text-xs font-bold text-emerald-600 dark:text-cyan-400">
                                {player.name.slice(0, 2).toUpperCase()}
                            </span>
                        </div>
                    ))}
                    {/* Empty slots */}
                    {Array(Math.min(25, maxPlayers) - players.length).fill(0).map((_, i) => (
                        <div
                            key={`empty-${i}`}
                            className="aspect-square rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10"
                        />
                    ))}
                </div>

                {/* Start Button (Host Only) */}
                {isHost && (
                    <button
                        onClick={canStart ? onStart : undefined}
                        disabled={!canStart}
                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${canStart
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/30'
                            : 'bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-white/30 cursor-not-allowed'
                            }`}
                    >
                        <FaPlay size={14} />
                        {canStart ? 'START GAME' : 'WAITING...'}
                    </button>
                )}
            </div>
        </div>
    );
};
