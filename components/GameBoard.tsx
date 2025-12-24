
import React, { useState, useRef, createRef, useEffect } from 'react';
import { Button } from './Button.tsx';
import { useSound } from '../hooks/useSound';

interface GameBoardProps {
  codeLength: number;
  onSubmitGuess: (guess: string) => void;
  onInvalidGuess?: (message: string) => void;
  isGameWon: boolean;
  allowRepeats: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({ codeLength, onSubmitGuess, onInvalidGuess, isGameWon, allowRepeats }) => {
  const [guess, setGuess] = useState<string[]>(Array(codeLength).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<React.RefObject<HTMLInputElement>[]>(
    Array.from({ length: codeLength }, () => createRef<HTMLInputElement>())
  );
  const { playPop, playError, playSuccess } = useSound();

  // Reset board when code length changes
  useEffect(() => {
    setGuess(Array(codeLength).fill(''));
    inputRefs.current = Array.from({ length: codeLength }, () => createRef<HTMLInputElement>());
    // Focus first input after a short delay to allow render
    const timer = setTimeout(() => {
      if (inputRefs.current[0]?.current) {
        inputRefs.current[0].current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [codeLength]);

  const triggerShake = () => {
    setShake(true);
    playError();
    setTimeout(() => setShake(false), 500);
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) {
      triggerShake();
      return;
    }

    const newGuess = [...guess];
    newGuess[index] = value.slice(-1);
    setGuess(newGuess);

    if (value) {
      playPop();
      if (index < codeLength - 1) {
        inputRefs.current[index + 1].current?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!guess[index] && index > 0) {
        inputRefs.current[index - 1].current?.focus();
        playPop();
      } else if (guess[index]) {
        playPop();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].current?.focus();
    } else if (e.key === 'ArrowRight' && index < codeLength - 1) {
      inputRefs.current[index + 1].current?.focus();
    } else if (e.key === 'Enter' && isSubmitEnabled) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!pastedData) return;

    const newGuess = Array(codeLength).fill('');
    for (let i = 0; i < codeLength; i++) {
      if (pastedData[i]) {
        newGuess[i] = pastedData[i];
      }
    }
    setGuess(newGuess);
    playSuccess();

    const lastFilledIndex = Math.min(pastedData.length, codeLength - 1);
    setTimeout(() => inputRefs.current[lastFilledIndex].current?.focus(), 0);
  };

  const handleSubmit = () => {
    if (!isSubmitEnabled || isSubmitting) return;

    const finalGuess = guess.join('');

    if (!allowRepeats) {
      const hasDuplicates = new Set(finalGuess).size !== finalGuess.length;
      if (hasDuplicates) {
        triggerShake();
        onInvalidGuess?.('Repeated digits are not allowed in this mode.');
        return;
      }
    }

    playSuccess();
    setIsSubmitting(true);

    // Delay to show visual feedback before clearing
    setTimeout(() => {
      // IMPORTANT: Check if game is won BEFORE modifying state/DOM.
      // Although props are technically stale in this closure, we trust the logic flow.
      // We'll rely on the parent to stop rendering the active board if it's won, 
      // but we must be careful about focus.

      onSubmitGuess(finalGuess);
      setGuess(Array(codeLength).fill(''));
      setIsSubmitting(false);

      // Defensive focus: Only focus if the input exists, is not null, and is NOT disabled.
      // We use a requestAnimationFrame to allow React one frame to update the disabled state based on the new GameState.
      requestAnimationFrame(() => {
        try {
          const firstInput = inputRefs.current[0]?.current;
          // We check 'disabled' property directly from the DOM element to see the applied state
          if (firstInput && !firstInput.disabled && document.body.contains(firstInput)) {
            firstInput.focus();
          }
        } catch (e) {
          // Ignore focus errors that might occur during unmounting/transitions
        }
      });
    }, 500);
  };

  const isSubmitEnabled = guess.every(digit => digit !== '');

  return (
    <div className={`flex flex-col items-center gap-1 lg:gap-6 w-full ${shake ? 'animate-[shake_0.5s_cubic-bezier(.36,.07,.19,.97)_both]' : ''}`}>
      <style>{`
            @keyframes shake {
                10%, 90% { transform: translate3d(-1px, 0, 0); }
                20%, 80% { transform: translate3d(2px, 0, 0); }
                30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                40%, 60% { transform: translate3d(4px, 0, 0); }
            }
        `}</style>
      <div className="flex items-center justify-center gap-1.5 sm:gap-3 [perspective:1000px]" onPaste={handlePaste}>
        {guess.map((digit, index) => (
          <input
            key={index}
            ref={inputRefs.current[index]}
            type="tel"
            pattern="[0-9]*"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={isGameWon || isSubmitting}
            className={`w-9 h-11 sm:w-14 sm:h-16 text-xl sm:text-3xl font-mono text-center font-bold rounded-xl border-2 shadow-sm transition-all duration-200 transform outline-none
                ${digit
                ? 'bg-white dark:bg-dark-card border-secondary-accent dark:border-primary-accent text-secondary-accent dark:text-primary-accent shadow-lg scale-105 -translate-y-1 animate-popIn'
                : 'bg-light-input-bg dark:bg-dark-bg border-light-subtle-border dark:border-dark-subtle-border text-light-text dark:text-dark-text hover:border-secondary-accent/50 dark:hover:border-primary-accent/50'
              }
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                focus:border-secondary-accent dark:focus:border-primary-accent focus:ring-4 focus:ring-secondary-accent/20 dark:focus:ring-primary-accent/20 focus:scale-110 focus:-translate-y-2 focus:shadow-xl focus:z-10
              `}
          />
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!isSubmitEnabled || isGameWon || isSubmitting}
        className="w-full max-w-[200px] py-3 sm:py-4 text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
      >
        {isSubmitting ? 'Checking...' : 'Submit Code'}
      </Button>
    </div>
  );
};
