import React from 'react';
import { FaTimes, FaBolt, FaTrophy, FaCheck, FaRedo } from 'react-icons/fa';

interface SpeedRunRulesModalProps {
    onClose: () => void;
}

export const SpeedRunRulesModal: React.FC<SpeedRunRulesModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="w-full max-w-lg bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] border border-amber-500/30 rounded-2xl p-6 relative shadow-2xl">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                >
                    <FaTimes size={20} />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-full mb-3">
                        <FaBolt className="text-amber-400" />
                        <span className="text-amber-400 font-bold">SPEED RUN</span>
                    </div>
                    <h2 className="text-2xl font-black text-white">How to Play</h2>
                </div>

                {/* Rules */}
                <div className="space-y-4 mb-6">
                    <RuleItem
                        icon={<FaTrophy className="text-amber-400" />}
                        title="Objective"
                        description="Crack as many codes as possible before the timer runs out!"
                    />

                    <RuleItem
                        icon={<FaRedo className="text-green-400" />}
                        title="New Code After Each Solve"
                        description="Once you crack a code, a new one appears instantly. Keep going!"
                    />

                    <RuleItem
                        icon={<FaBolt className="text-amber-400" />}
                        title="Timer"
                        description="Default is 3 minutes. Every second counts - be quick but accurate!"
                    />
                </div>

                {/* Feedback Explanation */}
                <div className="bg-black/40 rounded-xl p-4 mb-6">
                    <h3 className="text-white font-bold mb-3">Understanding Feedback</h3>

                    <div className="space-y-3">
                        <FeedbackRow
                            icon="✓"
                            iconColor="text-green-400"
                            title="Hit (Exact Match)"
                            description="Correct digit in the correct position"
                        />
                        <FeedbackRow
                            icon="○"
                            iconColor="text-yellow-400"
                            title="Pseudo-Hit (Close)"
                            description="Correct digit but in wrong position"
                        />
                    </div>

                    <div className="mt-4 p-3 bg-white/5 rounded-lg">
                        <p className="text-sm text-white/70">
                            <span className="font-bold">Example:</span> Secret is <code className="bg-black/40 px-1 rounded">1234</code>,
                            you guess <code className="bg-black/40 px-1 rounded">1352</code>
                        </p>
                        <p className="text-sm text-white/70 mt-1">
                            Result: <span className="text-green-400 font-bold">1</span> hit (1 is correct),
                            <span className="text-yellow-400 font-bold"> 2</span> close (2,3 exist but wrong spots)
                        </p>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl hover:scale-[1.02] transition-transform"
                >
                    Got it!
                </button>
            </div>
        </div>
    );
};

const RuleItem: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="flex items-start gap-3">
        <div className="mt-1">{icon}</div>
        <div>
            <h4 className="text-white font-bold">{title}</h4>
            <p className="text-white/60 text-sm">{description}</p>
        </div>
    </div>
);

const FeedbackRow: React.FC<{ icon: string; iconColor: string; title: string; description: string }> = ({ icon, iconColor, title, description }) => (
    <div className="flex items-center gap-3">
        <span className={`text-xl font-bold ${iconColor}`}>{icon}</span>
        <div>
            <span className="text-white font-medium">{title}</span>
            <span className="text-white/50 text-sm ml-2">- {description}</span>
        </div>
    </div>
);
