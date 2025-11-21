import React from 'react';
import { useSound } from '../hooks/useSound';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  className = '',
  onClick,
  ...props
}) => {
  const { playClick } = useSound();
  const baseClasses =
    'inline-flex items-center justify-center rounded-md text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-secondary-accent dark:focus:ring-primary-accent disabled:opacity-50 disabled:pointer-events-none active:scale-95';

  const variantClasses = {
    primary:
      'bg-secondary-accent dark:bg-transparent border border-secondary-accent dark:border-primary-accent text-white dark:text-primary-accent hover:bg-secondary-accent/90 dark:hover:bg-primary-accent/10 shadow-md shadow-secondary-accent/20 dark:shadow-none',
    ghost: 'bg-transparent hover:bg-secondary-accent/10 dark:hover:bg-primary-accent/10 text-light-text dark:text-dark-text border border-transparent',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      playClick();
      onClick?.(e);
  };

  return (
    <button onClick={handleClick} className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};