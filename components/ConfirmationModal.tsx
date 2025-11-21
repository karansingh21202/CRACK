import React from 'react';
import { Card } from './Card';
import { Button } from './Button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onConfirm,
    onCancel,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <Card className="w-full max-w-sm p-6 animate-popIn bg-white dark:bg-dark-card border-2 border-secondary-accent dark:border-primary-accent shadow-2xl">
                <h3 className="text-xl font-black text-secondary-accent dark:text-primary-accent mb-2 uppercase tracking-wide">
                    {title}
                </h3>
                <p className="text-light-text dark:text-dark-text mb-6 opacity-80 font-medium">
                    {message}
                </p>
                <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={onCancel} className="flex-1 py-2">
                        {cancelText}
                    </Button>
                    <Button onClick={onConfirm} className="flex-1 bg-purple-500 hover:bg-purple-600 border-purple-800 text-white shadow-purple-500/20 py-2">
                        {confirmText}
                    </Button>
                </div>
            </Card>
        </div>
    );
};
