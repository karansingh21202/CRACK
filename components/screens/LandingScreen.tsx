import React, { useState } from 'react';
import { Card } from '../Card';
import { Logo } from '../Logo';
import { Button } from '../Button';
import { TargetIcon } from '../Icon';
import { useSound } from '../../hooks/useSound';
import { GameMode } from '@/types';

interface LandingScreenProps {
    onCreateRoom: (mode: GameMode) => void;
    onJoinRoom: (roomId: string) => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onCreateRoom, onJoinRoom }) => {
    const [showJoinInput, setShowJoinInput] = useState(false);
    const [joinRoomId, setJoinRoomId] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const { playPop } = useSound();

    const handleJoinClick = () => {
        if (joinRoomId.trim()) {
            setIsJoining(true);
            onJoinRoom(joinRoomId.trim().toUpperCase());
            // Reset loading after a timeout in case of error (or let parent handle it)
            setTimeout(() => setIsJoining(false), 3000);
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8 text-center animate-fadeIn shadow-2xl bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-t-4 border-t-secondary-accent">
                <div className="flex justify-center mb-8">
                    <div className="w-28 h-28 animate-popIn drop-shadow-2xl">
                        <Logo className="w-full h-full" />
                    </div>
                </div>
                <h2 className="text-5xl font-black text-secondary-accent dark:text-primary-accent mb-2 tracking-tighter">CRACK IT.</h2>
                <p className="text-light-text dark:text-dark-text mb-10 text-lg font-medium opacity-70">Join the viral puzzle sensation.</p>

                <div className="flex flex-col gap-4">
                    <Button onClick={() => onCreateRoom('SINGLE')} className="w-full py-4 text-xl font-black rounded-2xl shadow-lg hover:scale-[1.02] hover:-translate-y-1 transition-all bg-gradient-to-r from-secondary-accent to-purple-600 border-0">
                        SINGLE PLAYER
                    </Button>
                    <div className="grid grid-cols-2 gap-4">
                        <Button onClick={() => onCreateRoom('DUEL')} className="w-full py-4 text-base font-bold rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                            <TargetIcon className="w-5 h-5" /> VS DUEL
                        </Button>
                        <Button onClick={() => onCreateRoom('FFA')} className="w-full py-4 text-base font-bold rounded-2xl hover:scale-[1.02] transition-transform">
                            PARTY FFA
                        </Button>
                    </div>

                    <div className="mt-4">
                        {!showJoinInput ? (
                            <p onClick={() => setShowJoinInput(true)} className="text-sm font-bold text-secondary-accent dark:text-primary-accent cursor-pointer hover:underline opacity-80">
                                Have a room code? Join here
                            </p>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-2 animate-fadeIn mt-2">
                                <input
                                    type="text"
                                    value={joinRoomId}
                                    onChange={(e) => { setJoinRoomId(e.target.value); playPop(); }}
                                    placeholder="CODE"
                                    maxLength={5}
                                    className="flex-grow w-full px-4 py-3 text-xl font-mono font-bold text-center uppercase bg-light-input-bg dark:bg-dark-bg border-2 border-light-subtle-border dark:border-dark-subtle-border rounded-xl transition-all text-light-text dark:text-dark-text focus:outline-none focus:border-secondary-accent dark:focus:border-primary-accent focus:ring-4 focus:ring-secondary-accent/20"
                                    autoFocus
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleJoinClick(); }}
                                    disabled={isJoining}
                                />
                                <Button onClick={handleJoinClick} disabled={isJoining} className="px-6 py-3 text-lg font-bold rounded-xl min-w-[80px]">
                                    {isJoining ? '...' : 'GO'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    )
};
