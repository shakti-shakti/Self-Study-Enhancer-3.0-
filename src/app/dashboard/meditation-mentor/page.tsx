// src/app/dashboard/meditation-mentor/page.tsx
'use client';

import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { generateMeditation, GenerateMeditationInputSchema, type GenerateMeditationInput, type GenerateMeditationOutput } from '@/ai/flows/meditation-mentor-flow';
import { BrainCog, Loader2, Sparkles, Wind } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type MeditationFormData = z.infer<typeof GenerateMeditationInputSchema>;

export default function AiMeditationMentorPage() {
  const [isPending, startTransition] = useTransition();
  const [meditation, setMeditation] = useState<GenerateMeditationOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<MeditationFormData>({
    resolver: zodResolver(GenerateMeditationInputSchema),
    defaultValues: {
      stressLevel: 5,
      durationPreference: '3 minutes',
      focusArea: 'general_wellbeing',
    },
  });

  async function onSubmit(values: MeditationFormData) {
    setMeditation(null);
    startTransition(async () => {
      try {
        const result = await generateMeditation(values);
        setMeditation(result);
        toast({
          title: 'Meditation Ready!',
          description: `Your "${result.title}" meditation script is here.`,
          className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary',
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error generating meditation',
          description: error.message || 'An unexpected error occurred.',
        });
      }
    });
  }

  return (
    <div className="space-y-10">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <BrainCog className="mr-4 h-10 w-10" /> AI Meditation Mentor
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Quick guided meditations tailored to your needs. Find calm, focus, or motivation.
        </p>
      </header>

      <Card className="max-w-2xl mx-auto interactive-card p-2 md:p-4 shadow-xl shadow-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline">
            <Wind className="mr-3 h-8 w-8 text-primary" /> Customize Your Session
          </CardTitle>
          <CardDescription>
            Tell the AI how you're feeling and what you need.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="stressLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium flex justify-between">
                      Stress Level <span>({field.value}/10)</span>
                    </FormLabel>
                    <FormControl>
                      <Slider
                        min={1} max={10} step={1}
                        defaultValue={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="[&_.slider-thumb]:bg-primary [&_.slider-range]:bg-primary/80"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="durationPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Duration</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="input-glow h-11"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="1 minute">1 Minute</SelectItem>
                        <SelectItem value="3 minutes">3 Minutes</SelectItem>
                        <SelectItem value="5 minutes">5 Minutes</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="focusArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Focus Area (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="input-glow h-11"><SelectValue placeholder="Select focus area..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="general_wellbeing">General Well-being</SelectItem>
                        <SelectItem value="calm">Calm / Relaxation</SelectItem>
                        <SelectItem value="focus">Improve Focus</SelectItem>
                        <SelectItem value="motivation">Boost Motivation</SelectItem>
                        <SelectItem value="exam_prep">Exam Preparation Anxiety</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full font-semibold text-lg py-6 glow-button" disabled={isPending || !form.formState.isValid}>
                {isPending ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Sparkles className="mr-2 h-6 w-6" />}
                Generate Meditation
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isPending && !meditation && (
        <div className="text-center py-10">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Crafting your meditation script...</p>
        </div>
      )}

      {meditation && (
        <Card className="max-w-2xl mx-auto mt-12 interactive-card shadow-xl shadow-accent/10">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl font-headline glow-text-accent">
              <BrainCog className="mr-3 h-8 w-8" /> {meditation.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
              <div className="prose dark:prose-invert prose-sm sm:prose-base max-w-none whitespace-pre-line p-1">
                {meditation.script}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}