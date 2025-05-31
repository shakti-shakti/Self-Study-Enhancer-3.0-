// src/app/dashboard/task-reminders/page.tsx
'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { StudyPlanWithAlarm } from '@/lib/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlarmClock, BellOff, BellRing, Loader2, Info } from 'lucide-react';
import { format, parseISO, isFuture } from 'date-fns';
import Link from 'next/link';

// This component will list tasks that have alarms set from the Planner.
// The actual alarm ringing logic is complex for a web app and usually requires
// browser notifications API, service workers for offline/background notifications,
// or integration with native device capabilities if wrapped in a native shell.
// For this web version, we'll focus on:
// 1. Displaying tasks with alarms.
// 2. A visual cue when a task's alarm time is reached (if the page is open).
// 3. Allowing users to "dismiss" a visual alarm.

type ActiveAlarm = StudyPlanWithAlarm & { isRinging?: boolean };

export default function TaskRemindersPage() {
  const [alarmTasks, setAlarmTasks] = useState<ActiveAlarm[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const supabase = createClient();
  const [userId, setUserId] = useState<string|null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [profileAlarmToneUrl, setProfileAlarmToneUrl] = useState<string | null>(null);


  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });
     const getInitialUser = async () => {
        const {data: {user}} = await supabase.auth.getUser();
        setUserId(user?.id || null);
    };
    getInitialUser();
    return () => subscription.unsubscribe();
  }, [supabase]);
  
  useEffect(() => {
    if (userId) {
      const fetchProfile = async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('alarm_tone_url')
          .eq('id', userId)
          .single();
        if (profile?.alarm_tone_url) {
          setProfileAlarmToneUrl(profile.alarm_tone_url);
          const newAudio = new Audio(profile.alarm_tone_url);
          newAudio.loop = true;
          setAudio(newAudio);
        } else {
            // Fallback if no custom tone is set
            const defaultTone = '/alarms/default_alarm.mp3'; // Ensure this file exists in /public/alarms
            const newAudio = new Audio(defaultTone);
            newAudio.loop = true;
            setAudio(newAudio);
        }
      };
      fetchProfile();
    }
  }, [userId, supabase]);


  const fetchAlarmTasks = useCallback(async () => {
    if (!userId) return;
    startTransition(async () => {
      const { data, error } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', userId)
        .not('alarm_set_at', 'is', null) // Only tasks with alarms
        .order('alarm_set_at', { ascending: true });

      if (error) {
        toast({ variant: 'destructive', title: 'Error fetching alarm tasks', description: error.message });
      } else {
        setAlarmTasks(data?.map(task => ({...task, isRinging: false})) || []);
      }
    });
  }, [userId, supabase, toast]);

  useEffect(() => {
    if (userId) fetchAlarmTasks();
  }, [userId, fetchAlarmTasks]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAlarmTasks(prevTasks => 
        prevTasks.map(task => {
          if (task.alarm_set_at && !task.completed && !task.isRinging) {
            const alarmTime = parseISO(task.alarm_set_at);
            if (new Date() >= alarmTime) {
              if (audio && audio.paused) { // Play only if not already playing for another alarm
                audio.play().catch(e => console.error("Error playing audio:", e));
              }
              return { ...task, isRinging: true };
            }
          }
          return task;
        })
      );
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [audio]); // Re-run if audio object changes (e.g. on new tone upload)

  const dismissAlarm = (taskId: string) => {
    setAlarmTasks(prevTasks => 
      prevTasks.map(task => task.id === taskId ? { ...task, isRinging: false } : task)
    );
    if (audio) {
        audio.pause();
        audio.currentTime = 0; // Reset audio
    }
    // Optionally, mark task as "seen" or update its status in DB
  };

  const snoozeAlarm = (taskId: string) => {
    // Example: Snooze for 5 minutes
    const newAlarmTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    startTransition(async () => {
        const { error } = await supabase
            .from('study_plans')
            .update({ alarm_set_at: newAlarmTime })
            .eq('id', taskId)
            .eq('user_id', userId!);
        if (error) {
            toast({ variant: 'destructive', title: "Error snoozing alarm", description: error.message });
        } else {
            toast({ title: "Alarm Snoozed!", description: "Reminder set for 5 minutes later." });
            dismissAlarm(taskId); // Stop current ringing
            fetchAlarmTasks(); // Refetch to update list
        }
    });
  };


  if (isPending && alarmTasks.length === 0) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-10 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <AlarmClock className="mr-4 h-10 w-10 text-accent" /> Task Reminders
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Manage your alarms and stay on top of your study schedule. Reminders will appear here.
        </p>
      </header>

      <Card className="interactive-card shadow-lg p-4 md:p-6">
        <CardHeader>
            <CardTitle className="text-2xl font-headline glow-text-accent">Upcoming & Active Alarms</CardTitle>
            <CardDescription>
                Tasks from your <Link href="/dashboard/planner" className="text-primary hover:underline">Planner</Link> with alarms set. 
                {profileAlarmToneUrl ? " Custom alarm tone is active." : " Default alarm tone will be used."}
            </CardDescription>
        </CardHeader>
        <CardContent>
            {alarmTasks.length === 0 && !isPending && (
                <div className="text-center py-10">
                    <AlarmClock className="mx-auto h-16 w-16 text-muted-foreground/50 my-4" />
                    <p className="text-xl text-muted-foreground">No alarms set.</p>
                    <p className="text-sm text-muted-foreground">Set alarms for your tasks in the Planner page.</p>
                </div>
            )}
            <div className="space-y-4">
                {alarmTasks.filter(task => isFuture(parseISO(task.alarm_set_at!)) || task.isRinging).map(task => (
                    <Card key={task.id} className={`border p-4 rounded-lg shadow-md transition-all duration-300 ${task.isRinging ? 'bg-destructive/20 border-destructive animate-pulse' : task.completed ? 'bg-green-500/10 border-green-500/30 opacity-70' : 'bg-card'}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className={`text-xl font-semibold ${task.isRinging ? 'text-destructive-foreground glow-text-destructive' : 'text-primary glow-text-primary'}`}>{task.title}</h3>
                                <p className={`text-sm ${task.isRinging ? 'text-destructive-foreground/80' : 'text-muted-foreground'}`}>
                                    Alarm at: {format(parseISO(task.alarm_set_at!), "PPP, p")}
                                </p>
                                {task.subject && <p className="text-xs text-muted-foreground">Subject: {task.subject}</p>}
                            </div>
                            {task.isRinging && <BellRing className="h-8 w-8 text-destructive-foreground animate-bounce" />}
                        </div>
                        {task.description && <p className={`mt-2 text-sm ${task.isRinging ? 'text-destructive-foreground/90' : 'text-foreground'}`}>{task.description}</p>}
                        {task.isRinging && (
                            <div className="mt-4 flex gap-2 justify-end">
                                <Button variant="outline" size="sm" onClick={() => snoozeAlarm(task.id)} className="glow-button">Snooze (5min)</Button>
                                <Button variant="destructive" size="sm" onClick={() => dismissAlarm(task.id)} className="bg-destructive/80 hover:bg-destructive">
                                    <BellOff className="mr-2 h-4 w-4" /> Dismiss
                                </Button>
                            </div>
                        )}
                    </Card>
                ))}
                 {alarmTasks.length > 0 && alarmTasks.every(task => task.completed || (task.alarm_set_at && !isFuture(parseISO(task.alarm_set_at)) && !task.isRinging )) && (
                    <p className="text-center text-muted-foreground py-6">No upcoming or active alarms.</p>
                )}
            </div>
             <Alert className="mt-6 bg-primary/5 border-primary/20">
                <Info className="h-5 w-5 text-primary" />
                <AlertTitle className="text-primary font-semibold">How Alarms Work</AlertTitle>
                <AlertDescription>
                    This page provides visual and audio cues for your set alarms when it's open in your browser. For alarms to work when the app is closed or in the background, browser notification permissions might be required (feature to be enhanced). Ensure your device volume is on.
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
