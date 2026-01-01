import React, { useEffect, useState, useRef } from 'react';
import { FaCrown, FaSkull, FaRedo, FaShare, FaHome, FaBolt, FaFire, FaClock, FaCheck, FaTimes, FaUsers, FaDoorOpen } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import { BRShareImage } from './BRShareImage';

interface BRScorecardProps {
    placement: number;
    totalPlayers: number;
    isWinner: boolean;
    playerName?: string;
    stats: {
        roundsSurvived: number;
        totalRounds: number;
        codesGuessed: number;
        totalGuesses: number;
        eliminatedInRound?: number;
        gameDuration: number;
    };
    onPlayAgain: () => void;
    onShare: () => void;
    onHome: () => void;
    onBackToLobby?: () => void;
}

// Neon Shockwave Animation Component - Golden theme for winner
const NeonShockwave: React.FC<{ active: boolean }> = ({ active }) => {
    if (!active) return null;

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[0, 1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                    style={{
                        animation: `shockwave 2s ease-out ${i * 0.3}s infinite`,
                        borderColor: i % 2 === 0 ? '#fbbf24' : '#f59e0b',
                        boxShadow: i % 2 === 0
                            ? '0 0 20px #fbbf24, 0 0 40px #fbbf24, inset 0 0 20px #fbbf24'
                            : '0 0 20px #f59e0b, 0 0 40px #f59e0b, inset 0 0 20px #f59e0b',
                    }}
                />
            ))}

            {[...Array(12)].map((_, i) => (
                <div
                    key={`spark-${i}`}
                    className="absolute w-1 h-8 bg-gradient-to-b from-yellow-400 to-transparent"
                    style={{
                        top: '50%',
                        left: '50%',
                        transform: `rotate(${i * 30}deg) translateY(-80px)`,
                        transformOrigin: 'center bottom',
                        animation: `sparkle 1.5s ease-out ${i * 0.1}s infinite`,
                        opacity: 0.8,
                    }}
                />
            ))}

            <style>{`
                @keyframes shockwave {
                    0% { width: 0; height: 0; opacity: 1; }
                    100% { width: 600px; height: 600px; opacity: 0; }
                }
                @keyframes sparkle {
                    0%, 100% { opacity: 0; transform: rotate(var(--rotation)) translateY(-80px) scaleY(0); }
                    50% { opacity: 1; transform: rotate(var(--rotation)) translateY(-120px) scaleY(1); }
                }
            `}</style>
        </div>
    );
};

// Stat Card Component
const StatCard: React.FC<{
    value: string | number;
    label: string;
    icon: React.ReactNode;
    highlight?: boolean;
}> = ({ value, label, icon, highlight }) => (
    <div className={`flex flex-col items-center p-4 rounded-xl border ${highlight
        ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/40'
        : 'bg-white/5 border-white/10'
        }`}>
        <div className={`text-2xl md:text-3xl font-black ${highlight ? 'text-emerald-400' : 'text-white'}`}>
            {value}
        </div>
        <div className="flex items-center gap-1 text-xs text-white/50 mt-1">
            {icon}
            <span>{label}</span>
        </div>
    </div>
);

// Home Menu Modal
const HomeMenuModal: React.FC<{
    onClose: () => void;
    onMainMenu: () => void;
    onBackToLobby?: () => void;
}> = ({ onClose, onMainMenu, onBackToLobby }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-white/10 p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Where to go?</h3>
                <button onClick={onClose} className="text-white/40 hover:text-white">
                    <FaTimes size={20} />
                </button>
            </div>

            <div className="space-y-3">
                <button
                    onClick={onMainMenu}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-3"
                >
                    <FaHome size={18} />
                    Main Menu
                </button>

                {onBackToLobby && (
                    <button
                        onClick={onBackToLobby}
                        className="w-full py-4 bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-3"
                    >
                        <FaDoorOpen size={18} />
                        Go Back to Lobby
                    </button>
                )}

                <button
                    onClick={onClose}
                    className="w-full py-3 text-white/50 hover:text-white transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
);

export const BRScorecard: React.FC<BRScorecardProps> = ({
    placement,
    totalPlayers,
    isWinner,
    playerName = 'Player',
    stats,
    onPlayAgain,
    onShare,
    onHome,
    onBackToLobby
}) => {
    const [showShockwave, setShowShockwave] = useState(false);
    const [showHomeMenu, setShowHomeMenu] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const shareRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isWinner) {
            setShowShockwave(true);
        }
    }, [isWinner]);

    const betterThanPercentage = Math.round(((totalPlayers - placement) / totalPlayers) * 100);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getOrdinal = (n: number) => {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    // Share functionality with canvas screenshot
    const handleShare = async () => {
        setIsSharing(true);

        try {
            if (shareRef.current) {
                const canvas = await html2canvas(shareRef.current, {
                    backgroundColor: '#0a0a0f',
                    scale: 2,
                    useCORS: true,
                    logging: false,
                });

                canvas.toBlob(async (blob) => {
                    if (blob) {
                        try {
                            if (navigator.share && navigator.canShare) {
                                const file = new File([blob], 'br-result.png', { type: 'image/png' });
                                const shareData = {
                                    title: 'Color Knockout - Battle Royale',
                                    text: isWinner
                                        ? `🏆 CHAMPION! I won the Color Knockout Battle Royale!`
                                        : `🎮 Finished ${getOrdinal(placement)} of ${totalPlayers} in Color Knockout!`,
                                    files: [file],
                                };

                                if (navigator.canShare(shareData)) {
                                    await navigator.share(shareData);
                                } else {
                                    // Fallback: download image
                                    downloadImage(canvas);
                                }
                            } else {
                                // Fallback: download image
                                downloadImage(canvas);
                            }
                        } catch (err) {
                            console.log('Share cancelled or failed');
                            downloadImage(canvas);
                        }
                    }
                    setIsSharing(false);
                }, 'image/png');
            }
        } catch (err) {
            console.error('Screenshot failed:', err);
            setIsSharing(false);
            onShare(); // Fallback to text share
        }
    };

    const downloadImage = (canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = `br-${isWinner ? 'champion' : 'result'}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
            {/* Hidden Share Image for Canvas Capture */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <BRShareImage
                    ref={shareRef}
                    placement={placement}
                    totalPlayers={totalPlayers}
                    isWinner={isWinner}
                    playerName={playerName}
                    stats={stats}
                />
            </div>

            <NeonShockwave active={showShockwave && isWinner} />

            {showHomeMenu && (
                <HomeMenuModal
                    onClose={() => setShowHomeMenu(false)}
                    onMainMenu={onHome}
                    onBackToLobby={onBackToLobby}
                />
            )}

            <div className={`relative w-full max-w-md bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border overflow-hidden ${isWinner ? 'border-yellow-500/50' : 'border-emerald-500/30'
                }`}>

                {isWinner ? (
                    <>
                        <div className="absolute -top-20 -left-20 w-60 h-60 bg-yellow-500/20 rounded-full blur-3xl" />
                        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl" />
                    </>
                ) : (
                    <>
                        <div className="absolute -top-20 -left-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl" />
                        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl" />
                    </>
                )}

                <div className={`relative p-8 text-center ${isWinner
                    ? 'bg-gradient-to-b from-yellow-500/20 to-transparent'
                    : 'bg-gradient-to-b from-gray-700/30 to-transparent'
                    }`}>
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${isWinner
                        ? 'bg-gradient-to-br from-yellow-400 to-amber-600 shadow-lg shadow-yellow-500/50'
                        : 'bg-gradient-to-br from-gray-600 to-gray-800 border-2 border-red-500/30'
                        }`}>
                        {isWinner ? (
                            <FaCrown className="text-white" size={36} />
                        ) : (
                            <FaSkull className="text-red-400" size={32} />
                        )}
                    </div>

                    <h1 className={`text-3xl md:text-4xl font-black tracking-tight ${isWinner
                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300'
                        : 'text-white'
                        }`}>
                        {isWinner ? 'CHAMPION!' : 'KNOCKED OUT'}
                    </h1>

                    <div className="mt-4 flex items-baseline justify-center gap-2">
                        <span className={`text-5xl md:text-6xl font-black ${isWinner ? 'text-yellow-400' : 'text-emerald-400'
                            }`}>
                            {getOrdinal(placement)}
                        </span>
                        <span className="text-white/50 text-lg">
                            of {totalPlayers} players
                        </span>
                    </div>

                    {!isWinner && stats.eliminatedInRound && (
                        <p className="mt-2 text-sm text-red-400/70">
                            Eliminated in Round {stats.eliminatedInRound}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-3 p-6">
                    <StatCard
                        value={stats.roundsSurvived}
                        label="ROUNDS"
                        icon={<FaFire size={10} />}
                        highlight={isWinner}
                    />
                    <StatCard
                        value={stats.totalGuesses}
                        label="GUESSES"
                        icon={<FaBolt size={10} />}
                    />
                    <StatCard
                        value={stats.codesGuessed}
                        label="CRACKED"
                        icon={<FaCheck size={10} />}
                        highlight
                    />
                </div>

                <div className="px-6 pb-4">
                    <div className="flex justify-between text-xs text-white/50 mb-2">
                        <span>Your Performance</span>
                        <span>Top {100 - betterThanPercentage}%</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
                            style={{ width: `${betterThanPercentage}%` }}
                        />
                    </div>
                    <p className="text-center text-sm text-white/40 mt-2">
                        Better than {betterThanPercentage}% of players
                    </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-white/40 text-sm pb-4">
                    <FaClock size={12} />
                    <span>Game lasted {formatTime(stats.gameDuration)}</span>
                </div>

                <div className="p-6 pt-0 space-y-3">
                    <button
                        onClick={onPlayAgain}
                        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                        <FaRedo size={16} />
                        PLAY AGAIN
                    </button>

                    <div className="grid grid-cols-2 gap-3 relative z-10">
                        <button
                            onClick={handleShare}
                            disabled={isSharing}
                            className="py-4 min-h-[52px] bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 active:bg-white/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation"
                        >
                            <FaShare size={14} />
                            {isSharing ? 'Sharing...' : 'Share'}
                        </button>
                        <button
                            onClick={() => setShowHomeMenu(true)}
                            className="py-4 min-h-[52px] bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 active:bg-white/30 transition-colors flex items-center justify-center gap-2 touch-manipulation"
                        >
                            <FaHome size={14} />
                            Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
