import React, { useState, useEffect } from 'react';

interface RoundTimerProps {
    endTime: number; // Unix timestamp when round ends
    onTimeUp?: () => void;
}

export const RoundTimer: React.FC<RoundTimerProps> = ({
    endTime,
    onTimeUp
}) => {
    const [secondsLeft, setSecondsLeft] = useState(() => {
        const diff = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        return diff;
    });

    useEffect(() => {
        const interval = setInterval(() => {
            const diff = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
            setSecondsLeft(diff);

            if (diff === 0) {
                clearInterval(interval);
                onTimeUp?.();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [endTime, onTimeUp]);

    const isWarning = secondsLeft <= 10;
    const isCritical = secondsLeft <= 5;

    return (
        <div className={`flex items-center justify-center bg-black/40 backdrop-blur-sm border rounded-xl px-6 py-3 transition-all ${isCritical
                ? 'border-red-500 animate-pulse'
                : isWarning
                    ? 'border-amber-500'
                    : 'border-cyan-500/30'
            }`}>
            <span className={`text-4xl font-black font-mono transition-colors ${isCritical
                    ? 'text-red-500'
                    : isWarning
                        ? 'text-amber-400'
                        : 'text-white'
                }`}>
                {secondsLeft}
            </span>
            <span className="text-lg text-white/40 ml-1">s</span>
        </div>
    );
};
