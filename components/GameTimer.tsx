
import React, { useState, useEffect } from 'react';

export const GameTimer: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        let intervalId: number | undefined;
        
        if (isPlaying) {
            setSeconds(0); // Reset timer when game starts
            intervalId = window.setInterval(() => {
                setSeconds(s => s + 1);
            }, 1000);
        }

        return () => {
            if (intervalId !== undefined) window.clearInterval(intervalId);
        };
    }, [isPlaying]);

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`font-mono text-xl lg:text-2xl font-bold text-light-text dark:text-dark-text tabular-nums tracking-widest transition-opacity duration-300 ${isPlaying ? 'opacity-80' : 'opacity-100 text-secondary-accent dark:text-primary-accent scale-110'}`}>
            {formatTime(seconds)}
        </div>
    );
};
