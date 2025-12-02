import React, { useState, useEffect } from 'react';
import { UserIcon } from './Icon';

interface NameInputProps {
    value: string;
    onChange: (name: string) => void;
}

export const NameInput: React.FC<NameInputProps> = ({ value, onChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(value);

    useEffect(() => {
        setTempName(value);
    }, [value]);

    const handleSave = () => {
        const trimmed = tempName.trim();
        if (trimmed) {
            onChange(trimmed);
            setIsEditing(false);
        } else {
            setTempName(value); // Revert if empty
            setIsEditing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2 bg-white dark:bg-white/5 border-2 border-purple-500/50 rounded-xl px-3 py-2 shadow-lg animate-popIn">
                <UserIcon className="w-4 h-4 text-purple-500" />
                <input
                    autoFocus
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    maxLength={12}
                    className="bg-transparent border-none outline-none text-sm font-bold text-gray-900 dark:text-white w-24 placeholder-gray-400"
                    placeholder="Your Name"
                />
            </div>
        );
    }

    return (
        <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 hover:bg-white hover:shadow-md dark:hover:bg-white/10 border border-transparent hover:border-purple-200 dark:hover:border-purple-500/30 rounded-xl px-3 py-2 transition-all duration-200 group"
            title="Click to change name"
        >
            <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <UserIcon className="w-3 h-3" />
            </div>
            <span className="text-sm font-bold text-gray-700 dark:text-white/90 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {value}
            </span>
        </button>
    );
};
