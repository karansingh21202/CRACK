import React, { useEffect, useState } from 'react';

interface EliminationOverlayProps {
    isEliminated: boolean;
    placement: number;
    totalPlayers: number;
    onDismiss?: () => void;
}

export const EliminationOverlay: React.FC<EliminationOverlayProps> = ({
    isEliminated,
    placement,
    totalPlayers,
    onDismiss
}) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isEliminated) {
            setShow(true);
        }
    }, [isEliminated]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn">
            {/* Red vignette effect */}
            <div className="absolute inset-0 bg-gradient-radial from-transparent via-red-900/20 to-red-900/60 pointer-events-none" />

            <div className="text-center z-10">
                {/* Skull / X icon */}
                <div className="text-8xl mb-4 animate-bounce">
                    ☠️
                </div>

                {/* KNOCKED OUT text */}
                <h1
                    className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-400 to-red-700 mb-4 animate-pulse"
                    style={{ textShadow: '0 0 30px rgba(239,68,68,0.5)' }}
                >
                    KNOCKED OUT
                </h1>

                {/* Placement */}
                <p className="text-2xl text-white/80 font-bold mb-2">
                    You placed
                </p>
                <p className="text-5xl font-black text-white mb-1">
                    #{placement}
                </p>
                <p className="text-lg text-white/50 mb-8">
                    of {totalPlayers} players
                </p>

                {/* Continue button */}
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all active:scale-95"
                    >
                        CONTINUE WATCHING
                    </button>
                )}
            </div>
        </div>
    );
};
