// src/app/dashboard/progress/page.tsx
'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Tables, QuizAttemptWithQuizTopic } from '@/lib/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Loader2, TrendingUp, Activity, Brain } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, ResponsiveContainer, LabelList } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

type MoodLog = Tables<'mood_logs'>;

interface ChartDataPoint {
  name: string; // Typically date or label for X-axis
  value?: number; // Primary value for Bar charts
  focus?: number; // For line charts, specifically focus
  [key: string]: any; // Allow other properties
}

export default function ProgressPage() {
  const [isPending, startTransition] = useTransition();
  const [userId, setUserId] = useState<string|null>(null);
  const [quizAttemptsData, setQuizAttemptsData] = useState<ChartDataPoint[]>([]);
  const [moodFocusData, setMoodFocusData] = useState<ChartDataPoint[]>([]);
  // const [tasksCompletedData, setTasksCompletedData] = useState<ChartDataPoint[]>([]); // For future

  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getCurrentUser();
  }, [supabase]);

  const fetchData = useCallback(async () => {
    if (!userId) return;

    startTransition(async () => {
      // Fetch Quiz Attempts
      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('created_at, score, total_questions, quizzes(topic, subject, class_level)') // Select necessary fields from quizzes
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(10);

      if (attemptsError) {
        toast({ variant: 'destructive', title: 'Error fetching quiz attempts', description: attemptsError.message });
      } else if (attempts) {
        const typedAttempts = attempts as QuizAttemptWithQuizTopic[];
        const formattedAttempts = typedAttempts.map((attempt, index) => {
            const quizName = attempt.quizzes?.topic || attempt.quizzes?.subject || `Quiz ${index + 1}`;
            const percentage = attempt.total_questions > 0 ? (attempt.score / attempt.total_questions) * 100 : 0;
            return {
                name: `${quizName} (${format(parseISO(attempt.created_at), 'MMM d')})`,
                value: parseFloat(percentage.toFixed(1)), // For BarChart dataKey="value"
            };
        });
        setQuizAttemptsData(formattedAttempts);
      }

      // Fetch Mood Logs
      const { data: moods, error: moodsError } = await supabase
        .from('mood_logs')
        .select('created_at, focus_level, mood')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(15); 

      if (moodsError) {
        toast({ variant: 'destructive', title: 'Error fetching mood logs', description: moodsError.message });
      } else if (moods) {
         const formattedMoods = moods.map(log => ({
          name: format(parseISO(log.created_at), 'MMM d'), // X-axis label
          focus: log.focus_level, // Y-axis value for focus line
          mood: log.mood, // Can be used in tooltip
        }));
        setMoodFocusData(formattedMoods);
      }
    });
  }, [userId, supabase, toast]);

  useEffect(() => {
    if(userId) fetchData();
  }, [userId, fetchData]);


  const chartConfig = {
    score: { label: "Score (%)", color: "hsl(var(--primary))" }, // Use primary color from theme
    focus: { label: "Focus Level (1-10)", color: "hsl(var(--accent))" }, // Use accent color from theme
  } as const; // Ensure type safety


  return (
    <div className="space-y-10 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <BarChart3 className="mr-4 h-10 w-10" /> Your Progress Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Visualize your journey! Track quiz performance, focus levels, and more to stay on top of your game.
        </p>
      </header>

      {isPending && (
        <div className="text-center py-20">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-4 text-lg">Loading your progress data...</p>
        </div>
      )}

      {!isPending && (
        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="interactive-card shadow-xl shadow-primary/10">
            <CardHeader>
              <CardTitle className="font-headline text-2xl glow-text-primary flex items-center">
                <TrendingUp className="mr-3 h-7 w-7" /> Quiz Performance Trend
              </CardTitle>
              <CardDescription>Your recent quiz scores (percentage).</CardDescription>
            </CardHeader>
            <CardContent>
              {quizAttemptsData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={quizAttemptsData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
                        <XAxis 
                            dataKey="name" 
                            tickLine={false} 
                            axisLine={false} 
                            tickMargin={8} 
                            angle={-30} 
                            textAnchor="end" 
                            height={60}
                            interval={0}
                            tick={{ fontSize: 10 }}
                        />
                        <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                        <ChartTooltip 
                            content={<ChartTooltipContent indicator="dot" />} 
                            cursorClassName="fill-primary/10"
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="value" name="Score (%)" fill="var(--color-score)" radius={5}>
                            <LabelList dataKey="value" position="top" formatter={(value: number) => `${value}%`} fontSize={10} fill="hsl(var(--foreground))"/>
                        </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <p className="text-muted-foreground text-center py-10">No quiz data available yet. Take some quizzes to see your progress!</p>
              )}
            </CardContent>
          </Card>

          <Card className="interactive-card shadow-xl shadow-accent/10">
            <CardHeader>
              <CardTitle className="font-headline text-2xl glow-text-accent flex items-center">
                <Brain className="mr-3 h-7 w-7" /> Focus Level Over Time
              </CardTitle>
              <CardDescription>Your reported focus levels (1-10) from the Mind & Focus Hub.</CardDescription>
            </CardHeader>
            <CardContent>
              {moodFocusData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={moodFocusData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} />
                            <YAxis domain={[0, 10]} />
                            <ChartTooltip 
                                content={<ChartTooltipContent indicator="dot" />} 
                                cursorClassName="stroke-accent/20 fill-accent/10"
                            />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Line 
                                type="monotone" 
                                dataKey="focus" 
                                stroke="var(--color-focus)" 
                                strokeWidth={2.5} 
                                dot={{ fill: "var(--color-focus)", r: 5, strokeWidth:2, stroke: "hsl(var(--background))" }} 
                                activeDot={{ r: 7, strokeWidth:2, stroke: "hsl(var(--background))" }} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <p className="text-muted-foreground text-center py-10">No focus data available. Log your mood and focus to see trends!</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
