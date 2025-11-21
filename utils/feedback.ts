import { Feedback } from '../types';

export function calculateFeedback(guess: string, secret: string): Feedback {
  let hits = 0;
  let pseudoHits = 0;

  const secretFreq: { [key: string]: number } = {};
  const guessFreq: { [key: string]: number } = {};

  const secretRemaining: string[] = [];
  const guessRemaining: string[] = [];

  // First pass: find hits (correct digit in correct position)
  for (let i = 0; i < secret.length; i++) {
    if (guess[i] === secret[i]) {
      hits++;
    } else {
      secretRemaining.push(secret[i]);
      guessRemaining.push(guess[i]);
    }
  }

  // Second pass: find pseudo-hits (correct digit in wrong position)
  for (const digit of secretRemaining) {
    secretFreq[digit] = (secretFreq[digit] || 0) + 1;
  }

  for (const digit of guessRemaining) {
    if (secretFreq[digit] && secretFreq[digit] > 0) {
      pseudoHits++;
      secretFreq[digit]--;
    }
  }

  return { hits, pseudoHits };
}


export function generateFeedbackMessage(hits: number, pseudoHits: number, codeLength: number): string {
  if (hits === codeLength) {
    return "Perfect! You cracked the code!";
  }
  
  const incorrect = codeLength - hits - pseudoHits;

  if (hits === 0 && pseudoHits === 0) {
    return "None of the digits match. Try a different approach.";
  }
  
  if (pseudoHits === codeLength) {
    return "You've found all the correct digits, but they're all in the wrong places!";
  }

  if (hits + pseudoHits === codeLength && hits > 0) {
     const hitPlural = hits > 1 ? 'are' : 'is';
     const pseudoPlural = pseudoHits > 1 ? 's' : '';
     return `You've found all the digits! ${numberToWord(hits)} ${hitPlural} perfect, and ${numberToWord(pseudoHits)} just need${pseudoPlural} to be rearranged.`;
  }

  const parts: string[] = [];
  if (hits > 0) {
    const plural = hits > 1 ? "s are" : " is";
    parts.push(`${numberToWord(hits)} digit${plural} in the correct spot`);
  }
  if (pseudoHits > 0) {
    const plural = pseudoHits > 1 ? "s are" : " is";
    parts.push(`${numberToWord(pseudoHits)} correct digit${plural} in the wrong spot`);
  }
  if (incorrect > 0 && (hits > 0 || pseudoHits > 0)) { // Only mention incorrect if others are correct
    const plural = incorrect > 1 ? "s are" : " is";
    parts.push(`${numberToWord(incorrect)} digit${plural} incorrect`);
  }

  const message = parts.join(', ') + '.';
  return message.charAt(0).toUpperCase() + message.slice(1);
}

function numberToWord(n: number): string {
  const words = ["Zero", "One", "Two", "Three", "Four", "Five"];
  return words[n] || n.toString();
}

export function generateSecretCode(length: number, allowRepeats: boolean): string {
    let code = '';
    const digits = '0123456789';
    
    if (allowRepeats) {
        for (let i = 0; i < length; i++) {
            code += digits[Math.floor(Math.random() * digits.length)];
        }
    } else {
      if (length > 10) throw new Error("Cannot generate unique code longer than 10 digits.");
        const availableDigits = digits.split('');
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * availableDigits.length);
            code += availableDigits.splice(randomIndex, 1)[0];
        }
    }
    return code;
}
