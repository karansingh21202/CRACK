import React from 'react';
import { FaTrophy, FaShare } from 'react-icons/fa';

interface BRResultModalProps {
    isWinner: boolean;
    placement: number;
    totalPlayers: number;
    roundsSurvived: number;
    onPlayAgain: () => void;
    onShare: () => void;
    onLeave: () => void;
}

export const BRResultModal: React.FC<BRResultModalProps> = ({
    isWinner,
    placement,
    totalPlayers,
    roundsSurvived,
    onPlayAgain,
    onShare,
    onLeave
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
            {/* Background effects */}
            {isWinner && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Cyber confetti would go here */}
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] animate-pulse" />
                </div>
            )}

            <div className="relative z-10 text-center px-8 py-10">
                {/* Crown/Trophy for winner */}
                {isWinner ? (
                    <>
                        <div className="text-8xl mb-4">👑</div>
                        <h1
                            className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-purple-500 mb-4"
                            style={{ textShadow: '0 0 30px rgba(6,182,212,0.5)' }}
                        >
                            CHAMPION
                        </h1>
                    </>
                ) : (
                    <>
                        <div className="text-6xl mb-4">🏆</div>
                        <h1 className="text-4xl md:text-5xl font-black text-white/80 mb-4">
                            GAME OVER
                        </h1>
                    </>
                )}

                {/* Placement */}
                <div className="mb-8">
                    <p className="text-lg text-white/60">You placed</p>
                    <p className="text-6xl font-black text-white my-2">#{placement}</p>
                    <p className="text-sm text-white/40">of {totalPlayers} players</p>
                </div>

                {/* Stats */}
                <div className="flex justify-center gap-8 mb-8">
                    <div className="text-center">
                        <p className="text-3xl font-black text-cyan-400">{roundsSurvived}</p>
                        <p className="text-xs text-white/40 uppercase">Rounds Survived</p>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-3 w-64 mx-auto">
                    <button
                        onClick={onShare}
                        className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:scale-105 active:scale-95 transition-all"
                    >
                        <FaShare size={14} />
                        SHARE RESULT
                    </button>
                    <button
                        onClick={onPlayAgain}
                        className="w-full py-3 rounded-xl font-bold bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
                    >
                        PLAY AGAIN
                    </button>
                    <button
                        onClick={onLeave}
                        className="text-sm text-white/40 hover:text-white/60 transition-colors"
                    >
                        Back to Menu
                    </button>
                </div>
            </div>
        </div>
    );
};
