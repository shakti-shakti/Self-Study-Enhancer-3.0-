
// src/app/dashboard/smart-notes-generator/page.tsx
'use client';

import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateSmartNotes, type GenerateSmartNotesInput, type GenerateSmartNotesOutput } from '@/ai/flows/smart-notes-generator';
import { FileText, Loader2, Wand2, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { TablesInsert } from '@/lib/database.types';

const notesGeneratorSchema = z.object({
  content: z.string().min(10, { message: 'Content must be at least 10 characters.' }).max(30000, { message: 'Content is too long for optimal processing. Try a smaller chunk.'}),
  contentType: z.enum(['test_review', 'chapter_summary', 'concept_clarification'], { required_error: 'Please select content type.' }),
  subject: z.enum(['Physics', 'Chemistry', 'Biology', 'General']).optional(),
  noteFormatPreferences: z.array(z.enum(['summary', 'key_formulas', 'mnemonics', 'bullet_points', 'flowchart_points'])).optional()
});

type NotesGeneratorFormData = z.infer<typeof notesGeneratorSchema>;

export default function SmartNotesGeneratorPage() {
  const [isPending, startTransition] = useTransition();
  const [generatedNotes, setGeneratedNotes] = useState<GenerateSmartNotesOutput | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  const form = useForm<NotesGeneratorFormData>({
    resolver: zodResolver(notesGeneratorSchema),
    defaultValues: {
      content: '',
      contentType: undefined,
      subject: undefined,
      noteFormatPreferences: []
    },
  });

  async function onSubmit(values: NotesGeneratorFormData) {
    setGeneratedNotes(null);
    startTransition(async () => {
      try {
        const result = await generateSmartNotes(values);
        setGeneratedNotes(result);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const logEntry: TablesInsert<'smart_notes_logs'> = {
                user_id: user.id,
                content_type: values.contentType,
                original_content_preview: values.content.substring(0, 200) + (values.content.length > 200 ? '...' : ''), 
                generated_notes: result.notes
            };
            await supabase.from('smart_notes_logs').insert(logEntry);

            const activityLog: TablesInsert<'activity_logs'> = {
              user_id: user.id,
              activity_type: 'smart_notes_generated',
              description: `Generated smart notes for ${values.contentType} ${values.subject ? `on ${values.subject}` : ''}.`,
              details: { content_type: values.contentType, subject: values.subject, title_suggestion: result.titleSuggestion }
            };
            await supabase.from('activity_logs').insert(activityLog);
        }
        
        toast({
          title: 'Smart Notes Ready!',
          description: `AI has generated notes titled: "${result.titleSuggestion || 'Notes'}"`,
          className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary',
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error generating notes',
          description: error.message || 'An unexpected error occurred.',
        });
      }
    });
  }

  return (
    <div className="space-y-10">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <FileText className="mr-4 h-10 w-10" /> Smart Notes Generator
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Paste your test answers or chapter text and let AI create summarized notes, key formulas, or mnemonics for quick review.
        </p>
      </header>

      <Card className="max-w-2xl mx-auto interactive-card p-2 md:p-4 shadow-xl shadow-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline">
            <Wand2 className="mr-3 h-8 w-8 text-primary" /> Generate Your Notes
          </CardTitle>
          <CardDescription>
            Provide the content and its type, and let AI work its magic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Content Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 input-glow">
                          <SelectValue placeholder="Select content type..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="chapter_summary">Chapter Text / Article</SelectItem>
                        <SelectItem value="test_review">Test/Quiz Content (Questions & Answers)</SelectItem>
                        <SelectItem value="concept_clarification">Specific Concept Explanation</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Subject (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger className="h-11 input-glow">
                          <SelectValue placeholder="Select subject to help AI..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="General">General / Mixed</SelectItem>
                        <SelectItem value="Physics">Physics</SelectItem>
                        <SelectItem value="Chemistry">Chemistry</SelectItem>
                        <SelectItem value="Biology">Biology</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Helps AI tailor notes (e.g., focus on formulas for Physics).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your chapter text, test questions & answers, or any study material here..."
                        {...field}
                        className="min-h-[200px] input-glow"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* TODO: Add multi-select for noteFormatPreferences if desired UI is available */}
              <Button type="submit" className="w-full font-semibold text-lg py-6 glow-button" disabled={isPending || !form.formState.isValid}>
                {isPending ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-6 w-6" />
                )}
                Generate Smart Notes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isPending && !generatedNotes && (
        <div className="text-center py-10">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">AI is crafting your notes... this might take a moment.</p>
        </div>
      )}

      {generatedNotes && (
        <Card className="max-w-2xl mx-auto mt-12 interactive-card shadow-xl shadow-accent/10">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl font-headline glow-text-accent">
              <FileText className="mr-3 h-8 w-8" /> {generatedNotes.titleSuggestion || "Your AI-Generated Notes"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert prose-sm sm:prose-base max-w-none whitespace-pre-wrap bg-muted/20 p-4 rounded-md">
              {generatedNotes.notes}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
