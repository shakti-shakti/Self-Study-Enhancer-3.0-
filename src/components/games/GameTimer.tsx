
// src/components/games/GameTimer.tsx
import { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';

interface GameTimerProps {
  remainingTime: number; // in seconds
}

export default function GameTimer({ remainingTime }: GameTimerProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded-lg shadow-xl border border-primary/50">
      <div className="flex items-center">
        <Timer className="mr-2 h-6 w-6 text-primary glow-text-primary" />
        <span className="text-2xl font-mono font-bold glow-text-primary">
          {formatTime(remainingTime)}
        </span>
      </div>
    </div>
  );
}

    