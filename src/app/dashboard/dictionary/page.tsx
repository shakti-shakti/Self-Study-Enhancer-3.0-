// src/app/dashboard/dictionary/page.tsx
'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Tables, TablesInsert } from '@/lib/database.types';
import { getDictionaryEntry, type DictionaryInput, type DictionaryOutput } from '@/ai/flows/dictionary-flow';
import { SpellCheck, Loader2, Search, History, Trash2, ClipboardCopy } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO } from 'date-fns';


const dictionarySchema = z.object({
  word: z.string().min(1, { message: 'Please enter a word.' }),
});
type DictionaryFormData = z.infer<typeof dictionarySchema>;
type DictionaryHistoryEntry = Tables<'dictionary_history'>;

export default function DictionaryPage() {
  const [isPending, startTransition] = useTransition();
  const [aiResponse, setAiResponse] = useState<DictionaryOutput | null>(null);
  const [history, setHistory] = useState<DictionaryHistoryEntry[]>([]);
  const { toast } = useToast();
  const supabase = createClient();
  const [userId, setUserId] = useState<string|null>(null);

  const form = useForm<DictionaryFormData>({
    resolver: zodResolver(dictionarySchema),
    defaultValues: { word: '' },
  });
  
  useEffect(() => {
    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
    };
    getCurrentUser();
  }, [supabase]);

  const fetchHistory = useCallback(async () => {
    if (!userId) return;
    startTransition(async () => {
        const { data, error } = await supabase
            .from('dictionary_history')
            .select('*')
            .eq('user_id', userId)
            .order('searched_at', { ascending: false })
            .limit(20);
        if (error) toast({ variant: 'destructive', title: 'Error fetching history', description: error.message });
        else setHistory(data || []);
    });
  }, [userId, supabase, toast]);
  
  useEffect(() => {
    if(userId) fetchHistory();
  }, [userId, fetchHistory]);

  async function onSubmit(values: DictionaryFormData) {
    if(!userId) {
        toast({variant: "destructive", title: "Error", description: "User not authenticated."})
        return;
    }
    setAiResponse(null);
    startTransition(async () => {
      try {
        const input: DictionaryInput = { word: values.word };
        const result = await getDictionaryEntry(input);
        setAiResponse(result);
        
        const logEntry: TablesInsert<'dictionary_history'> = {
            user_id: userId,
            word: values.word,
            definition: result.definition,
        };
        await supabase.from('dictionary_history').insert(logEntry);
        fetchHistory(); 
         const activityLog: TablesInsert<'activity_logs'> = {
          user_id: userId,
          activity_type: 'dictionary_lookup',
          description: `Looked up word: "${values.word}"`,
          details: { word: values.word, definition_preview: result.definition.substring(0, 100) }
        };
        await supabase.from('activity_logs').insert(activityLog);


      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error fetching definition', description: error.message });
      }
    });
  }
  
  const handleDeleteHistoryItem = async (id: string) => {
    if(!userId) return;
    startTransition(async () => {
        const {error} = await supabase.from('dictionary_history').delete().eq('id', id).eq('user_id', userId);
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
        {/* Main Dictionary Area */}
        <div className="md:col-span-2 space-y-6 flex flex-col">
            <header className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-headline font-bold glow-text-primary mb-2 flex items-center">
                <SpellCheck className="mr-3 h-8 w-8" /> AI Powered Dictionary
                </h1>
                <p className="text-md text-muted-foreground">
                Get definitions, examples, and more for any word.
                </p>
            </header>

            <Card className="interactive-card shadow-xl shadow-primary/10">
                <CardHeader>
                <CardTitle className="flex items-center text-2xl font-headline glow-text-primary">
                    <Search className="mr-2" /> Look Up a Word
                </CardTitle>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
                    <FormField control={form.control} name="word" render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormControl><Input placeholder="Enter a word..." {...field} className="h-12 text-lg input-glow" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <Button type="submit" className="h-12 text-lg px-6 glow-button" disabled={isPending || !form.formState.isValid}>
                        {isPending ? <Loader2 className="animate-spin" /> : <Search />} Search
                    </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>

            {isPending && !aiResponse && (
                <div className="flex-1 flex justify-center items-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
            )}

            {aiResponse && (
                <Card className="interactive-card shadow-lg shadow-accent/10 flex-1 overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline glow-text-accent">{aiResponse.word}</CardTitle>
                    {aiResponse.phonetic && <CardDescription className="text-base">[{aiResponse.phonetic}]</CardDescription>}
                </CardHeader>
                <ScrollArea className="h-[calc(100%-100px)]"> 
                    <CardContent className="space-y-4 p-4">
                        <div>
                            <h3 className="font-semibold text-lg text-primary">Definition:</h3>
                            <p className="whitespace-pre-wrap">{aiResponse.definition}</p>
                        </div>
                        {aiResponse.example_sentence && (
                            <div>
                            <h3 className="font-semibold text-lg text-primary">Example:</h3>
                            <p className="italic">"{aiResponse.example_sentence}"</p>
                            </div>
                        )}
                        {aiResponse.synonyms && aiResponse.synonyms.length > 0 && (
                            <div>
                            <h3 className="font-semibold text-lg text-primary">Synonyms:</h3>
                            <p>{aiResponse.synonyms.join(', ')}</p>
                            </div>
                        )}
                    </CardContent>
                </ScrollArea>
                <CardFooter className="border-t p-2">
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(aiResponse.definition)} className="ml-auto text-muted-foreground hover:text-primary">
                        <ClipboardCopy className="h-4 w-4 mr-1"/> Copy Definition
                    </Button>
                </CardFooter>
                </Card>
            )}
        </div>

        {/* History Sidebar */}
        <Card className="interactive-card shadow-md shadow-secondary/10 flex flex-col min-h-0">
            <CardHeader className="border-b">
                <CardTitle className="font-headline text-xl glow-text-secondary flex items-center"><History className="mr-2"/> Search History</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-2">
                    {isPending && history.length === 0 && <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-secondary"/></div>}
                    {!isPending && history.length === 0 && <p className="text-sm text-muted-foreground p-4 text-center">No search history yet.</p>}
                    {history.map(item => (
                        <div key={item.id} className="group relative p-2 mb-1 rounded hover:bg-muted/50 transition-colors">
                            <p className="font-medium text-foreground cursor-pointer" onClick={() => {form.setValue('word', item.word); onSubmit({word: item.word}); }}>{item.word}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.definition.substring(0,40)}...</p>
                            <p className="text-xs text-muted-foreground/70">{format(parseISO(item.searched_at), "PPp")}</p>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteHistoryItem(item.id)} disabled={isPending} className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive/70 hover:text-destructive">
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                    ))}
                </ScrollArea>
            </CardContent>
             <CardFooter className="border-t p-2">
                <p className="text-xs text-muted-foreground text-center w-full">Last 20 searches shown.</p>
            </CardFooter>
        </Card>
    </div>
  );
}
