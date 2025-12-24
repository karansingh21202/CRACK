import React from 'react';
import { Player } from '@/types';
import { CheckCircleIcon } from './Icon';

interface PlayerAvatarProps {
    player: Player;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ player }) => {
    const colors = [
        'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
        'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    // Simple hash function for consistent colors based on ID
    const colorIndex = player.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;

    return (
        <div className="relative">
            <div className={`w-10 h-10 rounded-full ${colors[colorIndex]} flex items-center justify-center font-bold text-white text-lg ring-2 ring-offset-2 dark:ring-offset-dark-card ring-transparent shadow-sm`}>
                {player.name.charAt(0).toUpperCase()}
            </div>
            {player.isReady && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-light-card dark:border-dark-card flex items-center justify-center">
                    <CheckCircleIcon className="w-3 h-3 text-white" />
                </div>
            )}
        </div>
    );
};
