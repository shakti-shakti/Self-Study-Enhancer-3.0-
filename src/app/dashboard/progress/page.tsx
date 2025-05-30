// src/app/dashboard/progress/page.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@/lib/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Loader2, TrendingUp, Activity, Brain } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type QuizAttempt = Tables<'quiz_attempts'>;
type MoodLog = Tables<'mood_logs'>;
// type StudyPlan = Tables<'study_plans'>; // For future use: tasks completed

interface ChartData {
  name: string;
  value: number;
  [key: string]: any; 
}

export default function ProgressPage() {
  const [isPending, startTransition] = useTransition();
  const [quizAttemptsData, setQuizAttemptsData] = useState<ChartData[]>([]);
  const [moodFocusData, setMoodFocusData] = useState<ChartData[]>([]);
  // const [tasksCompletedData, setTasksCompletedData] = useState<ChartData[]>([]); // For future

  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      startTransition(async () => {
        // Fetch Quiz Attempts
        const { data: attempts, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select('*, quizzes(topic)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(10); // Display last 10 attempts

        if (attemptsError) {
          toast({ variant: 'destructive', title: 'Error fetching quiz attempts', description: attemptsError.message });
        } else if (attempts) {
          const formattedAttempts = attempts.map((attempt, index) => ({
            name: `${attempt.quizzes?.topic || 'Quiz'} #${index + 1}`,
            value: (attempt.score / (attempt.answers_submitted as any[]).length) * 100, // Calculate percentage
            date: format(new Date(attempt.created_at), 'MMM d'),
          }));
          setQuizAttemptsData(formattedAttempts);
        }

        // Fetch Mood Logs
        const { data: moods, error: moodsError } = await supabase
          .from('mood_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(15); // Display last 15 logs

        if (moodsError) {
          toast({ variant: 'destructive', title: 'Error fetching mood logs', description: moodsError.message });
        } else if (moods) {
           const formattedMoods = moods.map(log => ({
            name: format(new Date(log.created_at), 'MMM d'),
            focus: log.focus_level,
            // Mood could be visualized differently, e.g., mapping string to number if needed
            // For simplicity, we're focusing on 'focusLevel' for line chart
          }));
          setMoodFocusData(formattedMoods);
        }
        
        // Fetch Study Plans (for tasks completed - future enhancement)
        // Example: Count completed tasks per day/week
      });
    };
    fetchData();
  }, []);

  const chartConfig = {
    score: { label: "Score (%)", color: "hsl(var(--chart-1))" },
    focus: { label: "Focus Level (1-10)", color: "hsl(var(--chart-2))" },
  };

  return (
    <div className="space-y-10">
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
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart accessibilityLayer data={quizAttemptsData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <ChartTooltip content={<ChartTooltipContent />} cursorClassName="fill-primary/10" />
                     <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="value" name="Score (%)" fill="var(--color-score)" radius={4} />
                  </BarChart>
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
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <LineChart accessibilityLayer data={moodFocusData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis domain={[0, 10]} />
                    <ChartTooltip content={<ChartTooltipContent />} cursorClassName="stroke-accent/20 fill-accent/10" />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="focus" stroke="var(--color-focus)" strokeWidth={2} dot={{ fill: "var(--color-focus)", r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ChartContainer>
              ) : (
                <p className="text-muted-foreground text-center py-10">No focus data available. Log your mood and focus to see trends!</p>
              )}
            </CardContent>
          </Card>
          
          {/* Placeholder for Tasks Completed Chart */}
          {/* <Card className="interactive-card shadow-lg shadow-green-500/10">
            <CardHeader>
              <CardTitle className="font-headline text-2xl glow-text-green-400 flex items-center">
                <Activity className="mr-3 h-7 w-7" /> Task Completion Rate (Coming Soon)
              </CardTitle>
              <CardDescription>Track how many tasks you complete over time from your planner.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Task completion chart will be available soon.</p>
            </CardContent>
          </Card> */}
        </div>
      )}
    </div>
  );
}

    