// src/app/dashboard/translator/page.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Tables, TablesInsert } from '@/lib/database.types';
import { translateText, type TranslationInput, type TranslationOutput } from '@/ai/flows/translation-flow';
import { Languages, Loader2, ArrowRightLeft, History, Trash2, ClipboardCopy } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO } from 'date-fns';

// Supported languages (can be expanded)
const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'bn', label: 'Bengali' },
  { value: 'te', label: 'Telugu' },
  { value: 'mr', label: 'Marathi' },
  { value: 'ta', label: 'Tamil' },
];

const translationSchema = z.object({
  textToTranslate: z.string().min(1, { message: 'Please enter text to translate.' }),
  sourceLanguage: z.string().min(2, {message: 'Source language required.'}).optional(), // Optional, AI can detect
  targetLanguage: z.string().min(2, {message: 'Target language required.'}),
});
type TranslationFormData = z.infer<typeof translationSchema>;
type TranslationHistoryEntry = Tables<'translation_history'>;

export default function TranslatorPage() {
  const [isPending, startTransition] = useTransition();
  const [aiResponse, setAiResponse] = useState<TranslationOutput | null>(null);
  const [history, setHistory] = useState<TranslationHistoryEntry[]>([]);
  const { toast } = useToast();
  const supabase = createClient();
  const [userId, setUserId] = useState<string|null>(null);

  const form = useForm<TranslationFormData>({
    resolver: zodResolver(translationSchema),
    defaultValues: { textToTranslate: '', targetLanguage: 'hi' },
  });
  
  useEffect(() => {
    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
    };
    getCurrentUser();
  }, [supabase]);

  const fetchHistory = async () => {
    if (!userId) return;
    startTransition(async () => {
        const { data, error } = await supabase
            .from('translation_history')
            .select('*')
            .eq('user_id', userId)
            .order('translated_at', { ascending: false })
            .limit(15);
        if (error) toast({ variant: 'destructive', title: 'Error fetching history', description: error.message });
        else setHistory(data || []);
    });
  };
  
  useEffect(() => {
    if(userId) fetchHistory();
  }, [userId]); // Basic fetch

  async function onSubmit(values: TranslationFormData) {
    if(!userId) return;
    setAiResponse(null);
    startTransition(async () => {
      try {
        const input: TranslationInput = values;
        const result = await translateText(input);
        setAiResponse(result);
        
        const logEntry: TablesInsert<'translation_history'> = {
            user_id: userId,
            original_text: values.textToTranslate,
            translated_text: result.translated_text,
            source_language: result.detected_source_language || values.sourceLanguage || 'auto',
            target_language: values.targetLanguage,
        };
        await supabase.from('translation_history').insert(logEntry);
        fetchHistory();

      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error translating text', description: error.message });
      }
    });
  }

  const handleDeleteHistoryItem = async (id: string) => {
    if(!userId) return;
    startTransition(async () => {
        const {error} = await supabase.from('translation_history').delete().eq('id', id).eq('user_id', userId);
        if (error) toast({ variant: 'destructive', title: 'Error deleting history item', description: error.message });
        else {
            toast({title: "History item deleted."});
            fetchHistory();
        }
    });
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({title: "Copied to clipboard!"});
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] pb-16 md:pb-0">
        {/* Main Translator Area */}
        <div className="md:col-span-2 space-y-6 flex flex-col">
            <header className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-headline font-bold glow-text-primary mb-2 flex items-center">
                <Languages className="mr-3 h-8 w-8" /> AI Powered Translator
                </h1>
                <p className="text-md text-muted-foreground">
                Translate text between various languages.
                </p>
            </header>

            <Card className="interactive-card shadow-xl shadow-primary/10 flex-1 flex flex-col min-h-0">
                <CardHeader>
                    <CardTitle className="flex items-center text-2xl font-headline glow-text-primary">
                        <ArrowRightLeft className="mr-2" /> Translate Text
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField control={form.control} name="textToTranslate" render={({ field }) => (
                                <FormItem className="flex-1">
                                <FormLabel>Text to Translate</FormLabel>
                                <FormControl><Textarea placeholder="Enter text here..." {...field} rows={6} className="input-glow text-base" /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                            <div className="grid sm:grid-cols-2 gap-4">
                                <FormField control={form.control} name="sourceLanguage" render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>From (Optional - AI auto-detects)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="input-glow h-11"><SelectValue placeholder="Auto-detect" /></SelectTrigger></FormControl>
                                        <SelectContent>{languageOptions.map(lang => <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="targetLanguage" render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>To</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="input-glow h-11"><SelectValue placeholder="Select target language..." /></SelectTrigger></FormControl>
                                        <SelectContent>{languageOptions.map(lang => <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <Button type="submit" className="w-full text-lg py-3 glow-button" disabled={isPending}>
                                {isPending ? <Loader2 className="animate-spin mr-2" /> : <Languages className="mr-2" />} Translate
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                {aiResponse && (
                    <CardFooter className="border-t pt-4 flex-col items-start space-y-2">
                        <h3 className="text-xl font-semibold glow-text-accent">Translation:</h3>
                        <div className="w-full p-3 bg-muted/50 rounded-md min-h-[100px] whitespace-pre-wrap text-base relative input-glow">
                           {aiResponse.translated_text}
                           <Button variant="ghost" size="icon" onClick={() => copyToClipboard(aiResponse.translated_text)} className="absolute top-1 right-1 h-7 w-7 text-muted-foreground hover:text-primary">
                                <ClipboardCopy className="h-4 w-4"/>
                           </Button>
                        </div>
                        {aiResponse.detected_source_language && <p className="text-sm text-muted-foreground">Detected source language: {languageOptions.find(l=>l.value === aiResponse.detected_source_language)?.label || aiResponse.detected_source_language}</p>}
                    </CardFooter>
                )}
            </Card>
        </div>
        
        {/* History Sidebar */}
        <Card className="interactive-card shadow-md shadow-secondary/10 flex flex-col min-h-0">
            <CardHeader className="border-b">
                <CardTitle className="font-headline text-xl glow-text-secondary flex items-center"><History className="mr-2"/> Translation History</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-2">
                    {isPending && history.length === 0 && <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-secondary"/></div>}
                    {!isPending && history.length === 0 && <p className="text-sm text-muted-foreground p-4 text-center">No translation history yet.</p>}
                    {history.map(item => (
                        <div key={item.id} className="group relative p-2 mb-1 rounded hover:bg-muted/50 transition-colors">
                            <p className="font-medium text-foreground text-sm truncate cursor-pointer" onClick={() => {form.setValue('textToTranslate', item.original_text); form.setValue('targetLanguage',item.target_language); setAiResponse({translated_text: item.translated_text, detected_source_language: item.source_language})}}>
                                {item.original_text.substring(0,30)}... &rarr; {item.translated_text.substring(0,30)}...
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {languageOptions.find(l=>l.value === item.source_language)?.label || item.source_language} &rarr; {languageOptions.find(l=>l.value === item.target_language)?.label || item.target_language}
                            </p>
                            <p className="text-xs text-muted-foreground/70">{format(parseISO(item.translated_at), "PPp")}</p>
                             <Button variant="ghost" size="icon" onClick={() => handleDeleteHistoryItem(item.id)} disabled={isPending} className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive/70 hover:text-destructive">
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                    ))}
                </ScrollArea>
            </CardContent>
             <CardFooter className="border-t p-2">
                <p className="text-xs text-muted-foreground text-center w-full">Last 15 translations shown.</p>
            </CardFooter>
        </Card>
    </div>
  );
}
