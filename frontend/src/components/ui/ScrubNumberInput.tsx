import React, { useState, useRef, useEffect } from 'react';

interface ScrubNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | '';
  onChangeValue: (val: number | '') => void;
  min?: number;
  max?: number;
  step?: number;
  sensitivity?: number; // Pixels required to drag for 1 step change
}

export function ScrubNumberInput({
  value,
  onChangeValue,
  min = -Infinity,
  max = Infinity,
  step = 1,
  sensitivity = 4,
  className = '',
  ...props
}: ScrubNumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; val: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLInputElement>) => {
    if (e.button !== 0) return; // Only primary button
    
    // If it's focused, allow normal text interaction
    if (document.activeElement === inputRef.current) {
      return;
    }

    // Capture pointer so we can drag outside the element bounds
    e.currentTarget.setPointerCapture(e.pointerId);
    const startVal = typeof value === 'number' ? value : 0;
    dragStartRef.current = { x: e.clientX, val: startVal };
    setIsDragging(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLInputElement>) => {
    if (!dragStartRef.current) return;
    if (document.activeElement === inputRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    
    if (!isDragging && Math.abs(deltaX) > 3) {
      setIsDragging(true);
    }

    if (isDragging || Math.abs(deltaX) > 3) {
      // Calculate how many sensitivity units we've crossed
      const steps = Math.floor(deltaX / sensitivity);
      let newVal = dragStartRef.current.val + (steps * step);
      
      // Clamp bounds
      if (newVal < min) newVal = min;
      if (newVal > max) newVal = max;
      
      // Prevent crazy floats
      newVal = Math.round(newVal * 1000) / 1000;

      if (newVal !== value) {
        onChangeValue(newVal);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLInputElement>) => {
    if (!dragStartRef.current) return;
    
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragStartRef.current = null;

    if (!isDragging) {
      // It was a click, not a drag. Focus the input so user can type.
      inputRef.current?.focus();
    }
    
    setIsDragging(false);
  };

  // When focusing normally, we want to reset drag state just in case
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    dragStartRef.current = null;
    setIsDragging(false);
    props.onFocus?.(e);
  };

  return (
    <input
      ref={inputRef}
      type="number"
      value={value}
      onChange={(e) => {
        const val = e.target.value === '' ? '' : Number(e.target.value);
        onChangeValue(val);
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onFocus={handleFocus}
      // touch-none prevents scrolling while swiping horizontally
      // cursor-ew-resize gives visual feedback on desktop
      className={`cursor-ew-resize touch-none ${className}`}
      {...props}
    />
  );
}
