// src/app/dashboard/calculator/page.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
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
import { calculateExpression, type CalculatorInput, type CalculatorOutput } from '@/ai/flows/calculator-flow';
import { Calculator, Loader2, History, Trash2, Equal } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO } from 'date-fns';

const calculatorSchema = z.object({
  expression: z.string().min(1, { message: 'Please enter an expression.' }),
});
type CalculatorFormData = z.infer<typeof calculatorSchema>;
type CalculatorHistoryEntry = Tables<'calculator_history'>;

export default function CalculatorPage() {
  const [isPending, startTransition] = useTransition();
  const [aiResponse, setAiResponse] = useState<CalculatorOutput | null>(null);
  const [history, setHistory] = useState<CalculatorHistoryEntry[]>([]);
  const { toast } = useToast();
  const supabase = createClient();
  const [userId, setUserId] = useState<string|null>(null);

  const form = useForm<CalculatorFormData>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: { expression: '' },
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
            .from('calculator_history')
            .select('*')
            .eq('user_id', userId)
            .order('calculated_at', { ascending: false })
            .limit(20);
        if (error) toast({ variant: 'destructive', title: 'Error fetching history', description: error.message });
        else setHistory(data || []);
    });
  };
  
  useEffect(() => {
    if(userId) fetchHistory();
  }, [userId]); // Basic fetch

  async function onSubmit(values: CalculatorFormData) {
    if(!userId) return;
    setAiResponse(null);
    startTransition(async () => {
      try {
        const input: CalculatorInput = { expression: values.expression };
        const result = await calculateExpression(input);
        setAiResponse(result);
        
        const logEntry: TablesInsert<'calculator_history'> = {
            user_id: userId,
            expression: values.expression,
            result: result.result,
        };
        await supabase.from('calculator_history').insert(logEntry);
        fetchHistory();

      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error calculating expression', description: error.message });
      }
    });
  }

  const handleDeleteHistoryItem = async (id: string) => {
    if(!userId) return;
    startTransition(async () => {
        const {error} = await supabase.from('calculator_history').delete().eq('id', id).eq('user_id', userId);
        if (error) toast({ variant: 'destructive', title: 'Error deleting history item', description: error.message });
        else {
            toast({title: "History item deleted."});
            fetchHistory();
        }
    });
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] pb-16 md:pb-0">
        {/* Main Calculator Area */}
        <div className="md:col-span-2 space-y-6 flex flex-col">
            <header className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-headline font-bold glow-text-primary mb-2 flex items-center">
                <Calculator className="mr-3 h-8 w-8" /> AI Powered Calculator
                </h1>
                <p className="text-md text-muted-foreground">
                Perform calculations, solve equations, or ask for math help.
                </p>
            </header>

            <Card className="interactive-card shadow-xl shadow-primary/10 flex-1 flex flex-col min-h-0">
                <CardHeader>
                <CardTitle className="flex items-center text-2xl font-headline glow-text-primary">
                    <Equal className="mr-2" /> Enter Expression
                </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="expression" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Expression or Math Query</FormLabel>
                            <FormControl><Input placeholder="E.g., '2 * (10 + 5)', 'solve x^2 - 4 = 0', 'what is pi?'" {...field} className="h-12 text-lg input-glow" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <Button type="submit" className="w-full text-lg py-3 glow-button" disabled={isPending}>
                        {isPending ? <Loader2 className="animate-spin mr-2" /> : <Calculator className="mr-2" />} Calculate
                    </Button>
                    </form>
                </Form>
                </CardContent>
                {aiResponse && (
                    <CardFooter className="border-t pt-4 flex-col items-start space-y-2">
                        <h3 className="text-xl font-semibold glow-text-accent">Result:</h3>
                        <div className="w-full p-3 bg-muted/50 rounded-md min-h-[60px] whitespace-pre-wrap text-2xl font-mono text-foreground input-glow">
                           {aiResponse.result}
                        </div>
                        {aiResponse.explanation && (
                             <div>
                                <h4 className="font-semibold text-primary">Explanation:</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiResponse.explanation}</p>
                             </div>
                        )}
                    </CardFooter>
                )}
            </Card>
        </div>
        
        {/* History Sidebar */}
        <Card className="interactive-card shadow-md shadow-secondary/10 flex flex-col min-h-0">
            <CardHeader className="border-b">
                <CardTitle className="font-headline text-xl glow-text-secondary flex items-center"><History className="mr-2"/> Calculation History</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-2">
                    {isPending && history.length === 0 && <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-secondary"/></div>}
                    {!isPending && history.length === 0 && <p className="text-sm text-muted-foreground p-4 text-center">No calculation history yet.</p>}
                    {history.map(item => (
                        <div key={item.id} className="group relative p-2 mb-1 rounded hover:bg-muted/50 transition-colors">
                            <p className="font-medium text-foreground text-sm truncate cursor-pointer" onClick={() => {form.setValue('expression', item.expression); setAiResponse({result: item.result, explanation: null}); }}>
                                {item.expression} = {item.result}
                            </p>
                            <p className="text-xs text-muted-foreground/70">{format(parseISO(item.calculated_at), "PPp")}</p>
                             <Button variant="ghost" size="icon" onClick={() => handleDeleteHistoryItem(item.id)} disabled={isPending} className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive/70 hover:text-destructive">
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                    ))}
                </ScrollArea>
            </CardContent>
             <CardFooter className="border-t p-2">
                <p className="text-xs text-muted-foreground text-center w-full">Last 20 calculations shown.</p>
            </CardFooter>
        </Card>
    </div>
  );
}
