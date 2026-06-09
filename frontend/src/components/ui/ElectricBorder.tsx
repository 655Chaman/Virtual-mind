'use client';

import React from 'react';

interface ElectricBorderProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export function ElectricBorder({ children, className = '', color = '#c9a84c' }: ElectricBorderProps) {
  return (
    <div className={`relative p-[1px] overflow-hidden rounded-sm group ${className}`}>
      <span className="absolute inset-0 w-full h-full">
        <span 
          className="absolute inset-0 w-full h-full opacity-50 group-hover:opacity-100 transition-opacity duration-500 animate-[spin_4s_linear_infinite]"
          style={{
            background: `conic-gradient(from 0deg, transparent 0 340deg, ${color} 360deg)`
          }}
        />
      </span>
      <div className="relative h-full w-full bg-obsidian rounded-sm">
        {children}
      </div>
    </div>
  );
}
