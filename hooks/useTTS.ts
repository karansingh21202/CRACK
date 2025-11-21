
import { useState, useCallback, useEffect } from 'react';

export const useTTS = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const speak = useCallback((text: string) => {
    if (isMuted || !isSupported) return;

    window.speechSynthesis.cancel(); // Cancel any previous utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.1;
    utterance.pitch = 1.2;
    window.speechSynthesis.speak(utterance);
  }, [isMuted, isSupported]);

  return { isMuted, toggleMute, speak, isTTSSupported: isSupported };
};
