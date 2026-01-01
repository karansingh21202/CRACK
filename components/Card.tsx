import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-light-card dark:bg-dark-card border border-light-subtle-border dark:border-dark-subtle-border rounded-xl shadow-soft-light dark:shadow-none card-glow ${className}`}
    >
      {children}
    </div>
  );
};