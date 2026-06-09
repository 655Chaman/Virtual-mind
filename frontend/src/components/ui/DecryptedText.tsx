'use client';

import React, { useEffect, useState, useRef } from 'react';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  characters?: string;
  className?: string;
  animateOnHover?: boolean;
}

export function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+{}|:<>?~',
  className = '',
  animateOnHover = false,
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const scramble = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    let iteration = 0;

    intervalRef.current = setInterval(() => {
      setDisplayText((prev) =>
        prev
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) {
              return text[index];
            }
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsAnimating(false);
        setDisplayText(text);
      }

      iteration += 1 / (maxIterations / 2);
    }, speed);
  };

  useEffect(() => {
    if (!animateOnHover) {
      scramble();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, animateOnHover]);

  return (
    <span
      className={className}
      onMouseEnter={animateOnHover ? scramble : undefined}
    >
      {displayText}
    </span>
  );
}
