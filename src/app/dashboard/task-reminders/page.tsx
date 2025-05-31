
// src/app/dashboard/task-reminders/page.tsx
'use client';

import { useState, useEffect, useTransition, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { StudyPlanWithAlarm, TablesInsert } from '@/lib/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlarmClock, BellOff, BellRing, Loader2, Info, Edit3 } from 'lucide-react';
import { format, parseISO, isFuture, isPast } from 'date-fns';
import Link from 'next/link';

type ActiveAlarm = StudyPlanWithAlarm & { isRinging?: boolean };

export default function TaskRemindersPage() {
  const [alarmTasks, setAlarmTasks] = useState<ActiveAlarm[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const supabase = createClient();
  const [userId, setUserId] = useState<string|null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [profileAlarmToneUrl, setProfileAlarmToneUrl] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [defaultAlarmFileExists, setDefaultAlarmFileExists] = useState(true); // Assume it exists initially


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
        
        const toneUrl = profile?.alarm_tone_url || '/alarms/default_alarm.mp3';
        setProfileAlarmToneUrl(toneUrl);

        // Check if default alarm file exists if it's being used
        if (toneUrl === '/alarms/default_alarm.mp3') {
            fetch('/alarms/default_alarm.mp3')
                .then(response => setDefaultAlarmFileExists(response.ok))
                .catch(() => setDefaultAlarmFileExists(false));
        }


        if (toneUrl && !audioRef.current) { 
            const newAudio = new Audio(toneUrl);
            newAudio.loop = true;
            audioRef.current = newAudio;
        } else if (audioRef.current && audioRef.current.src !== toneUrl) { 
            audioRef.current.src = toneUrl;
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
        .not('alarm_set_at', 'is', null) 
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
      let anyRingingNow = false;
      setAlarmTasks(prevTasks => 
        prevTasks.map(task => {
          if (task.alarm_set_at && !task.completed && !task.isRinging) {
            const alarmTime = parseISO(task.alarm_set_at);
            if (isPast(alarmTime) && !task.isRinging) { 
              anyRingingNow = true;
              return { ...task, isRinging: true };
            }
          }
          if (task.isRinging && (task.completed || !task.alarm_set_at)) {
              return {...task, isRinging: false};
          }
          return task;
        })
      );
      
      if (anyRingingNow && audioRef.current && audioRef.current.paused && defaultAlarmFileExists) {
        audioRef.current.play().catch(e => {
            console.error("Error playing audio:", e);
            toast({variant: "destructive", title: "Audio Playback Error", description: "Could not play alarm sound. Check console."});
        });
        setIsAudioPlaying(true);
      } else if (!anyRingingNow && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsAudioPlaying(false);
      }

    }, 1000); 

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultAlarmFileExists]); // Add defaultAlarmFileExists to dependencies

  const stopAudioIfNeeded = () => {
    const stillRinging = alarmTasks.some(task => task.isRinging);
    if (!stillRinging && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsAudioPlaying(false);
    }
  };

  const dismissAlarm = async (taskId: string) => {
    setAlarmTasks(prevTasks => 
      prevTasks.map(task => task.id === taskId ? { ...task, isRinging: false, alarm_set_at: null } : task) 
    );
    stopAudioIfNeeded();
    if(!userId) return;
    startTransition(async () => {
        const { error } = await supabase
            .from('study_plans')
            .update({ alarm_set_at: null }) 
            .eq('id', taskId)
            .eq('user_id', userId);
        if (error) toast({ variant: 'destructive', title: "Error dismissing alarm in DB", description: error.message });
        else {
            toast({ title: "Alarm Dismissed."});
            fetchAlarmTasks(); 
        }
    });
  };

  const snoozeAlarm = (taskId: string) => {
    const newAlarmTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    setAlarmTasks(prevTasks => 
        prevTasks.map(task => task.id === taskId ? { ...task, isRinging: false, alarm_set_at: newAlarmTime } : task)
    );
    stopAudioIfNeeded();
    if(!userId) return;
    startTransition(async () => {
        const { error } = await supabase
            .from('study_plans')
            .update({ alarm_set_at: newAlarmTime })
            .eq('id', taskId)
            .eq('user_id', userId);
        if (error) {
            toast({ variant: 'destructive', title: "Error snoozing alarm", description: error.message });
            fetchAlarmTasks(); 
        } else {
            toast({ title: "Alarm Snoozed!", description: "Reminder set for 5 minutes later." });
            fetchAlarmTasks(); 
        }
    });
  };

  const markAsComplete = async (task: ActiveAlarm) => {
     if(!userId) return;
     startTransition(async () => {
        const { error } = await supabase
            .from('study_plans')
            .update({ completed: true, isRinging: false, alarm_set_at: null }) 
            .eq('id', task.id)
            .eq('user_id', userId);
        if (error) {
            toast({variant: 'destructive', title: 'Error marking task complete', description: error.message});
        } else {
            toast({title: `Task "${task.title}" marked as complete.`});
            setAlarmTasks(prev => prev.map(t => t.id === task.id ? {...t, completed: true, isRinging: false, alarm_set_at: null} : t));
            stopAudioIfNeeded();
            fetchAlarmTasks();
        }
     });
  };


  if (isPending && alarmTasks.length === 0 && !userId) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin text-primary" /> <p className="ml-3 text-muted-foreground">Authenticating...</p></div>;
  }
  if (isPending && alarmTasks.length === 0 && userId) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin text-primary" /> <p className="ml-3 text-muted-foreground">Loading alarms...</p></div>;
  }


  const currentRingingAlarms = alarmTasks.filter(task => task.isRinging && !task.completed);
  const upcomingAlarms = alarmTasks.filter(task => task.alarm_set_at && isFuture(parseISO(task.alarm_set_at)) && !task.completed);


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
            <CardTitle className="text-2xl font-headline glow-text-accent">Active & Upcoming Alarms</CardTitle>
            <CardDescription>
                Tasks from your <Link href="/dashboard/planner" className="text-primary hover:underline">Planner</Link> with alarms set. 
                {profileAlarmToneUrl === '/alarms/default_alarm.mp3' 
                    ? (defaultAlarmFileExists ? " Default alarm tone is set." : " Default alarm tone file (/alarms/default_alarm.mp3) seems to be missing in 'public' folder.")
                    : (profileAlarmToneUrl ? " Custom alarm tone is active." : " Loading alarm tone..." )}
            </CardDescription>
        </CardHeader>
        <CardContent>
            {(currentRingingAlarms.length === 0 && upcomingAlarms.length === 0 && !isPending) && (
                <div className="text-center py-10">
                    <AlarmClock className="mx-auto h-16 w-16 text-muted-foreground/50 my-4" />
                    <p className="text-xl text-muted-foreground">No upcoming or active alarms.</p>
                    <p className="text-sm text-muted-foreground">Set alarms for your tasks in the Planner page.</p>
                </div>
            )}
            {currentRingingAlarms.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-3 text-destructive glow-text-destructive">Ringing Now!</h3>
                    {currentRingingAlarms.map(task => (
                        <Card key={task.id} className="border p-4 rounded-lg shadow-md transition-all duration-300 bg-destructive/20 border-destructive animate-pulse mb-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-destructive-foreground glow-text-destructive">{task.title}</h3>
                                    <p className="text-sm text-destructive-foreground/80">
                                        Alarm was at: {task.alarm_set_at ? format(parseISO(task.alarm_set_at), "PPP, p") : "N/A"}
                                    </p>
                                    {task.subject && <p className="text-xs text-destructive-foreground/70">Subject: {task.subject}</p>}
                                </div>
                                <BellRing className="h-8 w-8 text-destructive-foreground animate-bounce" />
                            </div>
                            {task.description && <p className="mt-2 text-sm text-destructive-foreground/90">{task.description}</p>}
                            <div className="mt-4 flex gap-2 justify-end flex-wrap">
                                <Button variant="outline" size="sm" onClick={() => snoozeAlarm(task.id)} className="glow-button bg-background/80">Snooze (5min)</Button>
                                <Button variant="secondary" size="sm" onClick={() => markAsComplete(task)} className="glow-button">Mark as Complete</Button>
                                <Button variant="destructive" size="sm" onClick={() => dismissAlarm(task.id)} className="bg-destructive/80 hover:bg-destructive">
                                    <BellOff className="mr-2 h-4 w-4" /> Dismiss
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
             {upcomingAlarms.length > 0 && (
                <div>
                    <h3 className="text-xl font-semibold mb-3 text-primary glow-text-primary">Upcoming Alarms</h3>
                    <div className="space-y-4">
                        {upcomingAlarms.map(task => (
                            <Card key={task.id} className="border p-4 rounded-lg shadow-md bg-card">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold text-primary glow-text-primary">{task.title}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Alarm at: {task.alarm_set_at ? format(parseISO(task.alarm_set_at), "PPP, p") : "N/A"}
                                        </p>
                                        {task.subject && <p className="text-xs text-muted-foreground">Subject: {task.subject}</p>}
                                    </div>
                                     <Link href={`/dashboard/planner?edit=${task.id}`} passHref legacyBehavior>
                                        <Button asChild variant="ghost" size="sm"><a href={`/dashboard/planner?edit=${task.id}`}><Edit3 className="h-4 w-4"/></a></Button>
                                     </Link>
                                </div>
                                {task.description && <p className="mt-1 text-sm text-foreground line-clamp-2">{task.description}</p>}
                            </Card>
                        ))}
                    </div>
                </div>
            )}

             <Alert className="mt-6 bg-primary/5 border-primary/20">
                <Info className="h-5 w-5 text-primary" />
                <AlertTitle className="text-primary font-semibold">How Alarms Work</AlertTitle>
                <AlertDescription>
                    This page provides visual and audio cues for your set alarms when it's open in your browser. For alarms to work when the app is closed or in the background, browser notification permissions would be required (future enhancement). Ensure your device volume is on. 
                    You can set a custom alarm tone in your <Link href="/dashboard/profile" className="font-medium text-primary hover:underline">Profile Settings</Link>.
                    {!defaultAlarmFileExists && profileAlarmToneUrl === '/alarms/default_alarm.mp3' && <span className="font-semibold text-destructive"> The default alarm sound file ('/alarms/default_alarm.mp3') was not found in the public folder. Please add it for default alarms to play.</span>}
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

