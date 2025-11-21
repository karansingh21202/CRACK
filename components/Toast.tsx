import React, { useState, useEffect } from 'react';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'info' | 'error';
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
        // Allow time for fade-out animation before dismissing
        setTimeout(() => onDismiss(toast.id), 300);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  if (!toast) return null;

  const baseClasses = 'fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-white transition-all duration-300';
  const typeClasses = {
    info: 'bg-blue-500',
    error: 'bg-red-500',
  };

  return (
    <div
      className={`${baseClasses} ${typeClasses[toast.type]} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
      role="alert"
      aria-live="assertive"
    >
      {toast.message}
    </div>
  );
};
