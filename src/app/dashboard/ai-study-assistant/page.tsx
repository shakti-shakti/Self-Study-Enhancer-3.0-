// src/app/dashboard/ai-study-assistant/page.tsx
'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { studyAssistant, type StudyAssistantInput, type StudyAssistantOutput } from '@/ai/flows/ai-study-assistant';
import { Bot, Loader2, Send, Sparkles, MessageSquare, User, Lightbulb } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createClient } from '@/lib/supabase/client';
import type { TablesInsert } from '@/lib/database.types';

const assistantSchema = z.object({
  query: z.string().min(5, { message: 'Query must be at least 5 characters.' }),
  context: z.string().optional(),
  studyTipsPreferences: z.string().optional(),
});

type AssistantFormData = z.infer<typeof assistantSchema>;

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'ai-tips';
  content: string | string[]; // string for user/ai answer, string[] for ai-tips
  timestamp: Date;
}

export default function AiStudyAssistantPage() {
  const [isPending, startTransition] = useTransition();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const { toast } = useToast();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const form = useForm<AssistantFormData>({
    resolver: zodResolver(assistantSchema),
    defaultValues: {
      query: '',
      context: '',
      studyTipsPreferences: '',
    },
  });
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  async function onSubmit(values: AssistantFormData) {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: values.query,
      timestamp: new Date(),
    };
    setChatHistory(prev => [...prev, userMessage]);
    form.resetField('query'); // Clear only query field for faster follow-up

    startTransition(async () => {
      try {
        const result = await studyAssistant(values);
        
        const aiAnswerMessage: ChatMessage = {
          id: `ai-ans-${Date.now()}`,
          type: 'ai',
          content: result.answer,
          timestamp: new Date(),
        };
        setChatHistory(prev => [...prev, aiAnswerMessage]);

        if (result.studyTips && result.studyTips.length > 0) {
          const aiTipsMessage: ChatMessage = {
            id: `ai-tips-${Date.now()}`,
            type: 'ai-tips',
            content: result.studyTips,
            timestamp: new Date(),
          };
          setChatHistory(prev => [...prev, aiTipsMessage]);
        }
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const logEntry: TablesInsert<'study_assistant_logs'> = {
                user_id: user.id,
                query: values.query,
                context: values.context,
                preferences: values.studyTipsPreferences,
                ai_answer: result.answer,
                ai_study_tips: result.studyTips
            };
            await supabase.from('study_assistant_logs').insert(logEntry);
        }

      } catch (error: any) {
        const errorMessage: ChatMessage = {
          id: `err-${Date.now()}`,
          type: 'ai',
          content: `Sorry, I encountered an error: ${error.message || 'Please try again.'}`,
          timestamp: new Date(),
        };
        setChatHistory(prev => [...prev, errorMessage]);
        toast({
          variant: 'destructive',
          title: 'Error fetching AI assistance',
          description: error.message || 'An unexpected error occurred.',
        });
      }
    });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] space-y-6">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-2 flex items-center justify-center">
          <Bot className="mr-4 h-10 w-10" /> AI Study Assistant
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Your personal AI tutor. Ask questions, get explanations, and receive personalized study tips.
        </p>
      </header>

      <Card className="flex-1 flex flex-col interactive-card shadow-xl shadow-primary/10 min-h-0">
        <CardHeader className="border-b">
          <CardTitle className="font-headline text-xl glow-text-primary flex items-center"><MessageSquare className="mr-2" /> Chat with AI</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full p-4">
                {chatHistory.map(msg => (
                <div key={msg.id} className={`flex mb-4 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-lg max-w-[80%] break-words shadow-md ${
                        msg.type === 'user' ? 'bg-primary/80 text-primary-foreground ml-auto' : 
                        msg.type === 'ai-tips' ? 'bg-accent/20 text-accent-foreground border border-accent/30' : 
                        'bg-card-foreground/10 text-foreground'
                    }`}>
                    <div className="flex items-center mb-1 text-xs text-muted-foreground">
                        {msg.type === 'user' ? <User className="h-4 w-4 mr-1.5" /> : (msg.type === 'ai-tips' ? <Lightbulb className="h-4 w-4 mr-1.5 text-accent" /> : <Bot className="h-4 w-4 mr-1.5 text-primary" />)}
                        <span>{msg.type === 'user' ? 'You' : (msg.type === 'ai-tips' ? 'AI Study Tips' : 'AI Assistant')}</span>
                        <span className="ml-2">{msg.timestamp.toLocaleTimeString()}</span>
                    </div>
                    {typeof msg.content === 'string' ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : ( // Array of strings for study tips
                        <ul className="list-disc pl-5 space-y-1">
                        {msg.content.map((tip, index) => <li key={index}>{tip}</li>)}
                        </ul>
                    )}
                    </div>
                </div>
                ))}
                 {isPending && chatHistory[chatHistory.length -1]?.type === 'user' && (
                    <div className="flex justify-start mb-4">
                        <div className="p-3 rounded-lg bg-card-foreground/10 text-foreground max-w-[80%] shadow-md">
                            <div className="flex items-center mb-1 text-xs text-muted-foreground">
                                <Bot className="h-4 w-4 mr-1.5 text-primary" /> AI Assistant is typing... <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </ScrollArea>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Your Question</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ask a question or describe a concept... (e.g., Explain mitosis, What are Newton's laws?)" {...field} className="border-2 border-input focus:border-primary min-h-[60px] resize-none" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col sm:flex-row gap-4">
                <FormField control={form.control} name="context" render={({ field }) => (
                    <FormItem className="flex-1">
                        <FormLabel className="text-sm">Context (Optional)</FormLabel>
                        <FormControl><Input placeholder="E.g., Chapter name, related topic" {...field} className="h-10 border-input border-2 focus:border-primary" /></FormControl>
                    </FormItem>
                )} />
                <FormField control={form.control} name="studyTipsPreferences" render={({ field }) => (
                    <FormItem className="flex-1">
                        <FormLabel className="text-sm">Study Tip Preferences (Optional)</FormLabel>
                        <FormControl><Input placeholder="E.g., Visual learner, Biology" {...field} className="h-10 border-input border-2 focus:border-primary" /></FormControl>
                    </FormItem>
                )} />
              </div>
              <Button type="submit" className="w-full sm:w-auto font-semibold text-lg py-3 px-6 glow-button" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                Send to AI
              </Button>
            </form>
          </Form>
        </CardFooter>
      </Card>
    </div>
  );
}

    