// src/app/dashboard/ncert-explorer/page.tsx
'use client';

import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getHighlights, type GetHighlightsInput, type GetHighlightsOutput } from '@/ai/flows/ncert-explorer-highlights';
import { BookOpen, Loader2, Search, Sparkles, ListChecks, HelpCircle, FileText } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { createClient } from '@/lib/supabase/client';
import type { TablesInsert } from '@/lib/database.types';

const ncertExplorerSchema = z.object({
  chapterText: z.string().min(100, { message: 'Chapter text must be at least 100 characters.' }).max(50000, {message: "Chapter text is too long for optimal processing."}),
  query: z.string().max(100, {message: "Query is too long."}).optional(),
});

type NcertExplorerFormData = z.infer<typeof ncertExplorerSchema>;

export default function NcertExplorerPage() {
  const [isPending, startTransition] = useTransition();
  const [highlights, setHighlights] = useState<GetHighlightsOutput | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  const form = useForm<NcertExplorerFormData>({
    resolver: zodResolver(ncertExplorerSchema),
    defaultValues: {
      chapterText: '',
      query: '',
    },
  });

  async function onSubmit(values: NcertExplorerFormData) {
    setHighlights(null);
    startTransition(async () => {
      try {
        const result = await getHighlights(values);
        setHighlights(result);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const activityLog: TablesInsert<'activity_logs'> = {
              user_id: user.id,
              activity_type: 'ncert_explorer_used',
              description: `Used NCERT AI Explorer${values.query ? ` with query: "${values.query}"` : ''}.`,
              details: { query: values.query, summary_length: result.summary.length }
            };
            await supabase.from('activity_logs').insert(activityLog);
        }

        toast({
          title: 'Highlights Ready!',
          description: 'AI has analyzed the chapter content.',
          className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary',
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error fetching highlights',
          description: error.message || 'An unexpected error occurred.',
        });
      }
    });
  }

  return (
    <div className="space-y-10">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <BookOpen className="mr-4 h-10 w-10" /> NCERT AI Explorer
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Paste your NCERT chapter text and let AI extract key summaries, diagrams, important lines, and potential questions.
        </p>
      </header>

      <Card className="max-w-3xl mx-auto interactive-card p-2 md:p-4 shadow-xl shadow-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline">
            <Search className="mr-3 h-8 w-8 text-primary" /> Analyze Chapter
          </CardTitle>
          <CardDescription>
            Provide the chapter content and an optional query to focus the AI's analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="chapterText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Chapter Text</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste the full text of the NCERT chapter here..."
                        {...field}
                        className="min-h-[200px] input-glow"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Focus Query (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., 'mitochondria function', 'Newton's laws'" {...field} className="input-glow h-11"/>
                    </FormControl>
                     <FormDescription>Filter highlights based on specific keywords or concepts.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full font-semibold text-lg py-6 glow-button" disabled={isPending || !form.formState.isValid}>
                {isPending ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-6 w-6" />
                )}
                Get AI Highlights
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isPending && !highlights && (
        <div className="text-center py-10">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">AI is analyzing the chapter... this might take a moment.</p>
        </div>
      )}

      {highlights && (
        <section className="mt-12 space-y-8">
          <h2 className="text-3xl font-headline font-bold text-center mb-6 glow-text-accent">
            AI-Powered Chapter Insights
          </h2>
          
          <Card className="interactive-card shadow-lg shadow-accent/10">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-accent font-headline">
                <FileText className="mr-2 h-6 w-6" /> Chapter Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base whitespace-pre-wrap">{highlights.summary}</p>
            </CardContent>
          </Card>

          <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="important-lines">
            {highlights.importantLines && highlights.importantLines.length > 0 && (
                <AccordionItem value="important-lines" className="border rounded-lg bg-card interactive-card shadow-md shadow-primary/5">
                <AccordionTrigger className="p-4 text-lg font-medium hover:no-underline text-primary font-headline">
                    <Sparkles className="mr-2 h-5 w-5 text-primary" /> Important Lines
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                    <ul className="list-disc pl-5 space-y-1">
                        {highlights.importantLines.map((line, index) => (
                        <li key={index}>{line}</li>
                        ))}
                    </ul>
                </AccordionContent>
                </AccordionItem>
            )}

            {highlights.keyDiagrams && highlights.keyDiagrams.length > 0 && (
                <AccordionItem value="key-diagrams" className="border rounded-lg bg-card interactive-card shadow-md shadow-primary/5">
                <AccordionTrigger className="p-4 text-lg font-medium hover:no-underline text-primary font-headline">
                    <ListChecks className="mr-2 h-5 w-5 text-primary" /> Key Diagrams Mentioned
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                    <ul className="list-disc pl-5 space-y-1">
                    {highlights.keyDiagrams.map((diagram, index) => (
                        <li key={index}>{diagram}</li>
                    ))}
                    </ul>
                </AccordionContent>
                </AccordionItem>
            )}
            
            {highlights.likelyQuestions && highlights.likelyQuestions.length > 0 && (
                <AccordionItem value="likely-questions" className="border rounded-lg bg-card interactive-card shadow-md shadow-primary/5">
                <AccordionTrigger className="p-4 text-lg font-medium hover:no-underline text-primary font-headline">
                    <HelpCircle className="mr-2 h-5 w-5 text-primary" /> Likely Questions
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                    <ul className="list-disc pl-5 space-y-1">
                        {highlights.likelyQuestions.map((question, index) => (
                        <li key={index}>{question}</li>
                        ))}
                    </ul>
                </AccordionContent>
                </AccordionItem>
            )}
            
          </Accordion>
        </section>
      )}
    </div>
  );
}
