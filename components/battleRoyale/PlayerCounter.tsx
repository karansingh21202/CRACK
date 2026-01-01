import React from 'react';
import { FaUsers } from 'react-icons/fa';

interface PlayerCounterProps {
    alive: number;
    total: number;
    eliminated?: number;
}

export const PlayerCounter: React.FC<PlayerCounterProps> = ({
    alive,
    total,
    eliminated = 0
}) => {
    return (
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-sm border border-cyan-500/30 rounded-xl px-4 py-2">
            <FaUsers className="text-cyan-400" size={18} />
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">{alive}</span>
                <span className="text-sm text-white/40">/ {total}</span>
            </div>
            {eliminated > 0 && (
                <span className="text-xs text-red-400 font-bold">
                    -{eliminated}
                </span>
            )}
        </div>
    );
};
