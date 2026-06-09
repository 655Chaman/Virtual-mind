import React from 'react';

export function LogBanner({ loggedToday }: { loggedToday: boolean }) {
  if (loggedToday) {
    return (
      <div className="w-full bg-vm-green/20 border border-vm-green text-vm-green p-4 rounded text-center tracking-widest font-heading font-bold shadow-[0_0_15px_rgba(76,170,110,0.3)]">
        LOG SECURED — PHASE 0 ACTIVE
      </div>
    );
  }

  return (
    <div className="w-full bg-vm-red/20 border border-vm-red text-vm-red p-4 rounded text-center tracking-widest font-heading font-bold shadow-[0_0_15px_rgba(201,76,76,0.5)] animate-pulse">
      LOG MISSING — SECURE THE DAY
    </div>
  );
}
