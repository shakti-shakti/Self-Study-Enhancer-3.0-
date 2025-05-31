
// src/components/dashboard/ClockWidget.tsx
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';

export default function ClockWidget() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="flex items-center text-lg font-medium text-muted-foreground mt-1">
      <Clock className="mr-1.5 h-4 w-4" />
      {format(currentTime, 'HH:mm:ss')}
    </div>
  );
}
