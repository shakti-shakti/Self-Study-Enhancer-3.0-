
'use client';

import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSuggestions, type MentalHealthInput } from '@/ai/flows/mental-health-tracker';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Brain, Zap, Lightbulb, Loader2, Sparkles, ThumbsUp, Meh, Frown } from 'lucide-react';

const moodOptions = [
  { value: 'stressed', label: 'Stressed', icon: <Frown className="mr-2 h-5 w-5 text-red-400" /> },
  { value: 'anxious', label: 'Anxious', icon: <Frown className="mr-2 h-5 w-5 text-orange-400" /> },
  { value: 'neutral', label: 'Neutral', icon: <Meh className="mr-2 h-5 w-5 text-yellow-400" /> },
  { value: 'calm', label: 'Calm', icon: <ThumbsUp className="mr-2 h-5 w-5 text-green-400" /> },
  { value: 'energized', label: 'Energized', icon: <Sparkles className="mr-2 h-5 w-5 text-blue-400" /> },
  { value: 'focused', label: 'Focused', icon: <Brain className="mr-2 h-5 w-5 text-purple-400" /> },
];

const formSchema = z.object({
  mood: z.string().min(1, { message: 'Please select your current mood.' }),
  focusLevel: z.number().min(1).max(10),
});

type MentalHealthFormData = z.infer<typeof formSchema>;

export default function MentalHealthTrackerPage() {
  const [isPending, startTransition] = useTransition();
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const { toast } = useToast();
  const supabase = createClient();

  const form = useForm<MentalHealthFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mood: '',
      focusLevel: 5,
    },
  });

  async function onSubmit(values: MentalHealthFormData) {
    setAiSuggestions([]);
    startTransition(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
          return;
        }

        const aiInput: MentalHealthInput = {
          mood: values.mood,
          focusLevel: values.focusLevel,
        };
        const result = await getSuggestions(aiInput);
        setAiSuggestions(result.suggestions);

        const { error: dbError } = await supabase.from('mood_logs').insert({
          user_id: user.id,
          mood: values.mood,
          focus_level: values.focusLevel,
          suggestions: result.suggestions,
        });

        if (dbError) {
          throw new Error(dbError.message);
        }

        toast({
          title: 'Log Saved &amp; Suggestions Ready!',
          description: 'Your mood and focus have been logged.',
          className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary',
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error fetching suggestions',
          description: error.message || 'An unexpected error occurred.',
        });
      }
    });
  }

  return (
    <div className="space-y-10">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3">
          Mind &amp; Focus Hub
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Tune into your well-being. Log your mood and focus to unlock personalized AI insights and boost your study game.
        </p>
      </header>

      <Card className="max-w-2xl mx-auto interactive-card p-2 md:p-4 shadow-xl shadow-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline">
            <Brain className="mr-3 h-8 w-8 text-primary" /> How are you feeling?
          </CardTitle>
          <CardDescription>
            Track your mental state to optimize your preparation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-medium">Current Mood</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 text-base border-2 border-input focus:border-primary glow-button">
                          <SelectValue placeholder="Select your mood..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border">
                        {moodOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-base hover:bg-primary/20">
                            <div className="flex items-center">
                              {option.icon}
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="focusLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-medium flex justify-between items-center">
                      <span>Focus Level</span>
                      <span className="text-primary font-bold text-xl">{field.value}/10</span>
                    </FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        defaultValue={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="[&amp;_.slider-thumb]:bg-primary [&amp;_.slider-range]:bg-primary/80"
                      />
                    </FormControl>
                    <FormDescription>
                      Rate your ability to concentrate right now (1: Low, 10: High).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full font-semibold text-lg py-6 glow-button" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-6 w-6" />
                )}
                Get AI Insights &amp; Log
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {aiSuggestions.length > 0 && (
        <section className="mt-12">
          <h2 className="text-3xl font-headline font-bold text-center mb-8 glow-text-accent">
            <Lightbulb className="inline-block mr-3 h-8 w-8" />
            Your Personalized Suggestions
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiSuggestions.map((suggestion, index) => (
              <Card key={index} className="interactive-card shadow-lg shadow-accent/10">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl text-accent">
                    <Sparkles className="mr-2 h-6 w-6" /> Tip #{index + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base">{suggestion}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
