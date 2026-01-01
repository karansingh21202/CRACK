import React from 'react';
import { FaTimes, FaFire, FaCrown, FaUsers, FaSkull, FaClock, FaCheck, FaCircle } from 'react-icons/fa';

interface BRRulesModalProps {
    onClose: () => void;
}

export const BRRulesModal: React.FC<BRRulesModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="w-full max-w-lg bg-gradient-to-br from-[#0f1a2e] to-[#0a0a0f] border border-cyan-500/30 rounded-2xl p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                >
                    <FaTimes size={20} />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full mb-3">
                        <FaFire className="text-cyan-400" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-bold">COLOR KNOCKOUT</span>
                    </div>
                    <h2 className="text-2xl font-black text-white">How to Play</h2>
                </div>

                {/* Game Flow */}
                <div className="space-y-4 mb-6">
                    <RuleItem
                        icon={<FaUsers className="text-cyan-400" />}
                        title="Multiplayer Battle"
                        description="All players guess the SAME secret color code. Race to crack it first!"
                    />

                    <RuleItem
                        icon={<FaClock className="text-yellow-400" />}
                        title="Timed Rounds"
                        description="Each round has a timer. Guess before time runs out!"
                    />

                    <RuleItem
                        icon={<FaSkull className="text-red-400" />}
                        title="Elimination"
                        description="Bottom performers get eliminated each round. Last one standing wins!"
                    />

                    <RuleItem
                        icon={<FaCrown className="text-yellow-400" />}
                        title="Win Condition"
                        description="Survive all rounds or be the first to crack each code!"
                    />
                </div>

                {/* Color Feedback Explanation */}
                <div className="bg-black/40 rounded-xl p-4 mb-6">
                    <h3 className="text-white font-bold mb-3">Understanding Color Feedback</h3>

                    <div className="space-y-3">
                        <FeedbackRow
                            icon={<FaCheck className="text-green-400" />}
                            title="EXACT"
                            description="Right color in the RIGHT position"
                            example="🔴 in slot 1, secret has 🔴 in slot 1"
                        />
                        <FeedbackRow
                            icon={<FaCircle className="text-yellow-400" size={12} />}
                            title="CLOSE"
                            description="Right color but WRONG position"
                            example="🔴 in slot 2, but secret has 🔴 in slot 4"
                        />
                    </div>

                    {/* Visual Example */}
                    <div className="mt-4 p-3 bg-white/5 rounded-lg">
                        <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Example</p>
                        <div className="flex items-center gap-4 mb-2">
                            <span className="text-white/60 text-sm w-16">Secret:</span>
                            <div className="flex gap-1">
                                <ColorBox color="#EF4444" />
                                <ColorBox color="#3B82F6" />
                                <ColorBox color="#22C55E" />
                                <ColorBox color="#EAB308" />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                            <span className="text-white/60 text-sm w-16">Guess:</span>
                            <div className="flex gap-1">
                                <ColorBox color="#EF4444" />
                                <ColorBox color="#22C55E" />
                                <ColorBox color="#A855F7" />
                                <ColorBox color="#3B82F6" />
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-white/60 text-sm w-16">Result:</span>
                            <span className="text-green-400 font-bold">1 EXACT</span>
                            <span className="text-yellow-400 font-bold">2 CLOSE</span>
                        </div>
                        <p className="text-xs text-white/40 mt-2">
                            🔴 is exact (slot 1). 🔵 & 🟢 are close (exist but wrong positions). 🟣 doesn't exist.
                        </p>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-xl hover:scale-[1.02] transition-transform"
                >
                    Let's Play!
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

const FeedbackRow: React.FC<{ icon: React.ReactNode; title: string; description: string; example: string }> = ({ icon, title, description, example }) => (
    <div className="flex items-start gap-3">
        <div className="mt-1">{icon}</div>
        <div>
            <span className="text-white font-bold">{title}</span>
            <p className="text-white/60 text-sm">{description}</p>
            <p className="text-white/40 text-xs mt-0.5">{example}</p>
        </div>
    </div>
);

const ColorBox: React.FC<{ color: string }> = ({ color }) => (
    <div className="w-6 h-6 rounded" style={{ backgroundColor: color }} />
);
