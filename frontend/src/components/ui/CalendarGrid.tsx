import React from 'react';

interface CalendarProps {
  monthName: string;
  loggedDays: number[]; // e.g. [1, 2, 5, 6, 7]
  daysInMonth: number;
}

export function CalendarGrid({ monthName, loggedDays, daysInMonth }: CalendarProps) {
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="bg-surface p-4 border border-surface2 rounded-sm w-full">
      <h3 className="text-gold font-heading mb-4 text-center tracking-widest">{monthName}</h3>
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const isLogged = loggedDays.includes(day);
          return (
            <div 
              key={day} 
              className={`aspect-square flex items-center justify-center text-xs font-mono font-bold border transition-colors
                ${isLogged 
                  ? 'bg-gold/20 border-gold text-gold shadow-[0_0_8px_rgba(201,168,76,0.3)]' 
                  : 'bg-obsidian border-surface2 text-surface2'}`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
