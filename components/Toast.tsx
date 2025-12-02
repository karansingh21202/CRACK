import React, { useState, useEffect } from 'react';
import { InfoIcon, CheckCircleIcon, SpeakerOffIcon } from './Icon';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'info' | 'error' | 'success';
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: (id: number) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onDismiss(toast.id), 300); // Wait for animation out
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  // Determine Icon
  const IconToRender = isError ? SpeakerOffIcon : isSuccess ? CheckCircleIcon : InfoIcon;

  // Placement Base
  const containerBase = `fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) transform flex items-center gap-3 min-w-[280px] max-w-[90vw]`;
  const visibilityClass = visible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-12 opacity-0 scale-95 pointer-events-none';

  // V5 Style (Pill)
  const containerStyle = `bg-white dark:bg-gray-800 rounded-full pl-1 pr-6 py-1 shadow-[0_4px_20px_rgba(0,0,0,0.15)]`;
  const iconWrapperStyle = `text-white w-10 h-10 flex items-center justify-center rounded-full shadow-md ring-2 ring-white dark:ring-gray-800`;
  const textStyle = `text-gray-800 dark:text-white font-bold ml-3`;

  // Override icon wrapper color based on type
  const iconBg = isError ? 'bg-red-500' : isSuccess ? 'bg-green-500' : 'bg-purple-500';

  return (
    <div className={`${containerBase} ${visibilityClass} ${containerStyle} p-0 gap-0`}>
      <div className={`${iconWrapperStyle} ${iconBg}`}>
        <IconToRender className="w-6 h-6" />
      </div>
      <div className={textStyle}>
        {toast.message}
      </div>
    </div>
  );
};
