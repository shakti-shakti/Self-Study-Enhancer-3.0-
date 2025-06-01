
// src/components/dashboard/CountdownWidget.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { differenceInSeconds, intervalToDuration, isValid, parseISO } from 'date-fns'; // Added isValid and parseISO
import { Timer } from 'lucide-react';

interface CountdownWidgetProps {
  targetDate: string; // ISO string
  eventName: string;
}

interface TimeLeft {
  days: number | string;
  hours: number | string;
  minutes: number | string;
  seconds: number | string;
  ended: boolean;
  loading: boolean;
}

export default function CountdownWidget({ targetDate, eventName }: CountdownWidgetProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: '--',
    hours: '--',
    minutes: '--',
    seconds: '--',
    ended: false,
    loading: true,
  });

  const calculateTimeLeft = useCallback(() => {
    const target = parseISO(targetDate);
    if (!isValid(target)) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true, loading: false };
    }

    const now = new Date();
    const secondsLeft = differenceInSeconds(target, now);

    if (secondsLeft <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true, loading: false };
    }

    const duration = intervalToDuration({ start: now, end: target });
    return {
      days: duration.days || 0,
      hours: duration.hours || 0,
      minutes: duration.minutes || 0,
      seconds: duration.seconds || 0,
      ended: false,
      loading: false,
    };
  }, [targetDate]);

  useEffect(() => {
    // Initial calculation on client mount
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  if (timeLeft.loading) {
    return (
      <div className="space-y-1">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="text-3xl font-bold text-foreground">--</div>
              <div className="text-xs text-muted-foreground">LOADING</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
