
import React, { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

const TypewriterText = ({ text, speed = 20, onComplete }: TypewriterTextProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle tab visibility - auto-complete when tab becomes hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isTabVisible = !document.hidden;
      setIsVisible(isTabVisible);
      
      // Auto-complete immediately when tab becomes hidden
      if (!isTabVisible && currentIndex < text.length) {
        setDisplayedText(text);
        setCurrentIndex(text.length);
        if (onComplete) {
          onComplete();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentIndex, text.length, onComplete]);

  useEffect(() => {
    if (currentIndex < text.length && isVisible) {
      timerRef.current = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    } else if (currentIndex >= text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete, isVisible]);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <span className="whitespace-pre-line">
      {displayedText}
      {currentIndex < text.length && (
        <span className="animate-pulse text-cyan-400">|</span>
      )}
    </span>
  );
};

export default TypewriterText;
