// src/app/dashboard/mood-tracker/page.tsx
'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { TablesInsert } from '@/lib/database.types';
import { Brain, Loader2, Smile, Meh, Frown, Angry, Laugh, Edit } from 'lucide-react';

const moodOptions = [
  { name: 'Happy', value: 'happy', icon: <Laugh className="h-10 w-10 text-yellow-400" />, color: 'bg-yellow-400/20 border-yellow-500/30 hover:border-yellow-500' },
  { name: 'Calm', value: 'calm', icon: <Smile className="h-10 w-10 text-green-400" />, color: 'bg-green-400/20 border-green-500/30 hover:border-green-500' },
  { name: 'Neutral', value: 'neutral', icon: <Meh className="h-10 w-10 text-blue-400" />, color: 'bg-blue-400/20 border-blue-500/30 hover:border-blue-500' },
  { name: 'Sad', value: 'sad', icon: <Frown className="h-10 w-10 text-gray-400" />, color: 'bg-gray-400/20 border-gray-500/30 hover:border-gray-500' },
  { name: 'Stressed', value: 'stressed', icon: <Frown className="h-10 w-10 text-orange-400" />, color: 'bg-orange-400/20 border-orange-500/30 hover:border-orange-500' },
  { name: 'Anxious', value: 'anxious', icon: <Frown className="h-10 w-10 text-purple-400" />, color: 'bg-purple-400/20 border-purple-500/30 hover:border-purple-500' },
  { name: 'Angry', value: 'angry', icon: <Angry className="h-10 w-10 text-red-400" />, color: 'bg-red-400/20 border-red-500/30 hover:border-red-500' },
  { name: 'Productive', value: 'productive', icon: <Edit className="h-10 w-10 text-teal-400" />, color: 'bg-teal-400/20 border-teal-500/30 hover:border-teal-500' },
];


const moodTrackerSchema = z.object({
  mood: z.string().min(1, { message: 'Please select your mood.' }),
  focusLevel: z.number().min(0).max(10).optional(), // Making focus optional here for simplicity
  notes: z.string().max(500, { message: 'Notes cannot exceed 500 characters.' }).optional(),
});

type MoodTrackerFormData = z.infer<typeof moodTrackerSchema>;

export default function MoodTrackerPage() {
  const [isPending, startTransition] = useTransition();
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  const form = useForm<MoodTrackerFormData>({
    resolver: zodResolver(moodTrackerSchema),
    defaultValues: {
      mood: '',
      notes: '',
    },
  });
  
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getCurrentUser();
  }, [supabase]);


  async function onSubmit(values: MoodTrackerFormData) {
    if (!userId) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    startTransition(async () => {
      try {
        const logEntry: TablesInsert<'mood_logs'> = {
          user_id: userId,
          mood: values.mood,
          focus_level: values.focusLevel || 5, // Default focus if not provided
          suggestions: values.notes ? [values.notes] : [], // Storing notes in suggestions array for now
        };
        const { error } = await supabase.from('mood_logs').insert(logEntry);
        if (error) throw error;

        const activityLog: TablesInsert<'activity_logs'> = {
          user_id: userId,
          activity_type: 'mood_logged',
          description: `Logged mood: ${values.mood}`,
          details: { mood: values.mood, focus: values.focusLevel || 5 }
        };
        await supabase.from('activity_logs').insert(activityLog);
        
        toast({
          title: 'Mood Logged!',
          description: `Your ${values.mood} mood has been recorded.`,
          className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary',
        });
        form.reset({ mood: '', notes: '', focusLevel: 5 });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error logging mood', description: error.message });
      }
    });
  }
  
  const selectedMoodValue = form.watch('mood');

  return (
    <div className="space-y-10">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Brain className="mr-4 h-10 w-10" /> Mood Tracker
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          How are you feeling today? Log your mood to understand your patterns.
        </p>
      </header>

      <Card className="max-w-2xl mx-auto interactive-card p-2 md:p-4 shadow-xl shadow-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Log Your Current Mood</CardTitle>
          <CardDescription>Select an emoji that best represents your feeling.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Select Your Mood</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {moodOptions.map((option) => (
                          <Button
                            key={option.value}
                            type="button"
                            variant="outline"
                            className={`h-auto p-3 flex flex-col items-center space-y-1.5 rounded-lg border-2 transition-all duration-200 ${
                              selectedMoodValue === option.value ? `${option.color} border-opacity-100 scale-105 shadow-lg` : 'border-border/30 hover:border-primary/70'
                            }`}
                            onClick={() => field.onChange(option.value)}
                          >
                            {option.icon}
                            <span className="text-xs font-medium">{option.name}</span>
                          </Button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any thoughts or reasons behind your mood? (Max 500 characters)"
                        {...field}
                        className="input-glow min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full font-semibold text-lg py-3 glow-button" disabled={isPending || !selectedMoodValue}>
                {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Brain className="mr-2 h-5 w-5" />}
                Log Mood
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    