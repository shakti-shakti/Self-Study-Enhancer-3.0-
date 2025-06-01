
// src/app/dashboard/calculator/page.tsx
'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form'; // Added Controller
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Tables, TablesInsert } from '@/lib/database.types';
import { calculateExpression, type CalculatorInput, type CalculatorOutput } from '@/ai/flows/calculator-flow';
import { Calculator, Loader2, History, Trash2, Equal, ClipboardCopy, Delete } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

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

  const fetchHistory = useCallback(async () => {
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
  }, [userId, supabase, toast]);
  
  useEffect(() => {
    if(userId) fetchHistory();
  }, [userId, fetchHistory]);

  async function onSubmit(values: CalculatorFormData) {
    if(!userId) {
        toast({variant: 'destructive', title: 'Error', description: 'User not authenticated.'});
        return;
    }
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
         const activityLog: TablesInsert<'activity_logs'> = {
          user_id: userId,
          activity_type: 'calculator_used',
          description: `Calculated: ${values.expression.substring(0,50)}...`,
          details: { expression: values.expression, result: result.result }
        };
        await supabase.from('activity_logs').insert(activityLog);


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
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({title: "Copied to clipboard!"});
  };

  const handleButtonClick = (value: string) => {
    const currentExpression = form.getValues('expression');
    if (value === 'C') {
        form.setValue('expression', '');
        setAiResponse(null);
    } else if (value === '=') {
        form.handleSubmit(onSubmit)();
    } else if (value === 'DEL') {
        form.setValue('expression', currentExpression.slice(0, -1));
    }
    else {
        form.setValue('expression', currentExpression + value);
    }
  };

  const calculatorButtons = [
    ['C', '(', ')', '/'],
    ['7', '8', '9', '*'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['DEL', '0', '.', '='],
  ];


  return (
    <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] pb-16 md:pb-0">
        <div className="md:col-span-2 space-y-6 flex flex-col">
            <header className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-headline font-bold glow-text-primary mb-2 flex items-center">
                <Calculator className="mr-3 h-8 w-8" /> AI Powered Calculator
                </h1>
                <p className="text-md text-muted-foreground">
                Perform calculations, solve equations, or ask for math help. Use buttons or type directly.
                </p>
            </header>

            <Card className="interactive-card shadow-xl shadow-primary/10 flex-1 flex flex-col min-h-0">
                <CardHeader>
                  <Controller
                      name="expression"
                      control={form.control}
                      render={({ field }) => (
                          <Input 
                              {...field} 
                              placeholder="0" 
                              className="h-16 text-3xl text-right input-glow font-mono" 
                              readOnly // Make it readOnly if primarily using buttons, or remove for direct typing
                          />
                      )}
                  />
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end space-y-2 p-3 md:p-4">
                  {calculatorButtons.map((row, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-4 gap-2">
                        {row.map((btnVal) => {
                            const isOperator = ['/', '*', '-', '+'].includes(btnVal);
                            const isEqual = btnVal === '=';
                            const isClear = btnVal === 'C';
                            const isDelete = btnVal === 'DEL';
                            
                            return (
                                <Button
                                    key={btnVal}
                                    variant={isOperator || isEqual ? "secondary" : (isClear || isDelete ? "destructive" : "outline")}
                                    className={cn(
                                        "text-xl md:text-2xl h-14 md:h-16 font-mono glow-button",
                                        isEqual && "col-span-1 bg-primary hover:bg-primary/90 text-primary-foreground",
                                        isClear && "bg-destructive/80 hover:bg-destructive text-destructive-foreground",
                                        isDelete && "bg-destructive/60 hover:bg-destructive/90 text-destructive-foreground",
                                        (isOperator || isEqual) && "text-lg md:text-xl",
                                        !isOperator && !isEqual && !isClear && !isDelete && "bg-muted/30 hover:bg-muted/60"
                                    )}
                                    onClick={() => handleButtonClick(btnVal)}
                                >
                                    {btnVal === 'DEL' ? <Delete className="h-5 w-5"/> : btnVal}
                                </Button>
                            );
                        })}
                    </div>
                  ))}
                </CardContent>
                {aiResponse && (
                    <CardFooter className="border-t pt-4 flex-col items-start space-y-2 p-3 md:p-4">
                        <div className="w-full flex justify-between items-center">
                            <h3 className="text-xl font-semibold glow-text-accent">Result:</h3>
                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(aiResponse.result)} className="text-muted-foreground hover:text-primary">
                                <ClipboardCopy className="h-5 w-5"/>
                            </Button>
                        </div>
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
                            <p className="font-medium text-foreground text-sm truncate cursor-pointer" onClick={() => {form.setValue('expression', item.expression); setAiResponse({result: item.result }); }}>
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
