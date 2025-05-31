
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
import { Bot, Loader2, Send, MessageSquare, User, Lightbulb, List, CornerDownLeft, Trash2, Paperclip, Mic, MicOff } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createClient } from '@/lib/supabase/client';
import type { Tables, TablesInsert } from '@/lib/database.types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES_FOR_CHAT = ["image/jpeg", "image/jpg", "image/png", "image/webp"];


const assistantSchema = z.object({
  query: z.string().min(3, { message: 'Query must be at least 3 characters.' }),
  context: z.string().optional(),
  studyTipsPreferences: z.string().optional(),
  imageUpload: z
    .custom<FileList>()
    .optional()
    .refine((files) => !files || files.length === 0 || files?.[0]?.size <= MAX_IMAGE_SIZE_BYTES, `Max image size is ${MAX_IMAGE_SIZE_MB}MB.`)
    .refine(
      (files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES_FOR_CHAT.includes(files?.[0]?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported for image upload."
    ),
});

type AssistantFormData = z.infer<typeof assistantSchema>;

interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'ai' | 'ai-tips';
  content: string | string[]; 
  timestamp: string; 
  image_preview_url?: string;
}

interface ChatSession {
    session_id: string;
    last_message_at: string; 
    first_message_preview: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function AiStudyAssistantPage() {
  const [isPending, startTransition] = useTransition();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const [isListening, setIsListening] = useState(false);
  const speechRecognitionRef = useRef<any>(null);


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
      .select('session_id, content, created_at, role, query') 
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  
    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching chat sessions', description: error.message });
      setIsLoadingSessions(false);
      return;
    }
  
    const sessionsMap = new Map<string, ChatSession>();
    if (data) {
      const sortedLogs = [...data].sort((a, b) => {
        if (a.session_id < b.session_id) return -1;
        if (a.session_id > b.session_id) return 1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
  
      sortedLogs.forEach(log => {
        const existingSession = sessionsMap.get(log.session_id);
        let firstMessagePreview = 'Chat...';
  
        if (!existingSession) { 
          if (log.role === 'user' && log.content) {
            firstMessagePreview = log.content.substring(0, 50) + (log.content.length > 50 ? '...' : '');
          } else if (log.query) { 
            firstMessagePreview = log.query.substring(0, 50) + (log.query.length > 50 ? '...' : '');
          }
          sessionsMap.set(log.session_id, {
            session_id: log.session_id,
            last_message_at: log.created_at, 
            first_message_preview: firstMessagePreview,
          });
        } else {
          if (new Date(log.created_at) > new Date(existingSession.last_message_at)) {
            sessionsMap.set(log.session_id, { ...existingSession, last_message_at: log.created_at });
          }
        }
      });
    }
  
    const sortedSessions = Array.from(sessionsMap.values()).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
    setChatSessions(sortedSessions);
    setIsLoadingSessions(false);
  }, [userId, supabase, toast]);

  useEffect(() => {
    if (userId) fetchChatSessions();
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
        const formattedMessages: ChatMessage[] = [];
        data.forEach(log => {
            if (log.role === 'user') {
                 formattedMessages.push({
                    id: log.id,
                    session_id: log.session_id,
                    role: 'user',
                    content: log.content,
                    timestamp: log.created_at,
                    // image_preview_url: log.image_data_uri_preview || undefined // Placeholder for when image storage is setup
                });
            } else if (log.role === 'ai') {
                if (log.ai_answer) {
                    formattedMessages.push({
                        id: log.id + '_answer', 
                        session_id: log.session_id,
                        role: 'ai',
                        content: log.ai_answer,
                        timestamp: log.created_at,
                    });
                }
                if (log.ai_study_tips && (log.ai_study_tips as string[]).length > 0) {
                     formattedMessages.push({
                        id: log.id + '_tips', 
                        session_id: log.session_id,
                        role: 'ai-tips',
                        content: log.ai_study_tips as string[],
                        timestamp: log.created_at, 
                    });
                }
            }
        });
        setChatHistory(formattedMessages);
    }
    setIsLoadingHistory(false);
  }, [userId, supabase, toast]);
  
  useEffect(() => {
    if (currentSessionId) {
        loadChatHistory(currentSessionId);
    } else {
        setChatHistory([]); 
    }
  }, [currentSessionId, loadChatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn("Speech Recognition API not supported in this browser.");
      return;
    }
    speechRecognitionRef.current = new SpeechRecognitionAPI();
    const recognition = speechRecognitionRef.current;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      form.setValue('query', form.getValues('query') + transcript);
      setIsListening(false);
    };
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      toast({ variant: "destructive", title: "Speech Error", description: event.error });
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
  }, [form, toast]);

  const toggleListening = () => {
    if (!speechRecognitionRef.current) {
      toast({ title: "Voice Input Not Supported", description: "Your browser doesn't support speech recognition." });
      return;
    }
    if (isListening) {
      speechRecognitionRef.current.stop();
    } else {
      try {
        speechRecognitionRef.current.start();
        setIsListening(true);
        toast({ title: "Listening...", description: "Start speaking your query."});
      } catch (e) {
        console.error("Error starting speech recognition:", e);
        toast({ variant: "destructive", title: "Could not start voice input.", description: "Try again or check permissions." });
      }
    }
  };


  const handleImageInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        toast({ variant: "destructive", title: "Image too large", description: `Max ${MAX_IMAGE_SIZE_MB}MB.`});
        setImagePreview(null);
        form.resetField('imageUpload');
        if(imageInputRef.current) imageInputRef.current.value = "";
        return;
      }
      if (!ACCEPTED_IMAGE_TYPES_FOR_CHAT.includes(file.type)) {
        toast({ variant: "destructive", title: "Invalid image type", description: "Use JPG, PNG, WEBP."});
        setImagePreview(null);
        form.resetField('imageUpload');
        if(imageInputRef.current) imageInputRef.current.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      form.setValue('imageUpload', event.target.files as FileList);
    } else {
      setImagePreview(null);
      form.resetField('imageUpload');
    }
  };

  async function onSubmit(values: AssistantFormData) {
    if (!userId) return;
    const activeSessionId = currentSessionId || uuidv4();
    if (!currentSessionId) {
        setCurrentSessionId(activeSessionId);
        const newOptimisticSession: ChatSession = {
            session_id: activeSessionId,
            last_message_at: new Date().toISOString(),
            first_message_preview: values.query.substring(0,50) + (values.query.length > 50 ? '...' : ''),
        }
        setChatSessions(prev => [newOptimisticSession, ...prev]);
    }

    const userTimestamp = new Date().toISOString();
    const userMessageLog: TablesInsert<'study_assistant_logs'> = {
        user_id: userId,
        session_id: activeSessionId,
        role: 'user',
        query: values.query, 
        content: values.query,
        context: values.context,
        preferences: values.studyTipsPreferences,
        created_at: userTimestamp,
        // image_data_uri_preview: imagePreview // Placeholder for image storage/handling
    };
    
    setChatHistory(prev => [...prev, {
        id: uuidv4(), 
        session_id: activeSessionId, 
        role: 'user', 
        content: values.query, 
        timestamp: userTimestamp,
        image_preview_url: imagePreview || undefined
    }]);
    
    form.resetField('query');
    form.resetField('imageUpload');
    setImagePreview(null);
    if(imageInputRef.current) imageInputRef.current.value = "";


    startTransition(async () => {
      try {
        const { error: userLogError } = await supabase.from('study_assistant_logs').insert(userMessageLog);
        if (userLogError) throw userLogError;

        // NOTE: Image data is not yet passed to the AI flow. This is a UI addition for now.
        // To pass image, studyAssistant input and flow would need to be updated.
        const aiInputPayload: StudyAssistantInput = {
            query: values.query,
            context: values.context,
            studyTipsPreferences: values.studyTipsPreferences,
            // Add image_data_uri: imagePreview if AI flow supports it
        };
        const result = await studyAssistant(aiInputPayload);
        
        const aiTimestamp = new Date().toISOString();
        const aiResponseLog: TablesInsert<'study_assistant_logs'> = {
            user_id: userId,
            session_id: activeSessionId,
            role: 'ai',
            query: values.query,
            content: result.answer + (result.studyTips && result.studyTips.length > 0 ? "\nStudy Tips:\n- " + result.studyTips.join("\n- ") : ""), 
            ai_answer: result.answer,
            ai_study_tips: result.studyTips || [],
            created_at: aiTimestamp,
        };
        const { error: aiLogError } = await supabase.from('study_assistant_logs').insert(aiResponseLog);
        if (aiLogError) throw aiLogError;

        if (result.answer) {
            setChatHistory(prev => [...prev, {
                id: uuidv4() + '_answer', 
                session_id: activeSessionId, 
                role: 'ai', 
                content: result.answer, 
                timestamp: aiTimestamp
            }]);
        }
        if (result.studyTips && result.studyTips.length > 0) {
            setChatHistory(prev => [...prev, {
                id: uuidv4() + '_tips', 
                session_id: activeSessionId, 
                role: 'ai-tips', 
                content: result.studyTips, 
                timestamp: aiTimestamp 
            }]);
        }
        setChatSessions(prevSessions => prevSessions.map(s => 
            s.session_id === activeSessionId ? {...s, last_message_at: aiTimestamp} : s
        ).sort((a,b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()));

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
    setImagePreview(null);
    if(imageInputRef.current) imageInputRef.current.value = "";
  }

  const deleteChatSession = async (sessionId: string) => {
    if (!userId) return;
    startTransition(async () => {
        const { error } = await supabase
            .from('study_assistant_logs')
            .delete()
            .eq('user_id', userId)
            .eq('session_id', sessionId);
        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting chat session', description: error.message });
        } else {
            toast({ title: 'Chat session deleted.' });
            setChatSessions(prev => prev.filter(s => s.session_id !== sessionId));
            if (currentSessionId === sessionId) {
                startNewChat();
            }
        }
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] space-y-6 md:space-y-0 md:space-x-6 pb-16 md:pb-0">
        <Card className="w-full md:w-1/3 lg:w-1/4 interactive-card shadow-xl shadow-primary/10 flex flex-col min-h-0">
            <CardHeader className="border-b">
                <CardTitle className="font-headline text-xl glow-text-primary flex items-center justify-between">
                    <List className="mr-2" /> Chats
                    <Button variant="ghost" size="icon" onClick={startNewChat} className="text-primary hover:text-primary/80" title="Start New Chat">
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
                            <div key={session.session_id} className="relative group">
                                <Button
                                    variant={currentSessionId === session.session_id ? "secondary" : "ghost"}
                                    className="w-full justify-start text-left mb-1 p-2 h-auto block"
                                    onClick={() => setCurrentSessionId(session.session_id)}
                                >
                                    <p className="text-sm font-medium truncate text-foreground">{session.first_message_preview}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(parseISO(session.last_message_at), { addSuffix: true })}
                                    </p>
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="absolute top-1/2 right-1 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 text-destructive/70 hover:text-destructive h-7 w-7">
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete this chat session and all its messages. This action cannot be undone.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteChatSession(session.session_id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                            Delete
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))
                    )}
                </ScrollArea>
            </CardContent>
        </Card>

      <div className="flex-1 flex flex-col space-y-6 min-h-0">
        <header className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-headline font-bold glow-text-primary mb-1 flex items-center">
            <Bot className="mr-3 h-8 w-8" /> AI Study Assistant
            </h1>
            <p className="text-md text-muted-foreground max-w-xl">
            Your personal AI tutor. Ask questions, get explanations, and receive personalized study tips. Upload an image or use voice input.
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
                                <span className="ml-2">{formatDistanceToNow(parseISO(msg.timestamp), { addSuffix: true })}</span>
                            </div>
                            {msg.image_preview_url && (
                                <img src={msg.image_preview_url} alt="Uploaded context" className="my-2 rounded-md max-h-40" />
                            )}
                            {typeof msg.content === 'string' ? (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            ) : ( 
                                <ul className="list-disc pl-5 space-y-1">
                                {(msg.content as string[]).map((tip, index) => <li key={index}>{tip}</li>)}
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
                  <div className="flex items-end gap-2">
                    <FormField control={form.control} name="query" render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormLabel className="sr-only">Your Question</FormLabel>
                            <FormControl><Textarea placeholder="Ask a question or describe a concept..." {...field} className="input-glow min-h-[60px] resize-none" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <Button 
                      type="button" 
                      variant={isListening ? "destructive" : "outline"} 
                      size="icon" 
                      onClick={toggleListening} 
                      className="h-[60px] w-[60px] glow-button"
                      title={isListening ? "Stop listening" : "Use voice input"}
                    >
                      {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                    </Button>
                  </div>
                {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 rounded-md max-h-32" />}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField control={form.control} name="context" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm">Context (Optional)</FormLabel>
                            <FormControl><Input placeholder="E.g., Chapter name" {...field} className="h-10 input-glow" /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="studyTipsPreferences" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm">Study Tip Preferences (Optional)</FormLabel>
                            <FormControl><Input placeholder="E.g., Visual learner" {...field} className="h-10 input-glow" /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="imageUpload" render={() => (
                        <FormItem>
                            <FormLabel className="text-sm">Attach Image (Optional)</FormLabel>
                             <FormControl>
                                <div className="relative">
                                    <Input type="file" accept={ACCEPTED_IMAGE_TYPES_FOR_CHAT.join(',')} ref={imageInputRef} onChange={handleImageInputChange} className="input-glow file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 h-10" />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <Button type="submit" className="w-full sm:w-auto font-semibold text-lg py-3 px-6 glow-button" disabled={isPending || !form.formState.isValid}>
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

    