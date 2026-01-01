import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 hover-lift";

    const variants = {
        primary: "bg-gradient-to-r from-secondary-accent to-secondary-accent/80 text-white shadow-lg shadow-secondary-accent/30 hover:shadow-secondary-accent/50 border border-transparent",
        secondary: "bg-white dark:bg-dark-card text-light-text dark:text-dark-text border-2 border-light-subtle-border dark:border-dark-subtle-border hover:border-secondary-accent dark:hover:border-primary-accent hover:text-secondary-accent dark:hover:text-primary-accent",
        ghost: "bg-transparent text-light-text dark:text-dark-text hover:bg-light-subtle-border/10 dark:hover:bg-dark-subtle-border/10",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : null}
            {children}
        </button>
    );
};
