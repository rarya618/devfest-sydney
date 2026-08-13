'use client';

import { useEffect, useState } from 'react';

function getRemaining(targetIso: string) {
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export default function Countdown({ targetIso, label }: { targetIso: string; label: string }) {
  const [remaining, setRemaining] = useState(() => getRemaining(targetIso));

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining(targetIso)), 1_000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (!remaining) return null;

  const units = [
    { value: remaining.days, label: 'days' },
    { value: remaining.hours, label: 'hours' },
    { value: remaining.minutes, label: 'minutes' },
    { value: remaining.seconds, label: 'seconds' },
  ];

  return (
    <div className="flex flex-col items-center gap-6" role="timer" aria-label={`${label}: ${remaining.days} days, ${remaining.hours} hours, ${remaining.minutes} minutes, ${remaining.seconds} seconds remaining`}>
      <p className="text-xl font-bold text-white">{label}</p>
      <div className="flex items-center gap-3 sm:gap-6" aria-hidden="true">
        {units.map((unit) => (
          <div key={unit.label} className="flex flex-col items-center gap-1.5">
            <div className="flex items-center justify-center w-[68px] h-[56px] sm:w-[120px] sm:h-[88px] bg-white/[0.06] border border-white/10 border-t-[6px] border-t-white/20 rounded-xl">
              <span className="text-2xl sm:text-5xl font-bold tracking-tight text-white tabular-nums">{String(unit.value).padStart(2, '0')}</span>
            </div>
            <span className="text-xs sm:text-xl font-bold tracking-tight text-white">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
