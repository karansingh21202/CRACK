import React from 'react';
import { Card } from './Card';
import { Button } from './Button';

interface QuitGameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBackToLobby: () => void;
    onLeaveRoom: () => void;
}

export const QuitGameModal: React.FC<QuitGameModalProps> = ({ isOpen, onClose, onBackToLobby, onLeaveRoom }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <Card className="w-full max-w-sm p-6 text-center shadow-2xl border border-light-subtle-border dark:border-dark-subtle-border">
                <h3 className="text-xl font-black text-secondary-accent dark:text-primary-accent mb-2 uppercase tracking-wide">Quit Game?</h3>
                <p className="text-light-text/70 dark:text-dark-text/70 mb-6 font-medium">
                    You are about to leave the current game. Where do you want to go?
                </p>
                <div className="flex flex-col gap-3">
                    <Button
                        onClick={onBackToLobby}
                        className="w-full py-3 text-black rounded bg-blue-600 dark:text-white dark:bg-purple-500 "
                    >
                        Back to Lobby
                    </Button>
                    <Button
                        onClick={onLeaveRoom}
                        variant="ghost"
                        className="w-full py-3 text-red-500 border border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl font-bold"
                    >
                        Leave Room Completely
                    </Button>
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        className="w-full py-2 text-light-text/50 dark:text-dark-text/50 hover:text-light-text dark:hover:text-dark-text font-bold"
                    >
                        Cancel
                    </Button>
                </div>
            </Card>
        </div>
    );
};
