// src/app/dashboard/ai-study-assistant/page.tsx
'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { studyAssistant, type StudyAssistantInput, type StudyAssistantOutput } from '@/ai/flows/ai-study-assistant';
import { Bot, Loader2, Send, MessageSquare, User, Lightbulb, List, CornerDownLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createClient } from '@/lib/supabase/client';
import type { Tables, TablesInsert } from '@/lib/database.types';
import { formatDistanceToNow } from 'date-fns';

const assistantSchema = z.object({
  query: z.string().min(3, { message: 'Query must be at least 3 characters.' }),
  context: z.string().optional(),
  studyTipsPreferences: z.string().optional(),
});

type AssistantFormData = z.infer<typeof assistantSchema>;

interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'ai' | 'ai-tips';
  content: string | string[]; 
  timestamp: string; // ISO string
}

interface ChatSession {
    session_id: string;
    last_message_at: string; // ISO string
    first_message_preview: string;
}

export default function AiStudyAssistantPage() {
  const [isPending, startTransition] = useTransition();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const { toast } = useToast();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const form = useForm<AssistantFormData>({
    resolver: zodResolver(assistantSchema),
    defaultValues: { query: '', context: '', studyTipsPreferences: '' },
  });
  
  useEffect(() => {
    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
    };
    getCurrentUser();
  }, [supabase]);

  const fetchChatSessions = useCallback(async () => {
    if (!userId) return;
    setIsLoadingSessions(true);
    const { data, error } = await supabase
        .from('study_assistant_logs')
        .select('session_id, content, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        toast({ variant: 'destructive', title: 'Error fetching chat sessions', description: error.message });
        setIsLoadingSessions(false);
        return;
    }
    
    const sessionsMap = new Map<string, ChatSession>();
    data?.forEach(log => {
        if (!sessionsMap.has(log.session_id)) {
            sessionsMap.set(log.session_id, {
                session_id: log.session_id,
                last_message_at: log.created_at,
                first_message_preview: log.content.substring(0, 50) + (log.content.length > 50 ? '...' : ''),
            });
        } else {
            // Update last_message_at if this log is newer
            const existingSession = sessionsMap.get(log.session_id)!;
            if (new Date(log.created_at) > new Date(existingSession.last_message_at)) {
                sessionsMap.set(log.session_id, { ...existingSession, last_message_at: log.created_at });
            }
        }
    });
    const sortedSessions = Array.from(sessionsMap.values()).sort((a,b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
    setChatSessions(sortedSessions);
    setIsLoadingSessions(false);
  }, [userId, supabase, toast]);

  useEffect(() => {
    fetchChatSessions();
  }, [userId, fetchChatSessions]);


  const loadChatHistory = useCallback(async (sessionId: string) => {
    if (!userId) return;
    setIsLoadingHistory(true);
    setChatHistory([]);
    const { data, error } = await supabase
        .from('study_assistant_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

    if (error) {
        toast({ variant: 'destructive', title: 'Error loading chat history', description: error.message });
    } else {
        const formattedMessages: ChatMessage[] = data.map(log => {
            let role: ChatMessage['role'] = 'ai'; // Default
            let content: ChatMessage['content'] = log.ai_answer || log.content;

            if (log.role === 'user') {
                role = 'user';
                content = log.content;
            } else if (log.ai_study_tips && (log.ai_study_tips as string[]).length > 0) {
                // This logic might need adjustment based on how tips are stored/identified
                // If a message has tips, it's an 'ai-tips' message.
                // If an AI message is split into answer and tips, need two separate entries.
                // For now, assume if tips exist, it's a tips-focused message OR tips are part of a general AI response.
                // For simplicity, we'll use the main content for 'ai' and show tips separately if they exist as a distinct field.
                // The current `study_assistant_logs` schema has `ai_answer` and `ai_study_tips` separate.
                // So, one user query might result in one `user` log, one `ai` (answer) log, and one `ai` (tips) log in the DB.
                // This formatting needs to reflect that.
                // Let's adjust to use the `role` from the DB if present, and content based on that.
                role = log.role as ChatMessage['role']; // User 'user' or 'ai' from DB
                 if (log.ai_study_tips && (log.ai_study_tips as string[]).length > 0 && !log.ai_answer) { // If it's purely a tips message
                    role = 'ai-tips';
                    content = log.ai_study_tips as string[];
                } else if (log.ai_answer) {
                    content = log.ai_answer;
                }
            }
            return {
                id: log.id,
                session_id: log.session_id,
                role: role,
                content: content,
                timestamp: log.created_at,
            };
        });
        setChatHistory(formattedMessages);
    }
    setIsLoadingHistory(false);
  }, [userId, supabase, toast]);
  
  useEffect(() => {
    if (currentSessionId) {
        loadChatHistory(currentSessionId);
    } else {
        setChatHistory([]); // Clear history if no session is selected
    }
  }, [currentSessionId, loadChatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  async function onSubmit(values: AssistantFormData) {
    if (!userId) return;
    const activeSessionId = currentSessionId || uuidv4();
    if (!currentSessionId) {
        setCurrentSessionId(activeSessionId);
        // Add to sessions list optimistically or refetch
        const newOptimisticSession: ChatSession = {
            session_id: activeSessionId,
            last_message_at: new Date().toISOString(),
            first_message_preview: values.query.substring(0,50) + (values.query.length > 50 ? '...' : ''),
        }
        setChatSessions(prev => [newOptimisticSession, ...prev]);
    }


    const userMessageLog: TablesInsert<'study_assistant_logs'> = {
        user_id: userId,
        session_id: activeSessionId,
        role: 'user',
        query: values.query,
        content: values.query, // User's query is the content for user role
        context: values.context,
        preferences: values.studyTipsPreferences,
        created_at: new Date().toISOString(),
    };
    // Optimistically add user message to UI
    setChatHistory(prev => [...prev, {
        id: uuidv4(), 
        session_id: activeSessionId, 
        role: 'user', 
        content: values.query, 
        timestamp: userMessageLog.created_at!
    }]);
    
    form.resetField('query');

    startTransition(async () => {
      try {
        // Log user message to DB
        const { error: userLogError } = await supabase.from('study_assistant_logs').insert(userMessageLog);
        if (userLogError) throw userLogError;

        const result = await studyAssistant(values);
        
        const aiAnswerLog: TablesInsert<'study_assistant_logs'> = {
            user_id: userId,
            session_id: activeSessionId,
            role: 'ai',
            query: values.query, // Link to original query
            content: result.answer, // AI's answer is content for AI role
            ai_answer: result.answer,
            ai_study_tips: result.studyTips,
            created_at: new Date().toISOString(),
        };
        // Log AI answer to DB
        const { error: aiLogError } = await supabase.from('study_assistant_logs').insert(aiAnswerLog);
        if (aiLogError) throw aiLogError;

        // Optimistically add AI answer to UI
         setChatHistory(prev => [...prev, {
            id: uuidv4(), 
            session_id: activeSessionId, 
            role: 'ai', 
            content: result.answer, 
            timestamp: aiAnswerLog.created_at!
        }]);

        if (result.studyTips && result.studyTips.length > 0) {
            // Optimistically add AI tips to UI
            setChatHistory(prev => [...prev, {
                id: uuidv4(), 
                session_id: activeSessionId, 
                role: 'ai-tips', 
                content: result.studyTips, 
                timestamp: aiAnswerLog.created_at! // Same timestamp as answer for simplicity
            }]);
        }
        fetchChatSessions(); // Refresh session list to update last message time

      } catch (error: any) {
        const errorMessageContent = `Sorry, I encountered an error: ${error.message || 'Please try again.'}`;
        setChatHistory(prev => [...prev, {
            id: uuidv4(), 
            session_id: activeSessionId, 
            role: 'ai', 
            content: errorMessageContent, 
            timestamp: new Date().toISOString()
        }]);
        toast({ variant: 'destructive', title: 'Error fetching AI assistance', description: error.message || 'An unexpected error occurred.' });
      }
    });
  }
  
  const startNewChat = () => {
    setCurrentSessionId(null);
    setChatHistory([]);
    form.reset();
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] space-y-6 md:space-y-0 md:space-x-6 pb-16 md:pb-0">
        {/* Sessions Sidebar */}
        <Card className="w-full md:w-1/4 lg:w-1/5 interactive-card shadow-xl shadow-primary/10 flex flex-col min-h-0">
            <CardHeader className="border-b">
                <CardTitle className="font-headline text-xl glow-text-primary flex items-center justify-between">
                    <List className="mr-2" /> Chats
                    <Button variant="ghost" size="icon" onClick={startNewChat} className="text-primary hover:text-primary/80">
                        <CornerDownLeft className="h-5 w-5"/>
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-2">
                    {isLoadingSessions ? (
                        <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
                    ) : chatSessions.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-4 text-center">No chat sessions yet. Start a new conversation!</p>
                    ) : (
                        chatSessions.map(session => (
                            <Button
                                key={session.session_id}
                                variant={currentSessionId === session.session_id ? "secondary" : "ghost"}
                                className="w-full justify-start text-left mb-1 p-2 h-auto block"
                                onClick={() => setCurrentSessionId(session.session_id)}
                            >
                                <p className="text-sm font-medium truncate text-foreground">{session.first_message_preview}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(session.last_message_at), { addSuffix: true })}
                                </p>
                            </Button>
                        ))
                    )}
                </ScrollArea>
            </CardContent>
        </Card>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col space-y-6 min-h-0">
        <header className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-headline font-bold glow-text-primary mb-1 flex items-center">
            <Bot className="mr-3 h-8 w-8" /> AI Study Assistant
            </h1>
            <p className="text-md text-muted-foreground max-w-xl">
            Your personal AI tutor. Ask questions, get explanations, and receive personalized study tips.
            </p>
        </header>

        <Card className="flex-1 flex flex-col interactive-card shadow-xl shadow-primary/10 min-h-0">
            <CardHeader className="border-b">
            <CardTitle className="font-headline text-xl glow-text-primary flex items-center"><MessageSquare className="mr-2" /> {currentSessionId ? "Conversation" : "New Chat"}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                    {isLoadingHistory ? (
                         <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
                    ) : chatHistory.length === 0 && currentSessionId ? (
                         <p className="text-sm text-muted-foreground p-4 text-center">Loading history or empty chat...</p>
                    ): chatHistory.length === 0 && !currentSessionId ? (
                         <p className="text-sm text-muted-foreground p-4 text-center">Ask a question to start the conversation.</p>
                    ) : (
                        chatHistory.map(msg => (
                        <div key={msg.id} className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-lg max-w-[80%] break-words shadow-md ${
                                msg.role === 'user' ? 'bg-primary/80 text-primary-foreground ml-auto' : 
                                msg.role === 'ai-tips' ? 'bg-accent/20 text-accent-foreground border border-accent/30' : 
                                'bg-card-foreground/10 text-foreground'
                            }`}>
                            <div className="flex items-center mb-1 text-xs text-muted-foreground">
                                {msg.role === 'user' ? <User className="h-4 w-4 mr-1.5" /> : (msg.role === 'ai-tips' ? <Lightbulb className="h-4 w-4 mr-1.5 text-accent" /> : <Bot className="h-4 w-4 mr-1.5 text-primary" />)}
                                <span>{msg.role === 'user' ? 'You' : (msg.role === 'ai-tips' ? 'AI Study Tips' : 'AI Assistant')}</span>
                                <span className="ml-2">{formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}</span>
                            </div>
                            {typeof msg.content === 'string' ? (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            ) : ( 
                                <ul className="list-disc pl-5 space-y-1">
                                {msg.content.map((tip, index) => <li key={index}>{tip}</li>)}
                                </ul>
                            )}
                            </div>
                        </div>
                        ))
                    )}
                    {isPending && chatHistory[chatHistory.length -1]?.role === 'user' && (
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
                <FormField control={form.control} name="query" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="sr-only">Your Question</FormLabel>
                        <FormControl><Textarea placeholder="Ask a question or describe a concept..." {...field} className="input-glow min-h-[60px] resize-none" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <div className="flex flex-col sm:flex-row gap-4">
                    <FormField control={form.control} name="context" render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormLabel className="text-sm">Context (Optional)</FormLabel>
                            <FormControl><Input placeholder="E.g., Chapter name, related topic" {...field} className="h-10 input-glow" /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="studyTipsPreferences" render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormLabel className="text-sm">Study Tip Preferences (Optional)</FormLabel>
                            <FormControl><Input placeholder="E.g., Visual learner, Biology" {...field} className="h-10 input-glow" /></FormControl>
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
    </div>
  );
}
