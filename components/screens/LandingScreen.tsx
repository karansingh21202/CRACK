import React, { useState } from 'react';
import { Card } from '../Card';
import { Logo } from '../Logo';
import { Button } from '../Button';
import { useSound } from '../../hooks/useSound';
import { GameMode } from '@/types';
import { FaBolt, FaUsers, FaGamepad, FaClock, FaFire, FaCrown, FaArrowLeft, FaLock, FaPuzzlePiece, FaRandom, FaUser } from 'react-icons/fa';

interface LandingScreenProps {
    onCreateRoom: (mode: GameMode, timerDuration?: number, isMultiplayer?: boolean, codeLength?: number) => void;
    onJoinRoom: (roomId: string) => void;
}

type ActiveModal = 'none' | 'newModes' | 'classic' | 'speedRunTimer' | 'speedRunChoice' | 'loading';

export const LandingScreen: React.FC<LandingScreenProps> = ({ onCreateRoom, onJoinRoom }) => {
    const [showJoinInput, setShowJoinInput] = useState(false);
    const [joinRoomId, setJoinRoomId] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [activeModal, setActiveModal] = useState<ActiveModal>('none');
    const [selectedSpeedRunDuration, setSelectedSpeedRunDuration] = useState<number>(180);
    const [selectedCodeLength, setSelectedCodeLength] = useState<number>(4);

    const { playPop, playHover } = useSound();

    const handleJoinClick = () => {
        if (joinRoomId.trim()) {
            setIsJoining(true);
            onJoinRoom(joinRoomId.trim().toUpperCase());
            setTimeout(() => setIsJoining(false), 3000);
        }
    };

    const handleSpeedRunClick = (duration: number) => {
        setSelectedSpeedRunDuration(duration);
        setActiveModal('speedRunChoice');
    };

    const handleSpeedRunSolo = () => {
        setActiveModal('none');
        onCreateRoom('SPEED_RUN', selectedSpeedRunDuration, false, selectedCodeLength);
    };

    const handleSpeedRunMultiplayer = () => {
        setActiveModal('loading');
        onCreateRoom('SPEED_RUN', selectedSpeedRunDuration, true, selectedCodeLength);
    };

    const handleClassicClick = (mode: 'DUEL' | 'FFA') => {
        setActiveModal('loading');
        onCreateRoom(mode);
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 text-center animate-fadeIn shadow-2xl bg-white/95 dark:bg-dark-card/95 backdrop-blur-xl border border-light-subtle-border dark:border-dark-subtle-border overflow-hidden relative">

                {/* Glassmorphism decorative elements */}
                <div className="absolute -top-16 -right-16 w-32 h-32 bg-secondary-accent/10 dark:bg-primary-accent/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />

                {/* Header */}
                <div className="flex flex-col items-center mb-5 relative z-10">
                    <div className="w-14 h-14 mb-2 animate-popIn drop-shadow-xl">
                        <Logo className="w-full h-full" />
                    </div>
                    <h2 className="text-2xl font-black text-secondary-accent dark:text-primary-accent tracking-tight">
                        CRACK THE CODE
                    </h2>
                    <p className="text-light-text/50 dark:text-dark-text/50 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                        Select Game Mode
                    </p>
                </div>

                {/* MAIN VIEW: Game Mode Cards */}
                {activeModal === 'none' && (
                    <div className="grid grid-cols-2 gap-3 mb-6 relative z-10 animate-fadeIn">
                        {/* NEW GAME MODES */}
                        <button
                            onClick={() => { playHover(); setActiveModal('newModes'); }}
                            className="col-span-2 group relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 text-white p-4 rounded-xl shadow-md transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute -bottom-3 -right-3 opacity-10 transform group-hover:scale-110 transition-transform">
                                <FaFire size={50} />
                            </div>
                            <div className="relative z-10 flex items-center gap-2">
                                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                                    <FaFire size={16} />
                                </div>
                                <div className="text-left">
                                    <div className="font-black text-sm tracking-wide">NEW GAME MODES</div>
                                    <div className="text-[10px] font-semibold opacity-80">Speed Run & More</div>
                                </div>
                            </div>
                            <span className="absolute top-1.5 right-1.5 text-[8px] font-bold bg-white/20 backdrop-blur-sm px-1.5 py-0.5 rounded-full">NEW</span>
                        </button>

                        {/* CLASSIC MODE */}
                        <button
                            onClick={() => { playHover(); setActiveModal('classic'); }}
                            className="group relative overflow-hidden bg-gradient-to-br from-secondary-accent to-purple-700 dark:from-primary-accent/80 dark:to-purple-600 text-white p-4 rounded-xl shadow-md transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95 min-h-[90px]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute -bottom-3 -right-3 opacity-10 transform group-hover:scale-110 transition-transform">
                                <FaCrown size={40} />
                            </div>
                            <div className="relative z-10 flex flex-col items-start">
                                <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-lg mb-1">
                                    <FaCrown size={14} />
                                </div>
                                <div className="font-black text-sm">CLASSIC</div>
                                <div className="text-[10px] font-medium opacity-80">Duel & Party</div>
                            </div>
                        </button>

                        {/* PRACTICE */}
                        <button
                            onClick={() => { playHover(); onCreateRoom('SINGLE'); }}
                            className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-4 rounded-xl shadow-md transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95 min-h-[90px]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute -bottom-3 -right-3 opacity-10 transform group-hover:scale-110 transition-transform">
                                <FaGamepad size={40} />
                            </div>
                            <div className="relative z-10 flex flex-col items-start">
                                <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-lg mb-1">
                                    <FaGamepad size={14} />
                                </div>
                                <div className="font-black text-sm">PRACTICE</div>
                                <div className="text-[10px] font-medium opacity-80">Solo Mode</div>
                            </div>
                        </button>
                    </div>
                )}

                {/* NEW GAME MODES MODAL */}
                {activeModal === 'newModes' && (
                    <div className="relative z-10 animate-fadeIn">
                        <button
                            onClick={() => setActiveModal('none')}
                            className="absolute -top-1 left-0 p-1 text-light-text/40 dark:text-dark-text/40 hover:text-secondary-accent dark:hover:text-primary-accent transition-colors"
                        >
                            <FaArrowLeft size={14} />
                        </button>

                        <h3 className="text-base font-black text-secondary-accent dark:text-primary-accent mb-3">
                            NEW GAME MODES
                        </h3>

                        {/* Speed Run - Single Button Card */}
                        <div className="mb-3">
                            <button
                                onClick={() => { playPop(); setActiveModal('speedRunTimer' as ActiveModal); }}
                                className="flex items-center gap-3 w-full p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-900/30 dark:to-orange-900/30 border-2 border-amber-400/50 dark:border-amber-600/40 text-amber-700 dark:text-amber-400 hover:border-amber-500 dark:hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10 transition-all active:scale-95"
                            >
                                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                                    <FaBolt size={16} />
                                </div>
                                <div className="text-left flex-1">
                                    <div className="font-black text-sm">SPEED RUN</div>
                                    <div className="text-[10px] opacity-70">Crack codes fast • Timed challenge</div>
                                </div>
                                <span className="text-orange-400 text-lg">⚡</span>
                            </button>
                        </div>

                        {/* Battle Royale - Single Button Card */}
                        <div className="mb-3">
                            <button
                                onClick={() => { playPop(); onCreateRoom('BATTLE_ROYALE'); }}
                                className="flex items-center gap-3 w-full p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 dark:from-cyan-900/30 dark:to-purple-900/30 border-2 border-cyan-400/50 dark:border-cyan-600/40 text-cyan-700 dark:text-cyan-400 hover:border-cyan-500 dark:hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/10 transition-all active:scale-95"
                            >
                                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 text-white">
                                    <FaFire size={16} />
                                </div>
                                <div className="text-left flex-1">
                                    <div className="font-black text-sm">COLOR KNOCKOUT</div>
                                    <div className="text-[10px] opacity-70">10-50 players • Elimination rounds</div>
                                </div>
                                <span className="text-[8px] font-bold bg-cyan-500/20 text-cyan-500 px-1.5 py-0.5 rounded-full">NEW</span>
                            </button>
                        </div>

                        {/* Coming Soon Modes - Non-clickable */}
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-light-text/40 dark:text-dark-text/40 uppercase tracking-wider mb-1.5">
                                Coming Soon
                            </p>

                            {/* Saboteur Mode - Coming Soon */}
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-100/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/30 opacity-50 cursor-not-allowed">
                                <div className="bg-gray-200 dark:bg-gray-700 p-1.5 rounded text-gray-400">
                                    <FaUsers size={12} />
                                </div>
                                <div className="text-left flex-1">
                                    <div className="font-bold text-xs text-gray-500">The Saboteur</div>
                                    <div className="text-[9px] text-gray-400">Among Us style</div>
                                </div>
                                <span className="text-gray-400"><FaLock size={10} /></span>
                            </div>
                        </div>
                    </div>
                )}

                {/* SPEED RUN TIMER MODAL */}
                {activeModal === 'speedRunTimer' && (
                    <div className="relative z-10 animate-fadeIn">
                        <button
                            onClick={() => setActiveModal('newModes')}
                            className="absolute -top-1 left-0 p-1 text-light-text/40 dark:text-dark-text/40 hover:text-amber-500 transition-colors"
                        >
                            <FaArrowLeft size={14} />
                        </button>

                        <div className="flex items-center justify-center gap-2 mb-1">
                            <span className="text-amber-500"><FaBolt size={16} /></span>
                            <h3 className="text-base font-black text-amber-600 dark:text-amber-400">
                                SPEED RUN
                            </h3>
                        </div>
                        <p className="text-[10px] text-light-text/50 dark:text-dark-text/50 mb-4">
                            Select timer duration
                        </p>

                        {/* Timer Options */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {[1, 3, 5].map(min => (
                                <button
                                    key={min}
                                    onClick={() => handleSpeedRunClick(min * 60)}
                                    className="flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-300/50 dark:border-amber-600/30 text-amber-700 dark:text-amber-400 py-3 px-4 rounded-xl hover:border-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all transform hover:scale-105 active:scale-95"
                                >
                                    <FaClock size={16} />
                                    <span className="font-black text-xl mt-1">{min}</span>
                                    <span className="text-[10px] opacity-60">MIN</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* CLASSIC MODE MODAL */}
                {activeModal === 'classic' && (
                    <div className="relative z-10 animate-fadeIn">
                        <button
                            onClick={() => setActiveModal('none')}
                            className="absolute -top-1 left-0 p-1 text-light-text/40 dark:text-dark-text/40 hover:text-secondary-accent dark:hover:text-primary-accent transition-colors"
                        >
                            <FaArrowLeft size={14} />
                        </button>

                        <h3 className="text-base font-black text-secondary-accent dark:text-primary-accent mb-3">
                            CLASSIC MODE
                        </h3>

                        <div className="space-y-2">
                            {/* DUEL */}
                            <button
                                onClick={() => handleClassicClick('DUEL')}
                                className="flex items-center gap-2 w-full p-2.5 rounded-xl border-2 border-purple-200 dark:border-purple-800/50 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-400 dark:hover:border-purple-600 transition-all active:scale-95"
                            >
                                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                    <FaCrown size={14} />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-sm">DUEL (1v1)</div>
                                    <div className="text-[10px] opacity-70">Challenge a friend</div>
                                </div>
                            </button>

                            {/* PARTY FFA */}
                            <button
                                onClick={() => handleClassicClick('FFA')}
                                className="flex items-center gap-2 w-full p-2.5 rounded-xl border-2 border-blue-200 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-600 transition-all active:scale-95"
                            >
                                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                    <FaUsers size={14} />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-sm">PARTY FFA</div>
                                    <div className="text-[10px] opacity-70">2-8 players battle</div>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* SPEED RUN CHOICE MODAL */}
                {activeModal === 'speedRunChoice' && (
                    <div className="relative z-10 animate-fadeIn">
                        <button
                            onClick={() => setActiveModal('newModes')}
                            className="absolute -top-1 left-0 p-1 text-light-text/40 dark:text-dark-text/40 hover:text-amber-500 transition-colors"
                        >
                            <FaArrowLeft size={14} />
                        </button>

                        <div className="flex items-center justify-center gap-2 mb-1">
                            <span className="text-amber-500"><FaBolt size={16} /></span>
                            <h3 className="text-base font-black text-amber-600 dark:text-amber-400">
                                SPEED RUN
                            </h3>
                        </div>
                        <p className="text-[10px] text-light-text/50 dark:text-dark-text/50 mb-3">
                            {Math.floor(selectedSpeedRunDuration / 60)} minute{selectedSpeedRunDuration > 60 ? 's' : ''} • Crack codes fast!
                        </p>

                        {/* Code Length Selector */}
                        <div className="mb-4">
                            <p className="text-[10px] font-bold text-light-text/40 dark:text-dark-text/40 uppercase tracking-wider mb-2">
                                Code Length
                            </p>
                            <div className="flex justify-center gap-2">
                                {[3, 4, 5, 6].map(len => (
                                    <button
                                        key={len}
                                        onClick={() => { playPop(); setSelectedCodeLength(len); }}
                                        className={`w-10 h-10 rounded-lg font-black text-lg transition-all active:scale-95 ${selectedCodeLength === len
                                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                                            }`}
                                    >
                                        {len}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            {/* SOLO */}
                            <button
                                onClick={handleSpeedRunSolo}
                                className="flex items-center gap-3 w-full p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-300/50 dark:border-amber-600/40 text-amber-700 dark:text-amber-400 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/10 transition-all active:scale-95"
                            >
                                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                                    <FaUser size={16} />
                                </div>
                                <div className="text-left flex-1">
                                    <div className="font-black text-sm">PLAY SOLO</div>
                                    <div className="text-[10px] opacity-70">Start immediately • Local mode</div>
                                </div>
                                <FaBolt className="opacity-30" size={20} />
                            </button>

                            {/* MULTIPLAYER */}
                            <button
                                onClick={handleSpeedRunMultiplayer}
                                className="flex items-center gap-3 w-full p-3 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-300/50 dark:border-orange-600/40 text-orange-700 dark:text-orange-400 hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/10 transition-all active:scale-95"
                            >
                                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/40">
                                    <FaUsers size={16} />
                                </div>
                                <div className="text-left flex-1">
                                    <div className="font-black text-sm">CHALLENGE FRIENDS</div>
                                    <div className="text-[10px] opacity-70">Create room • Invite others</div>
                                </div>
                                <FaFire className="opacity-30" size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* LOADING MODAL */}
                {activeModal === 'loading' && (
                    <div className="relative z-10 animate-fadeIn flex flex-col items-center justify-center py-8">
                        <div className="w-12 h-12 border-4 border-secondary-accent/30 dark:border-primary-accent/30 border-t-secondary-accent dark:border-t-primary-accent rounded-full animate-spin mb-4" />
                        <p className="font-bold text-secondary-accent dark:text-primary-accent text-sm">Creating Room...</p>
                        <p className="text-[10px] text-light-text/50 dark:text-dark-text/50 mt-1">Please wait</p>
                    </div>
                )}

                {/* Join Section */}
                <div className="mt-3 pt-3 border-t border-light-subtle-border/30 dark:border-dark-subtle-border/30 relative z-10">
                    {!showJoinInput ? (
                        <p
                            onClick={() => setShowJoinInput(true)}
                            className="text-xs font-bold text-secondary-accent/70 dark:text-primary-accent/70 cursor-pointer hover:text-secondary-accent dark:hover:text-primary-accent transition-colors"
                        >
                            Have a room code? <span className="underline">Join</span>
                        </p>
                    ) : (
                        <div className="flex gap-2 animate-fadeIn">
                            <input
                                type="text"
                                value={joinRoomId}
                                onChange={(e) => { setJoinRoomId(e.target.value); playPop(); }}
                                placeholder="CODE"
                                maxLength={5}
                                className="flex-grow px-3 py-2 text-sm font-mono font-bold text-center uppercase bg-light-input-bg dark:bg-dark-bg border border-light-subtle-border dark:border-dark-subtle-border rounded-lg transition-all text-light-text dark:text-dark-text focus:outline-none focus:border-secondary-accent dark:focus:border-primary-accent"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') handleJoinClick(); }}
                                disabled={isJoining}
                            />
                            <Button onClick={handleJoinClick} disabled={isJoining} className="px-4 py-2 text-sm font-bold rounded-lg">
                                {isJoining ? '...' : 'GO'}
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
