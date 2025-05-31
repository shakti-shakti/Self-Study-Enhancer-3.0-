// src/app/dashboard/focus-timer/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Timer, Play, Pause, RotateCcw, Coffee, Brain, Volume2, VolumeX } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const WORK_DURATION_MIN = 25;
const SHORT_BREAK_MIN = 5;
const LONG_BREAK_MIN = 15;

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

export default function FocusTimerPage() {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION_MIN * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [voiceNotificationsEnabled, setVoiceNotificationsEnabled] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const speak = useCallback((text: string) => {
    if (!voiceNotificationsEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
        const utterance = new SpeechSynthesisUtterance(text);
        // Optionally configure voice, pitch, rate here
        // utterance.voice = speechSynthesis.getVoices().find(v => v.name === "Google US English"); // Example
        utterance.lang = 'en-US';
        speechSynthesis.cancel(); // Cancel any previous speech
        speechSynthesis.speak(utterance);
    } catch (e) {
        console.error("Speech synthesis error:", e);
        toast({variant: "destructive", title: "Voice Notification Error", description: "Could not play voice notification."});
    }
  }, [voiceNotificationsEnabled, toast]);


  const handleSessionEnd = useCallback(() => {
    setIsActive(false);
    if (mode === 'work') {
      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);
      toast({
        title: 'Work Session Complete!',
        description: `+10 Focus XP Earned! You've completed ${newSessionsCompleted} session(s).`,
        className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary',
      });
      speak("Work session complete. Time for a break!");
      if (newSessionsCompleted % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(LONG_BREAK_MIN * 60);
      } else {
        setMode('shortBreak');
        setTimeLeft(SHORT_BREAK_MIN * 60);
      }
    } else { // Break ended
      toast({
        title: 'Break Over!',
        description: 'Time to get back to focus.',
         className: 'bg-accent/10 border-accent text-accent-foreground glow-text-accent',
      });
      speak("Break's over. Time to focus!");
      setMode('work');
      setTimeLeft(WORK_DURATION_MIN * 60);
    }
  }, [mode, sessionsCompleted, toast, speak]);


  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      handleSessionEnd();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, handleSessionEnd]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (mode === 'work') setTimeLeft(WORK_DURATION_MIN * 60);
    else if (mode === 'shortBreak') setTimeLeft(SHORT_BREAK_MIN * 60);
    else setTimeLeft(LONG_BREAK_MIN * 60);
  };
  
  const selectMode = (newMode: TimerMode) => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setMode(newMode);
    if (newMode === 'work') setTimeLeft(WORK_DURATION_MIN * 60);
    else if (newMode === 'shortBreak') setTimeLeft(SHORT_BREAK_MIN * 60);
    else setTimeLeft(LONG_BREAK_MIN * 60);
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const currentDuration = 
    mode === 'work' ? WORK_DURATION_MIN * 60 :
    mode === 'shortBreak' ? SHORT_BREAK_MIN * 60 :
    LONG_BREAK_MIN * 60;
  
  const progressPercentage = ((currentDuration - timeLeft) / currentDuration) * 100;

  const getModeStyles = () => {
    switch(mode) {
      case 'work': return { icon: <Brain className="h-10 w-10 text-primary" />, title: "Focus Session", color: "primary" };
      case 'shortBreak': return { icon: <Coffee className="h-10 w-10 text-accent" />, title: "Short Break", color: "accent" };
      case 'longBreak': return { icon: <Coffee className="h-10 w-10 text-secondary" />, title: "Long Break", color: "secondary" };
      default: return { icon: <Timer className="h-10 w-10 text-muted-foreground" />, title: "Timer", color: "muted" };
    }
  }
  const modeStyle = getModeStyles();

  return (
    <div className="space-y-10">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Timer className="mr-4 h-10 w-10" /> Focus Timer
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Boost your productivity with the Pomodoro technique. Work in focused bursts and take regular breaks.
        </p>
      </header>

      <Card className={`max-w-md mx-auto interactive-card shadow-xl shadow-${modeStyle.color}/20 border-${modeStyle.color}/30`}>
        <CardHeader className="text-center">
            <div className={`mx-auto mb-4 p-3 bg-${modeStyle.color}/10 rounded-full w-fit`}>{modeStyle.icon}</div>
          <CardTitle className={`text-3xl font-headline glow-text-${modeStyle.color}`}>{modeStyle.title}</CardTitle>
          <CardDescription className="text-base">
            {mode === 'work' ? `Focus for ${WORK_DURATION_MIN} minutes.` : `Relax for ${mode === 'shortBreak' ? SHORT_BREAK_MIN : LONG_BREAK_MIN} minutes.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className={`text-7xl font-mono font-bold text-${modeStyle.color} glow-text-${modeStyle.color}`}>
            {formatTime(timeLeft)}
          </div>
          <Progress value={progressPercentage} className={`h-3 [&>div]:bg-gradient-to-r [&>div]:from-${modeStyle.color} [&>div]:to-${modeStyle.color}/70`} />
          <div className="flex justify-center gap-3">
            <Button onClick={toggleTimer} className={`px-8 py-6 text-lg glow-button ${isActive ? 'bg-orange-500 hover:bg-orange-600' : `bg-${modeStyle.color} hover:bg-${modeStyle.color}/90`}`}>
              {isActive ? <Pause className="mr-2" /> : <Play className="mr-2" />}
              {isActive ? 'Pause' : 'Start'}
            </Button>
            <Button variant="outline" onClick={resetTimer} className="px-8 py-6 text-lg glow-button">
              <RotateCcw className="mr-2" /> Reset
            </Button>
          </div>
          <div className="flex justify-center gap-2 pt-4 border-t border-border/30">
            <Button variant={mode === 'work' ? 'default' : 'ghost'} onClick={() => selectMode('work')} className={mode === 'work' ? `glow-button bg-${modeStyle.color}` : ''}>Focus</Button>
            <Button variant={mode === 'shortBreak' ? 'default' : 'ghost'} onClick={() => selectMode('shortBreak')} className={mode === 'shortBreak' ? `glow-button bg-${modeStyle.color}`: ''}>Short Break</Button>
            <Button variant={mode === 'longBreak' ? 'default' : 'ghost'} onClick={() => selectMode('longBreak')} className={mode === 'longBreak' ? `glow-button bg-${modeStyle.color}`: ''}>Long Break</Button>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-center space-y-2">
            <div className="flex items-center space-x-2">
                <Switch
                    id="voice-notifications"
                    checked={voiceNotificationsEnabled}
                    onCheckedChange={setVoiceNotificationsEnabled}
                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
                />
                <Label htmlFor="voice-notifications" className="text-sm text-muted-foreground flex items-center">
                    {voiceNotificationsEnabled ? <Volume2 className="mr-1.5 h-4 w-4" /> : <VolumeX className="mr-1.5 h-4 w-4" />}
                    Voice Notifications
                </Label>
            </div>
          <p className="text-sm text-muted-foreground">Sessions Completed: {sessionsCompleted}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
