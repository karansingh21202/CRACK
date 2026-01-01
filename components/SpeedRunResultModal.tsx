import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Room, GameState } from '../types';
import { FaTrophy, FaBolt, FaMedal, FaCrown, FaRedo, FaHome, FaFire, FaShareAlt, FaImage, FaCheck, FaGem, FaStopwatch, FaTachometerAlt } from 'react-icons/fa';
import { useSound } from '../hooks/useSound';
import { ConfirmationModal } from './ConfirmationModal';
import html2canvas from 'html2canvas';
import { Fireworks } from './Fireworks';

interface SpeedRunResultModalProps {
    room: Room | null;
    playerId: string | null;
    onPlayAgain: () => void;
    onHome: () => void;
}

export const SpeedRunResultModal: React.FC<SpeedRunResultModalProps> = ({ room, playerId, onPlayAgain, onHome }) => {
    const { playSuccess, playClick, playPop } = useSound();
    const [animatedScore, setAnimatedScore] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);
    const [hasPlayedSound, setHasPlayedSound] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const shareRef = useRef<HTMLDivElement>(null);

    // Determine if modal should be visible
    const isVisible = room && room.gameMode === 'SPEED_RUN' && (room.gameState === GameState.Won || room.gameState === GameState.Lost);

    // Calculate derived values - use useMemo to avoid recalculation
    const { player, finalScore, isSolo, sortedPlayers, isWinner, playerRank, duration } = useMemo(() => {
        if (!room) {
            return { player: null, finalScore: 0, isSolo: false, sortedPlayers: [], isWinner: false, playerRank: 0, duration: 180 };
        }
        const player = room.players.find(p => p.id === playerId);
        const finalScore = player?.speedRunScore || 0;
        const isSolo = room.id === 'speedrun-solo';
        const sortedPlayers = [...room.players].sort((a, b) => (b.speedRunScore || 0) - (a.speedRunScore || 0));
        const isWinner = sortedPlayers[0]?.id === playerId;
        const playerRank = sortedPlayers.findIndex(p => p.id === playerId) + 1;
        const duration = room.settings.timerDurationSeconds || 180;
        return { player, finalScore, isSolo, sortedPlayers, isWinner, playerRank, duration };
    }, [room, playerId]);

    // Animate score count up - MUST be called unconditionally
    useEffect(() => {
        if (!isVisible || finalScore === 0) {
            setAnimatedScore(0);
            return;
        }

        // Reset and start counting
        setAnimatedScore(0);
        const step = Math.ceil(finalScore / 20);
        const interval = setInterval(() => {
            setAnimatedScore(prev => {
                if (prev >= finalScore) {
                    clearInterval(interval);
                    return finalScore;
                }
                return Math.min(prev + step, finalScore);
            });
        }, 50);
        return () => clearInterval(interval);
    }, [isVisible, finalScore]);

    // Play success sound and show confetti when modal becomes visible - MUST be called unconditionally
    useEffect(() => {
        if (!isVisible) {
            setHasPlayedSound(false);
            setShowConfetti(false);
            return;
        }

        if (!hasPlayedSound) {
            playSuccess();
            setHasPlayedSound(true);
            if (isWinner || isSolo) {
                setShowConfetti(true);
                const timeout = setTimeout(() => setShowConfetti(false), 3000);
                return () => clearTimeout(timeout);
            }
        }
    }, [isVisible, hasPlayedSound, playSuccess, isWinner, isSolo]);

    // Early return AFTER all hooks
    if (!isVisible) return null;

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <span className="text-yellow-400"><FaCrown size={20} /></span>;
            case 2: return <span className="text-gray-300"><FaMedal size={18} /></span>;
            case 3: return <span className="text-amber-600"><FaMedal size={18} /></span>;
            default: return <span className="text-gray-500 font-mono">{rank}</span>;
        }
    };

    const getTitle = () => {
        if (isSolo) return "SPEED RUN COMPLETE";
        if (isWinner) return "YOU WON!";
        return "TIME'S UP!";
    };

    const getSubtitle = () => {
        if (isSolo) return "Great run!";
        if (isWinner) return "SPEED CHAMPION";
        if (playerRank === 2) return "So close! Almost had it!";
        return "Better luck next time!";
    };

    const handleHomeClick = () => {
        playClick();
        setShowExitConfirm(true);
    };

    // Share link functionality
    const handleShareLink = async () => {
        const shareText = `⚡ Speed Run Complete!\n🏆 ${finalScore} codes cracked in ${formatDuration(duration)}\n📈 Rate: ${(finalScore / (duration / 60)).toFixed(1)}/min\n\nCan you beat my score?`;
        const shareData = { title: 'Speed Run - Crack The Code', text: shareText, url: window.location.origin };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try { await navigator.share(shareData); return; } catch (err) { console.log("Share failed", err); }
        }

        const clipboardText = `${shareText} Play now: ${window.location.origin}`;
        navigator.clipboard.writeText(clipboardText).then(() => {
            setCopied(true);
            playPop();
            setTimeout(() => setCopied(false), 2000);
        }).catch(err => console.error('Failed to copy:', err));
    };

    // Share image functionality
    const handleShareImage = async () => {
        if (!shareRef.current) return;
        setIsGeneratingImage(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            const canvas = await html2canvas(shareRef.current, {
                scale: 2,
                backgroundColor: '#1f2937',
                logging: false,
                useCORS: true
            });

            canvas.toBlob(async (blob) => {
                if (!blob) return;

                if (navigator.share && navigator.canShare) {
                    const file = new File([blob], 'speedrun-result.png', { type: 'image/png' });
                    const shareData = {
                        title: 'Speed Run Result',
                        text: `I cracked ${finalScore} codes in ${formatDuration(duration)}! Can you beat my score?`,
                        files: [file]
                    };
                    if (navigator.canShare(shareData)) {
                        try {
                            await navigator.share(shareData);
                            setIsGeneratingImage(false);
                            return;
                        } catch (err) { console.log("Native share failed/cancelled", err); }
                    }
                }

                // Fallback: Download
                const link = document.createElement('a');
                link.download = 'speedrun-result.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
                setIsGeneratingImage(false);
            }, 'image/png');
        } catch (err) {
            console.error("Image generation failed", err);
            setIsGeneratingImage(false);
        }
    };

    // Locked Background Pattern (Ripple)
    const renderBackgroundPattern = () => (
        <div className="absolute inset-0 opacity-30 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Top Left Ripples - Integrated with corner */}
                <circle cx="0" cy="0" r="25" fill="none" stroke="url(#gold-gradient-ripple)" strokeWidth="0.8" />
                <circle cx="0" cy="0" r="45" fill="none" stroke="url(#gold-gradient-ripple)" strokeWidth="0.4" />
                <circle cx="0" cy="0" r="65" fill="none" stroke="url(#gold-gradient-ripple)" strokeWidth="0.2" />

                {/* Bottom Right Ripples - Integrated with corner */}
                <circle cx="100" cy="100" r="25" fill="none" stroke="url(#gold-gradient-ripple)" strokeWidth="0.8" />
                <circle cx="100" cy="100" r="45" fill="none" stroke="url(#gold-gradient-ripple)" strokeWidth="0.4" />
                <circle cx="100" cy="100" r="65" fill="none" stroke="url(#gold-gradient-ripple)" strokeWidth="0.2" />

                <defs>
                    <linearGradient id="gold-gradient-ripple" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#d4af37" stopOpacity="0.9" />
                        <stop offset="50%" stopColor="#fcf6ba" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#d4af37" stopOpacity="0.1" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#1a0b2e_95%)]"></div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            {/* Celebration Effect - Fireworks */}
            {showConfetti && <Fireworks duration={6000} />}

            {/* Main Card Container ... */}
            <div className="w-full max-w-md relative animate-popIn">
                {/* Golden/Metallic Gradient Border Wrapper */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-yellow-600 via-yellow-200 to-yellow-600 p-[3px] shadow-2xl shadow-purple-900/50">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-600/20 to-transparent blur-md"></div>
                </div>

                {/* Inner Card Content */}
                <div className="relative bg-[#1a0b2e] rounded-[calc(1.5rem-2px)] overflow-hidden h-full flex flex-col">
                    {/* Render Locked Background Pattern */}
                    {renderBackgroundPattern()}

                    {/* Header Section */}
                    <div className="relative pt-8 pb-4 text-center z-10">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <span className="text-amber-400 animate-pulse"><FaBolt size={20} /></span>
                            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-200 to-white tracking-widest uppercase filter drop-shadow-lg">
                                {getTitle()}
                            </h2>
                            <span className="text-amber-400 animate-pulse"><FaBolt size={20} /></span>
                        </div>
                        <p className="text-purple-200/80 text-sm font-medium tracking-wide uppercase">{getSubtitle()}</p>
                    </div>

                    {/* Divider Line */}
                    <div className="w-3/4 mx-auto h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>

                    {/* Score Section */}
                    <div className="relative py-8 text-center z-10 flex-1 flex flex-col justify-center">
                        {isSolo ? (
                            <>
                                {/* Solo Mode: Large Trophy & Score */}
                                <div className="mb-6 relative inline-block mx-auto">
                                    <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse"></div>
                                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 p-[2px] shadow-lg shadow-amber-500/20">
                                        <div className="w-full h-full rounded-full bg-[#2a1b3d] flex items-center justify-center border-4 border-[#1a0b2e]">
                                            <FaTrophy className="text-amber-400 text-4xl drop-shadow-md" />
                                        </div>
                                    </div>
                                </div>
                                <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-500 tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] leading-none mb-2">
                                    {animatedScore}
                                </div>
                                <p className="text-purple-200 text-sm font-bold uppercase tracking-[0.2em] mb-8">
                                    Codes Cracked
                                </p>
                                {/* Solo Stats Grid */}
                                <div className="flex justify-center items-center gap-8 mx-8 pb-4">
                                    <div className="text-center group">
                                        <div className="text-gray-400 text-[10px] uppercase tracking-widest mb-1 group-hover:text-amber-300 transition-colors">Time</div>
                                        <div className="text-2xl font-bold text-white font-mono">{formatDuration(duration)}</div>
                                    </div>
                                    <div className="w-px h-10 bg-gradient-to-b from-transparent via-gray-600 to-transparent"></div>
                                    <div className="text-center group">
                                        <div className="text-gray-400 text-[10px] uppercase tracking-widest mb-1 group-hover:text-amber-300 transition-colors">Rate</div>
                                        <div className="text-2xl font-bold text-white font-mono">{(finalScore / (duration / 60)).toFixed(1)}<span className="text-sm text-gray-500 ml-1">/min</span></div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Multiplayer Mode: Comparison View */}
                                <div className="px-6">
                                    <div className="bg-black/30 rounded-2xl border border-white/10 p-4 relative overflow-hidden">
                                        {/* VS Badge */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-amber-500 to-red-500 rounded-full flex items-center justify-center font-black text-white text-xs border-4 border-[#1a0b2e] z-10 shadow-lg">
                                            VS
                                        </div>

                                        <div className="flex justify-between items-center relative z-0">
                                            {/* You */}
                                            <div className="text-center flex-1 pr-4">
                                                <div className="text-purple-300 text-xs font-bold uppercase mb-2">You</div>
                                                <div className="text-5xl font-black text-white mb-1 transition-all duration-500">{animatedScore}</div>
                                                <div className="text-[10px] text-gray-500 uppercase tracking-wider">Score</div>
                                                <div className={`mt-2 text-xs font-bold ${isWinner ? 'text-green-400' : 'text-red-400'}`}>
                                                    {isWinner ? 'Winner' : `#${playerRank} Place`}
                                                </div>
                                            </div>

                                            {/* Opponent (Winner or 2nd Place) */}
                                            <div className="text-center flex-1 pl-4 opacity-90">
                                                <div className="text-amber-300 text-xs font-bold uppercase mb-2">
                                                    {isWinner ? 'Runner Up' : 'Winner'}
                                                </div>
                                                <div className="text-4xl font-black text-amber-500 mb-1">
                                                    {isWinner ? (sortedPlayers[1]?.speedRunScore || 0) : (sortedPlayers[0]?.speedRunScore || 0)}
                                                </div>
                                                <div className="text-[10px] text-gray-500 uppercase tracking-wider">Score</div>
                                                <div className="mt-2 text-xs font-bold text-gray-400">
                                                    {isWinner ? sortedPlayers[1]?.name || 'N/A' : sortedPlayers[0]?.name || 'Unknown'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mini Leaderboard below comparison */}
                                    <div className="mt-4 flex flex-col gap-1">
                                        {sortedPlayers.slice(0, 3).map((p, idx) => (
                                            <div key={p.id} className={`flex justify-between items-center px-3 py-2 rounded-lg text-xs ${p.id === playerId ? 'bg-purple-600/20 border border-purple-500/30' : 'bg-white/5'}`}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`${idx === 0 ? 'text-amber-400' : 'text-gray-400'} font-bold w-4`}>#{idx + 1}</span>
                                                    <span className={p.id === playerId ? 'text-white font-bold' : 'text-gray-300'}>{p.name}</span>
                                                </div>
                                                <span className="font-mono font-bold text-amber-200">{p.speedRunScore}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Action Area */}
                    <div className="p-6 bg-[#150925]/50 backdrop-blur-md border-t border-white/5 z-20">
                        <div className="flex gap-3 mb-4">
                            {/* Share Buttons - Elegant Outline Style */}
                            <Button
                                onClick={handleShareLink}
                                variant="ghost"
                                className="flex-1 py-3 bg-[#1a0b2e] border border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/5 text-amber-200/80 rounded-xl transition-all duration-300 group"
                            >
                                <span className={`flex items-center justify-center gap-2 font-medium ${copied ? 'text-green-400' : ''}`}>
                                    {copied ? <FaCheck /> : <FaShareAlt className="group-hover:scale-110 transition-transform" />}
                                    {copied ? 'Copied' : 'Share Link'}
                                </span>
                            </Button>

                            <Button
                                onClick={handleShareImage}
                                disabled={isGeneratingImage}
                                variant="ghost"
                                className="flex-1 py-3 bg-[#1a0b2e] border border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/5 text-amber-200/80 rounded-xl transition-all duration-300 group"
                            >
                                <span className="flex items-center justify-center gap-2 font-medium">
                                    {isGeneratingImage ? <span className="animate-spin">⌛</span> : <FaImage className="group-hover:scale-110 transition-transform" />}
                                    Share Score
                                </span>
                            </Button>
                        </div>

                        <div className="flex gap-3">
                            {/* Play Again - Premium Gradient */}
                            <Button
                                onClick={() => { playClick(); onPlayAgain(); }}
                                className="flex-1 py-4 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 uppercase tracking-wide text-sm border border-purple-400/30"
                            >
                                <FaRedo className="animate-spin-slow" /> Play Again
                            </Button>

                            {/* Home Button */}
                            <Button
                                onClick={handleHomeClick}
                                variant="secondary"
                                className="w-14 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 rounded-xl flex items-center justify-center transition-colors"
                            >
                                <FaHome size={18} />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Exit Confirmation Modal */}
            <ConfirmationModal
                isOpen={showExitConfirm}
                title="Leave Game?"
                message="Are you sure you want to leave? Your score won't be saved."
                onConfirm={() => {
                    setShowExitConfirm(false);
                    onHome();
                }}
                onCancel={() => setShowExitConfirm(false)}
                confirmText="Leave"
            />

            {/* Hidden Share Image - User's Custom Design */}
            <div className="fixed left-[-9999px] top-[-9999px]">
                <div
                    ref={shareRef}
                    className="w-[540px] h-[720px] relative overflow-hidden"
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                >
                    {/* Purple Gradient Background - Darker */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: 'linear-gradient(135deg, #0f0825 0%, #1a0d35 25%, #2a1545 50%, #1a0d35 75%, #0f0825 100%)'
                        }}
                    ></div>

                    {/* Circuit Pattern - Left Side - Use solid strokes for html2canvas */}
                    <svg className="absolute left-0 top-0 h-full w-48 opacity-70" viewBox="0 0 200 720" preserveAspectRatio="xMinYMid slice">
                        <path d="M0,40 H70 L90,60 H200" stroke="#f0c850" strokeWidth="2" fill="none" />
                        <circle cx="70" cy="40" r="5" fill="#f0c850" />
                        <path d="M0,90 H100 L120,110 H200" stroke="#d4a855" strokeWidth="2" fill="none" />
                        <circle cx="100" cy="90" r="4" fill="#f0c850" />
                        <path d="M0,140 H60 L80,160 H200" stroke="#f0c850" strokeWidth="2" fill="none" />
                        <circle cx="60" cy="140" r="4" fill="#f0c850" />
                        <path d="M0,200 H90 L110,220 H200" stroke="#d4a855" strokeWidth="2" fill="none" />
                        <circle cx="90" cy="200" r="5" fill="#f0c850" />
                        <path d="M0,260 H50 L70,280 H130 L150,260 H200" stroke="#f0c850" strokeWidth="2" fill="none" />
                        <circle cx="50" cy="260" r="4" fill="#f0c850" />
                        <circle cx="130" cy="280" r="5" fill="#f0c850" />
                        <path d="M0,340 H110 L130,320 H200" stroke="#d4a855" strokeWidth="2" fill="none" />
                        <circle cx="110" cy="340" r="4" fill="#f0c850" />
                        <path d="M0,400 H80 L100,420 H200" stroke="#f0c850" strokeWidth="2" fill="none" />
                        <circle cx="80" cy="400" r="5" fill="#f0c850" />
                        <path d="M0,460 H60 L80,480 H200" stroke="#d4a855" strokeWidth="2" fill="none" />
                        <circle cx="60" cy="460" r="4" fill="#f0c850" />
                        <path d="M0,520 H100 L120,500 H200" stroke="#f0c850" strokeWidth="2" fill="none" />
                        <circle cx="100" cy="520" r="4" fill="#f0c850" />
                        <path d="M0,580 H70 L90,600 H200" stroke="#d4a855" strokeWidth="2" fill="none" />
                        <circle cx="70" cy="580" r="5" fill="#f0c850" />
                        <path d="M0,640 H90 L110,660 H200" stroke="#f0c850" strokeWidth="2" fill="none" />
                        <circle cx="90" cy="640" r="4" fill="#f0c850" />
                        <path d="M0,700 H60 L80,680 H200" stroke="#d4a855" strokeWidth="2" fill="none" />
                        <circle cx="60" cy="700" r="5" fill="#f0c850" />
                    </svg>

                    {/* Circuit Pattern - Right Side (Denser, Brighter) - Use solid strokes for html2canvas */}
                    <svg className="absolute right-0 top-0 h-full w-48 opacity-70" viewBox="0 0 200 720" preserveAspectRatio="xMaxYMid slice">
                        <path d="M200,50 H130 L110,70 H0" stroke="#f0c850" strokeWidth="2" fill="none" />
                        <circle cx="130" cy="50" r="5" fill="#f0c850" />
                        <path d="M200,100 H100 L80,120 H0" stroke="#d4a855" strokeWidth="2" fill="none" />
                        <circle cx="100" cy="100" r="4" fill="#f0c850" />
                        <path d="M200,160 H140 L120,180 H0" stroke="#f0c850" strokeWidth="2" fill="none" />
                        <circle cx="140" cy="160" r="4" fill="#f0c850" />
                        <path d="M200,220 H90 L70,240 H0" stroke="#d4a855" strokeWidth="2" fill="none" />
                        <circle cx="90" cy="220" r="5" fill="#f0c850" />
                        <path d="M200,280 H150 L130,300 H70 L50,280 H0" stroke="#f0c850" strokeWidth="2" fill="none" />
                        <circle cx="150" cy="280" r="4" fill="#f0c850" />
                        <circle cx="70" cy="300" r="5" fill="#f0c850" />
                        <path d="M200,360 H80 L60,340 H0" stroke="#d4a855" strokeWidth="2" fill="none" />
                        <circle cx="80" cy="360" r="4" fill="#f0c850" />
                        <path d="M200,420 H120 L100,440 H0" stroke="#f0c850" strokeWidth="2" fill="none" />
                        <circle cx="120" cy="420" r="5" fill="#f0c850" />
                        <path d="M200,480 H70 L50,500 H0" stroke="#d4a855" strokeWidth="2" fill="none" />
                        <circle cx="70" cy="480" r="4" fill="#f0c850" />
                        <path d="M200,540 H100 L80,520 H0" stroke="#f0c850" strokeWidth="2" fill="none" />
                        <circle cx="100" cy="540" r="4" fill="#f0c850" />
                        <path d="M200,600 H130 L110,620 H0" stroke="#d4a855" strokeWidth="2" fill="none" />
                        <circle cx="130" cy="600" r="5" fill="#f0c850" />
                        <path d="M200,660 H90 L70,680 H0" stroke="#f0c850" strokeWidth="2" fill="none" />
                        <circle cx="90" cy="660" r="4" fill="#f0c850" />
                        <path d="M200,710 H60 L40,690 H0" stroke="#d4a855" strokeWidth="2" fill="none" />
                        <circle cx="60" cy="710" r="5" fill="#f0c850" />
                    </svg>

                    {/* Gold Top Border */}
                    <div className="absolute top-0 left-0 right-0 h-2" style={{ background: 'linear-gradient(90deg, #8b6914, #d4a855, #f0c850, #d4a855, #8b6914)' }}></div>

                    {/* Content Container */}
                    <div className="relative z-10 h-full flex flex-col px-10 py-8">

                        {/* Header - Speed Run Title */}
                        <div className="flex items-center justify-center gap-4 mt-2 mb-6">
                            <FaBolt className="text-amber-400 text-2xl" style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.6))' }} />
                            <span className="text-amber-400 font-black text-2xl tracking-widest uppercase" style={{ textShadow: '0 2px 10px rgba(251,191,36,0.4)' }}>SPEED RUN</span>
                            <FaBolt className="text-amber-400 text-2xl" style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.6))' }} />
                        </div>

                        {/* Trophy - Simple Clean Style (no blur for html2canvas) */}
                        <div className="flex justify-center mb-4">
                            <FaTrophy
                                size={100}
                                color="#c9a227"
                            />
                        </div>

                        {/* Score Display - Solid Gold (html2canvas compatible) */}
                        <div className="text-center mb-6">
                            <span
                                style={{
                                    fontSize: '110px',
                                    fontWeight: 900,
                                    lineHeight: 1,
                                    color: '#c9a227',
                                    letterSpacing: '-0.02em'
                                }}
                            >
                                {finalScore}
                            </span>
                        </div>

                        {/* Codes Cracked Label */}
                        <div
                            className="text-center text-xl font-bold uppercase mb-8"
                            style={{
                                color: '#d4a855',
                                letterSpacing: '0.4em',
                                textShadow: '0 2px 8px rgba(139,105,20,0.4)'
                            }}
                        >
                            CODES CRACKED
                        </div>

                        {/* Stats Cards Row */}
                        <div className="flex gap-4 mb-6">
                            {/* Time Card - with Stopwatch icon */}
                            <div
                                className="flex-1 rounded-xl p-4 flex items-center gap-4"
                                style={{
                                    background: 'rgba(30,15,50,0.7)',
                                    border: '2px solid #c9a227'
                                }}
                            >
                                <FaStopwatch size={32} color="#d4a855" style={{ filter: 'drop-shadow(0 2px 4px rgba(139,105,20,0.5))' }} />
                                <div className="flex-1 text-center">
                                    <div className="text-amber-400/70 text-xs uppercase tracking-widest mb-1">TIME</div>
                                    <div style={{ color: '#f0c850', fontSize: '28px', fontWeight: 900, fontFamily: 'monospace' }}>{formatDuration(duration)}</div>
                                </div>
                            </div>

                            {/* Rate Card - with Speedometer icon */}
                            <div
                                className="flex-1 rounded-xl p-4 flex items-center gap-4"
                                style={{
                                    background: 'rgba(30,15,50,0.7)',
                                    border: '2px solid #c9a227'
                                }}
                            >
                                <div className="flex-1 text-center">
                                    <div className="text-amber-400/70 text-xs uppercase tracking-widest mb-1">RATE</div>
                                    <div style={{ color: '#f0c850', fontSize: '28px', fontWeight: 900, fontFamily: 'monospace' }}>
                                        {(finalScore / (duration / 60)).toFixed(1)}
                                        <span style={{ fontSize: '16px', color: 'rgba(240,200,80,0.6)' }}>/min</span>
                                    </div>
                                </div>
                                <FaTachometerAlt size={32} color="#d4a855" style={{ filter: 'drop-shadow(0 2px 4px rgba(139,105,20,0.5))' }} />
                            </div>
                        </div>

                        {/* Spacer */}
                        <div className="flex-1"></div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <div className="flex items-center gap-2">
                                <FaGem size={18} color="#a78bfa" />
                                <span className="text-white font-bold text-base">crack-pi-ruddy.vercel.app</span>
                            </div>
                            <div className="flex items-center gap-2 text-amber-400/80 text-sm font-medium">
                                Can you beat this?
                                <span className="text-amber-400">→</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
