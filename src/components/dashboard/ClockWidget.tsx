
// src/components/dashboard/ClockWidget.tsx
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';

export default function ClockWidget() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set the initial time on the client after hydration
    setCurrentTime(new Date());

    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []); // Empty dependency array ensures this runs once on mount and then sets up the interval

  return (
    <div className="flex items-center text-lg font-medium text-muted-foreground mt-1">
      <Clock className="mr-1.5 h-4 w-4" />
      {currentTime ? format(currentTime, 'HH:mm:ss') : '00:00:00'} {/* Show placeholder or actual time */}
    </div>
  );
}
