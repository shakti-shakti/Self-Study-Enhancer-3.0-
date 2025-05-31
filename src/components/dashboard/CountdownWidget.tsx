
// src/components/dashboard/CountdownWidget.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { differenceInSeconds, intervalToDuration } from 'date-fns';
import { Timer } from 'lucide-react';

interface CountdownWidgetProps {
  targetDate: string; // ISO string
  eventName: string;
}

export default function CountdownWidget({ targetDate, eventName }: CountdownWidgetProps) {
  const calculateTimeLeft = useCallback(() => {
    const now = new Date();
    const end = new Date(targetDate);
    const secondsLeft = differenceInSeconds(end, now);

    if (secondsLeft <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
    }

    const duration = intervalToDuration({ start: now, end });
    return {
      days: duration.days || 0,
      hours: duration.hours || 0,
      minutes: duration.minutes || 0,
      seconds: duration.seconds || 0,
      ended: false,
    };
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  if (timeLeft.ended) {
    return (
      <div className="text-center text-lg font-semibold text-primary">
        The event "{eventName}" has passed or is happening now!
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div>
          <div className="text-3xl font-bold text-foreground">{String(timeLeft.days).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">DAYS</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-foreground">{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">HOURS</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-foreground">{String(timeLeft.minutes).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">MINUTES</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-foreground">{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">SECONDS</div>
        </div>
      </div>
    </div>
  );
}
