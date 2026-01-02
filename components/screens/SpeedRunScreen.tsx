import React, { useState, useEffect, useRef } from 'react';
import { Room } from '@/types';
import { Button } from '../Button';
import { useSound } from '../../hooks/useSound';
import { FaTrophy, FaBolt, FaArrowLeft, FaCheck, FaCircle, FaQuestionCircle } from 'react-icons/fa';
import { SpeedRunRulesModal } from '../SpeedRunRulesModal';

interface SpeedRunScreenProps {
    room: Room;
    playerId: string;
    onSubmitGuess: (code: string) => void;
    onInvalidGuess: (msg: string) => void;
    onQuit: () => void;
}

export const SpeedRunScreen: React.FC<SpeedRunScreenProps> = ({ room, playerId, onSubmitGuess, onInvalidGuess, onQuit }) => {
    const { playClick, playPop, playError, playSuccess } = useSound();
    const [currentCode, setCurrentCode] = useState('');
    const [lastScore, setLastScore] = useState(0);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [activeKey, setActiveKey] = useState<string | null>(null);
    const [showRulesModal, setShowRulesModal] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const player = room.players.find(p => p.id === playerId);
    const codeLength = room.settings.codeLength;

    // Handle window resize
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [player?.guesses.length]);

    // Focus input on desktop
    useEffect(() => {
        if (!isMobile && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isMobile, player?.guesses.length]);

    // Success animation
    useEffect(() => {
        const currentScore = player?.speedRunScore || 0;
        if (currentScore > lastScore) {
            playSuccess();
        }
        setLastScore(currentScore);
    }, [player?.speedRunScore, lastScore, playSuccess]);

    const handleKeypadPress = (key: string) => {
        playPop();
        setActiveKey(key);
        setTimeout(() => setActiveKey(null), 150);

        if (key === 'DEL') {
            setCurrentCode(prev => prev.slice(0, -1));
        } else if (key === 'CLEAR') {
            setCurrentCode('');
        } else if (currentCode.length < codeLength) {
            const newCode = currentCode + key;
            setCurrentCode(newCode);
            if (newCode.length === codeLength) {
                setTimeout(() => submit(newCode), 100);
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, codeLength);
        setCurrentCode(val);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && currentCode.length === codeLength) {
            submit(currentCode);
        }
    };

    const submit = (code: string) => {
        if (code.length !== codeLength) return;
        onSubmitGuess(code);
        setCurrentCode('');
        if (inputRef.current) inputRef.current.focus();
    };

    // Timer
    const [timeLeft, setTimeLeft] = useState(0);
    useEffect(() => {
        if (!room.gameEndTime) return;
        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((room.gameEndTime! - now) / 1000));
            setTimeLeft(remaining);
            if (remaining <= 0) clearInterval(interval);
        }, 1000);
        return () => clearInterval(interval);
    }, [room.gameEndTime]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const guesses = player?.guesses || [];

    // Premium Key Component with Light/Dark Theme Support
    const PremiumKey: React.FC<{ value: string; display?: string; variant?: 'number' | 'action' | 'delete' }> = ({ value, display, variant = 'number' }) => {
        const isActive = activeKey === value;

        const baseClasses = "relative overflow-hidden rounded-xl font-bold transition-all duration-150 active:scale-95";

        // Light theme: Purple-based | Dark theme: Gray-based
        const variantClasses = {
            number: `py-4 text-2xl 
                bg-white dark:bg-gradient-to-b dark:from-gray-700/80 dark:to-gray-800/80 
                backdrop-blur-sm border 
                border-purple-200 dark:border-gray-600/50 
                text-purple-700 dark:text-white 
                hover:bg-purple-50 dark:hover:from-purple-900/40 dark:hover:to-purple-950/40 
                hover:border-purple-300 dark:hover:border-purple-500/40 
                shadow-md dark:shadow-lg dark:shadow-black/20 
                ${isActive ? 'scale-95 bg-amber-100 dark:from-amber-500 dark:to-amber-600 border-amber-400 text-amber-700 dark:text-black shadow-amber-500/30' : ''}`,
            action: `py-4 text-sm 
                bg-red-50 dark:bg-gradient-to-b dark:from-red-900/60 dark:to-red-950/60 
                backdrop-blur-sm border 
                border-red-200 dark:border-red-800/50 
                text-red-500 dark:text-red-400 
                hover:bg-red-100 dark:hover:from-red-800/60 dark:hover:to-red-900/60 
                ${isActive ? 'scale-95 bg-red-200 dark:from-red-600 dark:to-red-700 text-red-700 dark:text-white' : ''}`,
            delete: `py-4 text-lg 
                bg-gray-100 dark:bg-gradient-to-b dark:from-gray-600/80 dark:to-gray-700/80 
                backdrop-blur-sm border 
                border-gray-300 dark:border-gray-500/50 
                text-gray-600 dark:text-gray-300 
                hover:bg-gray-200 dark:hover:from-purple-900/40 dark:hover:to-purple-950/40 
                hover:border-gray-400 dark:hover:border-purple-500/40 
                ${isActive ? 'scale-95 bg-gray-300 dark:from-gray-400 dark:to-gray-500 text-gray-800 dark:text-black' : ''}`
        };

        return (
            <button
                onClick={() => handleKeypadPress(value)}
                className={`${baseClasses} ${variantClasses[variant]}`}
            >
                {/* Glow effect on active */}
                {isActive && variant === 'number' && (
                    <div className="absolute inset-0 bg-amber-400/20 animate-pulse" />
                )}
                <span className="relative z-10">{display || value}</span>
            </button>
        );
    };

    return (
        <div className="w-full h-full flex flex-col bg-gradient-to-b from-gray-50 to-purple-50/30 dark:from-gray-900 dark:to-gray-950 text-gray-800 dark:text-white relative overflow-hidden pb-safe">

            {/* Background Glow Effects - Purple only */}
            <div className="absolute top-0 left-1/3 w-80 h-80 bg-purple-400/15 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-300/10 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-300/10 dark:bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* === TOP BAR === */}
            <header className="flex-shrink-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl px-4 py-3 border-b border-purple-200 dark:border-purple-500/20 shadow-lg shadow-purple-500/10 dark:shadow-purple-900/10 z-20 flex justify-between items-center">
                <Button variant="ghost" onClick={onQuit} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white p-2">
                    <FaArrowLeft size={18} />
                </Button>

                {/* Timer - Center */}
                <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
                    <div className={`text-3xl md:text-4xl font-mono font-black tracking-tight ${timeLeft < 10 ? 'text-red-500 animate-pulse' : timeLeft < 30 ? 'text-amber-500 dark:text-amber-400' : 'text-gray-800 dark:text-white'}`}>
                        {formatTime(timeLeft)}
                    </div>
                </div>

                {/* Score + Help */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowRulesModal(true)}
                        className="text-gray-500 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors p-2"
                        title="How to Play"
                    >
                        <FaQuestionCircle size={18} />
                    </button>
                    <div className="bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-500/20 dark:to-yellow-500/20 backdrop-blur-sm text-amber-600 dark:text-amber-400 px-4 py-2 rounded-xl border border-amber-300 dark:border-amber-500/30 flex items-center gap-2 shadow-lg shadow-amber-500/10">
                        <FaTrophy size={16} />
                        <span className="text-xl font-black">{player?.speedRunScore || 0}</span>
                    </div>
                </div>
            </header>

            {/* Rules Modal */}
            {showRulesModal && <SpeedRunRulesModal onClose={() => setShowRulesModal(false)} />}

            {/* === MAIN CONTENT (Command Center Layout) === */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

                {/* LEFT/TOP: Guess History */}
                <div className="flex-1 flex flex-col min-h-0 md:border-r md:border-gray-200 dark:md:border-gray-700/50">
                    <div className="px-4 py-2 border-b border-purple-200 dark:border-purple-500/20 flex items-center justify-between bg-white/40 dark:bg-gray-800/40">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-300/80 uppercase tracking-wider">Guess History</span>
                        <span className="text-xs font-mono text-purple-500 dark:text-purple-400/70">{guesses.length} tries</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2" ref={scrollRef}>
                        {guesses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center opacity-60 dark:opacity-40">
                                <div className="mb-2 text-purple-500 dark:text-purple-400"><FaBolt size={32} /></div>
                                <p className="text-sm font-medium text-purple-600 dark:text-purple-200">Start guessing!</p>
                                <p className="text-xs text-gray-500">{codeLength}-digit codes</p>
                            </div>
                        ) : (
                            guesses.map((guess, index) => (
                                <div key={guess.id} className="p-3 bg-white/60 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-purple-200 dark:border-purple-500/20 animate-fadeIn hover:border-purple-400 dark:hover:border-purple-500/40 transition-colors shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-6">#{index + 1}</span>
                                            <div className="flex gap-1.5">
                                                {guess.code.split('').map((digit, i) => (
                                                    <div key={i} className="w-9 h-11 flex items-center justify-center font-mono text-lg font-black bg-purple-100 dark:bg-gray-800/80 text-purple-700 dark:text-white rounded-lg border border-purple-300 dark:border-purple-500/30 shadow-inner">
                                                        {digit}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {guess.hits > 0 && (
                                                <div className="flex items-center gap-1 px-2.5 py-1 bg-green-100 dark:bg-green-500/20 backdrop-blur-sm text-green-600 dark:text-green-400 rounded-full text-xs font-bold border border-green-300 dark:border-green-500/30">
                                                    <FaCheck size={10} />
                                                    <span>{guess.hits}</span>
                                                </div>
                                            )}
                                            {guess.pseudoHits > 0 && (
                                                <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-500/20 backdrop-blur-sm text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-300 dark:border-amber-500/30">
                                                    <FaCircle size={8} />
                                                    <span>{guess.pseudoHits}</span>
                                                </div>
                                            )}
                                            {guess.hits === 0 && guess.pseudoHits === 0 && (
                                                <span className="text-xs text-gray-400 dark:text-gray-500 px-2">No match</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 pl-9">{guess.feedbackMessage}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT/BOTTOM: Input Area */}
                <div className="flex-shrink-0 md:w-80 lg:w-96 bg-purple-100/50 dark:bg-gray-800/50 backdrop-blur-sm border-t md:border-t-0 border-purple-200 dark:border-purple-500/20 p-4 flex flex-col justify-center">

                    {/* Code Display - LED Style */}
                    <div className="flex justify-center mb-6">
                        <div className="flex gap-2 p-3 bg-purple-200/70 dark:bg-gray-900/70 rounded-2xl border border-purple-300 dark:border-purple-500/30 shadow-inner shadow-purple-400/20 dark:shadow-purple-900/20">
                            {Array.from({ length: codeLength }, (_, i) => (
                                <div key={i} className={`w-14 h-16 md:w-16 md:h-20 rounded-xl flex items-center justify-center text-3xl md:text-4xl font-black border-2 transition-all duration-200 ${currentCode[i]
                                    ? 'border-amber-500 bg-gradient-to-b from-amber-100 to-amber-200 dark:from-amber-500/20 dark:to-amber-600/10 text-amber-700 dark:text-white shadow-lg shadow-amber-500/20'
                                    : 'border-purple-300 dark:border-gray-700 bg-white/60 dark:bg-gray-800/50 text-purple-400 dark:text-gray-600'
                                    }`}>
                                    <span className={currentCode[i] ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : ''}>
                                        {currentCode[i] || ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Desktop: Text Input */}
                    {!isMobile && (
                        <div className="mb-4 space-y-3">
                            <input
                                ref={inputRef}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={currentCode}
                                onChange={handleInputChange}
                                onKeyDown={handleInputKeyDown}
                                placeholder={`Enter ${codeLength} digits...`}
                                className="w-full px-4 py-3 bg-white dark:bg-gray-800/60 backdrop-blur-sm border border-purple-300 dark:border-gray-600/50 rounded-xl text-center text-xl font-mono font-bold text-purple-700 dark:text-white placeholder:text-purple-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                maxLength={codeLength}
                            />
                            <button
                                onClick={() => submit(currentCode)}
                                disabled={currentCode.length !== codeLength}
                                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700 disabled:text-gray-500 text-black font-black rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20 disabled:shadow-none"
                            >
                                SUBMIT GUESS
                            </button>
                        </div>
                    )}

                    {/* Mobile: Premium Keypad */}
                    {isMobile && (
                        <div className="grid grid-cols-3 gap-2.5">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <PremiumKey key={num} value={num.toString()} />
                            ))}
                            <PremiumKey value="CLEAR" display="CLR" variant="action" />
                            <PremiumKey value="0" />
                            <PremiumKey value="DEL" display="⌫" variant="delete" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
