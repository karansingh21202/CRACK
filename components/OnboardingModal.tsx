
import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { CheckCircleIcon, DotIcon } from './Icon';

interface OnboardingModalProps {
  onClose: () => void;
}

const TutorialStep: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="text-left mb-4">
        <h3 className="text-lg font-semibold text-secondary-accent dark:text-primary-accent mb-1">{title}</h3>
        <p className="text-light-text dark:text-dark-text text-sm">{children}</p>
    </div>
);

const FeedbackExample: React.FC<{ hits: number; pseudoHits: number; text: string; code: string[]; codeLength: number }> = ({ hits, pseudoHits, text, code, codeLength }) => (
    <div className="flex items-center space-x-3 my-2 p-2 rounded-lg bg-light-bg dark:bg-dark-bg">
        <div className="flex space-x-1">
            {code.map((digit, i) => (
                <div key={i} className="w-8 h-8 flex items-center justify-center font-mono text-xl border border-light-subtle-border dark:border-dark-subtle-border rounded-md bg-light-card dark:bg-dark-card">{digit}</div>
            ))}
        </div>
        <div className="flex items-center space-x-1">
            {Array.from({ length: hits }).map((_, i) => <CheckCircleIcon key={`hit-${i}`} className="w-5 h-5 text-secondary-accent dark:text-primary-accent" />)}
            {Array.from({ length: pseudoHits }).map((_, i) => <DotIcon key={`pseudo-${i}`} className="w-5 h-5 text-secondary-accent dark:text-primary-accent opacity-60" />)}
        </div>
        <p className="text-sm text-light-text dark:text-dark-text flex-1">"{text}"</p>
    </div>
);


export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <Card className="w-full max-w-lg p-6 relative">
        <div className="text-center">
            <h2 className="text-2xl font-bold text-secondary-accent dark:text-primary-accent mb-2">Welcome to Crack The Code!</h2>
            <p className="text-light-text dark:text-dark-text mb-6">Your goal is to guess the secret code. Here's how feedback works:</p>
        </div>

        <TutorialStep title="Correct Digit, Correct Position">
             <CheckCircleIcon className="w-4 h-4 inline-block mr-1 text-secondary-accent dark:text-primary-accent" /> This means a digit is perfect - right number, right spot.
        </TutorialStep>
        <FeedbackExample hits={1} pseudoHits={0} text="One digit is in the correct spot." code={['1', '5', '8']} codeLength={3}/>


        <TutorialStep title="Correct Digit, Wrong Position">
            <DotIcon className="w-4 h-4 inline-block mr-1 text-secondary-accent dark:text-primary-accent opacity-60" /> This means a digit is in the code, but in the wrong spot.
        </TutorialStep>
        <FeedbackExample hits={0} pseudoHits={2} text="Two correct digits in the wrong spot." code={['2', '1', '9']} codeLength={3}/>

        <div className="text-center mt-6">
            <p className="text-light-text dark:text-dark-text text-sm mb-4">Combine the clues from each guess to crack the code!</p>
            <Button onClick={onClose} className="w-full sm:w-auto px-8 py-2">Let's Play!</Button>
        </div>
      </Card>
    </div>
  );
};
