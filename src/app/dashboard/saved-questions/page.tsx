// src/app/dashboard/saved-questions/page.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@/lib/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { Star, Loader2, Trash2, Filter, CalendarDays, BookOpen, Tag } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';

type SavedQuestion = Tables<'saved_questions'>;

export default function SavedQuestionsPage() {
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const supabase = createClient();
  const [userId, setUserId] = useState<string|null>(null);

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
    const fetchSavedQuestions = async () => {
      if (!userId) return;
      startTransition(async () => {
        const { data, error } = await supabase
          .from('saved_questions')
          .select('*')
          .eq('user_id', userId)
          .order('saved_at', { ascending: false });

        if (error) {
          toast({ variant: 'destructive', title: 'Error fetching saved questions', description: error.message });
        } else {
          setSavedQuestions(data || []);
        }
      });
    };

    if (userId) {
      fetchSavedQuestions();
    }
  }, [userId, supabase, toast]);

  const handleDeleteQuestion = async (questionId: string) => {
    if(!userId) return;
    startTransition(async () => {
      const { error } = await supabase
        .from('saved_questions')
        .delete()
        .eq('id', questionId)
        .eq('user_id', userId);

      if (error) {
        toast({ variant: 'destructive', title: 'Error deleting question', description: error.message });
      } else {
        setSavedQuestions(prev => prev.filter(q => q.id !== questionId));
        toast({ title: 'Question removed from saved list.' });
      }
    });
  };

  // TODO: Implement filter UI and logic
  const handleFilter = () => {
    toast({ title: 'Filter (Coming Soon)', description: 'Filtering options will be added here.' });
  };

  if (isPending && savedQuestions.length === 0) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-10 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Star className="mr-4 h-10 w-10 text-yellow-400" /> Your Saved Questions
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Revisit and review the questions you've marked for later study.
        </p>
      </header>

      {/* Filter button - to be implemented */}
      {/* <div className="text-right mb-4">
        <Button variant="outline" onClick={handleFilter} className="glow-button">
          <Filter className="mr-2 h-4 w-4" /> Filter Questions
        </Button>
      </div> */}

      {savedQuestions.length === 0 && !isPending && (
        <Card className="interactive-card shadow-lg">
          <CardContent className="pt-6 text-center">
            <Star className="mx-auto h-16 w-16 text-muted-foreground/50 my-4" />
            <p className="text-xl text-muted-foreground">No questions saved yet.</p>
            <p className="text-sm text-muted-foreground">Save questions from quizzes to review them here.</p>
          </CardContent>
        </Card>
      )}

      {savedQuestions.length > 0 && (
        <Accordion type="single" collapsible className="w-full space-y-4">
          {savedQuestions.map((question, index) => (
            <AccordionItem value={question.id} key={question.id} className="border rounded-lg bg-card interactive-card shadow-md shadow-primary/5">
              <AccordionTrigger className="p-4 text-lg font-medium hover:no-underline text-primary font-headline">
                <div className="flex-1 text-left">
                    <span className="mr-2 text-accent">Q{index+1}.</span> 
                    {question.question_text.substring(0, 80)}{question.question_text.length > 80 ? '...' : ''}
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 pt-0 space-y-3">
                <p className="text-base whitespace-pre-wrap font-semibold">{question.question_text}</p>
                <ul className="list-none pl-0 space-y-1">
                  {(question.options as string[]).map((option, optIndex) => (
                    <li key={optIndex} className={`p-2 rounded ${optIndex === question.correct_option_index ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-muted/30'}`}>
                      {String.fromCharCode(65 + optIndex)}. {option}
                    </li>
                  ))}
                </ul>
                <div className="text-sm text-muted-foreground space-y-1 pt-2 border-t border-border/30">
                    <p className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-accent" /> Saved: {format(parseISO(question.saved_at), "PPP, p")}</p>
                    {question.subject && <p className="flex items-center"><BookOpen className="h-4 w-4 mr-2 text-accent" /> Subject: <Badge variant="secondary" className="ml-1">{question.subject}</Badge></p>}
                    {question.class_level && <p className="flex items-center"><Tag className="h-4 w-4 mr-2 text-accent" /> Class: <Badge variant="secondary" className="ml-1">{question.class_level}</Badge></p>}
                    {question.topic && <p className="flex items-center"><Tag className="h-4 w-4 mr-2 text-accent" /> Topic: <Badge variant="outline" className="ml-1">{question.topic}</Badge></p>}
                    {question.source && <p className="flex items-center"><Tag className="h-4 w-4 mr-2 text-accent" /> Source: <Badge variant="outline" className="ml-1">{question.source}</Badge></p>}
                </div>
                {question.explanation_prompt && (
                    <details className="mt-2 text-sm">
                        <summary className="cursor-pointer text-accent hover:underline">View Explanation Prompt</summary>
                        <p className="p-2 bg-muted/30 rounded mt-1 whitespace-pre-wrap">{question.explanation_prompt}</p>
                    </details>
                )}
                 <div className="text-right mt-4">
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteQuestion(question.id)} disabled={isPending} className="glow-button">
                        <Trash2 className="mr-2 h-4 w-4" /> Remove
                    </Button>
                 </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
