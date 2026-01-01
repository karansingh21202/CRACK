import React from 'react';

// Color definitions for Battle Royale
export const BR_COLORS = {
    RED: { name: 'Red', hex: '#EF4444', emoji: '🔴' },
    BLUE: { name: 'Blue', hex: '#3B82F6', emoji: '🔵' },
    GREEN: { name: 'Green', hex: '#22C55E', emoji: '🟢' },
    YELLOW: { name: 'Yellow', hex: '#EAB308', emoji: '🟡' },
    PURPLE: { name: 'Purple', hex: '#A855F7', emoji: '🟣' },
    BLACK: { name: 'Black', hex: '#374151', emoji: '⚫' },
} as const;

export type ColorKey = keyof typeof BR_COLORS;

interface ColorPickerProps {
    selectedColors: ColorKey[];
    codeLength: number;
    onColorSelect: (color: ColorKey) => void;
    onColorRemove: (index: number) => void;
    onSubmit: () => void;
    disabled?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
    selectedColors,
    codeLength,
    onColorSelect,
    onColorRemove,
    onSubmit,
    disabled = false
}) => {
    const isComplete = selectedColors.length === codeLength;

    return (
        <div className="w-full">
            {/* Selected Code Display */}
            <div className="flex justify-center gap-2 mb-4">
                {Array(codeLength).fill(0).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => selectedColors[i] && onColorRemove(i)}
                        className={`w-12 h-12 md:w-14 md:h-14 rounded-xl border-2 transition-all ${selectedColors[i]
                                ? 'border-white/30 hover:border-white/60 active:scale-95'
                                : 'border-white/20 border-dashed'
                            }`}
                        style={{
                            backgroundColor: selectedColors[i]
                                ? BR_COLORS[selectedColors[i]].hex
                                : 'transparent'
                        }}
                        disabled={disabled}
                    >
                        {!selectedColors[i] && (
                            <span className="text-white/20 text-xl">?</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Color Buttons */}
            <div className="grid grid-cols-6 gap-2 mb-4">
                {(Object.keys(BR_COLORS) as ColorKey[]).map(colorKey => (
                    <button
                        key={colorKey}
                        onClick={() => onColorSelect(colorKey)}
                        disabled={disabled || isComplete}
                        className={`aspect-square rounded-xl transition-all hover:scale-110 active:scale-95 shadow-lg ${disabled || isComplete ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        style={{ backgroundColor: BR_COLORS[colorKey].hex }}
                        title={BR_COLORS[colorKey].name}
                    >
                        <span className="text-2xl">{BR_COLORS[colorKey].emoji}</span>
                    </button>
                ))}
            </div>

            {/* Submit Button */}
            <button
                onClick={onSubmit}
                disabled={!isComplete || disabled}
                className={`w-full py-3 rounded-xl font-bold text-lg transition-all ${isComplete && !disabled
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:scale-105 active:scale-95'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
            >
                {isComplete ? 'SUBMIT GUESS' : `Select ${codeLength - selectedColors.length} more`}
            </button>
        </div>
    );
};
