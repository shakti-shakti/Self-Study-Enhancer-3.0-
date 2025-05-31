// src/app/dashboard/app-customization/page.tsx
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
import { customizeApp, type CustomizeAppInput, type CustomizeAppOutput } from '@/ai/flows/customization-tool';
import { SlidersHorizontal, Loader2, Wand2, Info, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { TablesInsert } from '@/lib/database.types';


const customizationSchema = z.object({
  command: z.string().min(10, { message: 'Command must be at least 10 characters.' }).max(500, {message: 'Command too long.'}),
  currentDashboard: z.string().optional(), 
  availableDashboards: z.array(z.string()).optional(),
});

type CustomizationFormData = z.infer<typeof customizationSchema>;

export default function AppCustomizationPage() {
  const [isPending, startTransition] = useTransition();
  const [aiResponse, setAiResponse] = useState<CustomizeAppOutput | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  const form = useForm<CustomizationFormData>({
    resolver: zodResolver(customizationSchema),
    defaultValues: {
      command: '',
      currentDashboard: 'Main Dashboard', // Example default
      availableDashboards: ['Main Dashboard', 'Planner', 'Quizzes', 'AI Study Assistant', 'Progress Overview', 'Study Rooms', 'NCERT Explorer', 'Guidelines', 'Profile Settings'], // Keep this updated
    },
  });

  async function onSubmit(values: CustomizationFormData) {
    setAiResponse(null);
    startTransition(async () => {
      try {
        const input: CustomizeAppInput = {
            command: values.command,
            currentDashboard: values.currentDashboard,
            availableDashboards: values.availableDashboards
        };
        const result = await customizeApp(input);
        setAiResponse(result);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const logEntry: TablesInsert<'customization_requests_logs'> = {
                user_id: user.id,
                command: values.command,
                ai_instruction: result.instruction,
                ai_explanation: result.explanation,
                // Note: 'feasibility' and 'clarifying_question' are not in the DB table schema currently.
                // If you want to log them, you'd need to add columns to `customization_requests_logs`.
            };
            await supabase.from('customization_requests_logs').insert(logEntry);
             const activityLog: TablesInsert<'activity_logs'> = {
              user_id: user.id,
              activity_type: 'app_customized',
              description: `Used AI app customization tool with command: "${values.command.substring(0,50)}..."`,
              details: { command: values.command, ai_explanation: result.explanation }
            };
            await supabase.from('activity_logs').insert(activityLog);
        }

        toast({
          title: 'Customization Processed!',
          description: 'AI has provided conceptual instructions for your command.',
          className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary',
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error processing command',
          description: error.message || 'An unexpected error occurred.',
        });
      }
    });
  }
  
  const FeasibilityIcon = ({ feasibility }: { feasibility: CustomizeAppOutput['feasibility'] | undefined }) => {
    if (!feasibility) return null;
    switch (feasibility) {
      case 'High': return <CheckCircle className="mr-2 h-5 w-5 text-green-400" />;
      case 'Medium': return <HelpCircle className="mr-2 h-5 w-5 text-yellow-400" />;
      case 'Low': return <AlertTriangle className="mr-2 h-5 w-5 text-orange-400" />;
      case 'Not Possible': return <AlertTriangle className="mr-2 h-5 w-5 text-red-400" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-10">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <SlidersHorizontal className="mr-4 h-10 w-10" /> AI App Customization Tool
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Tell the AI how you want to change the app! (e.g., "Change theme to dark blue", "Add a Pomodoro timer widget"). This is a conceptual tool; changes are not applied live.
        </p>
      </header>

      <Card className="max-w-2xl mx-auto interactive-card p-2 md:p-4 shadow-xl shadow-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline">
            <Wand2 className="mr-3 h-8 w-8 text-primary" /> Describe Your Desired Change
          </CardTitle>
          <CardDescription>
            Use natural language to tell the AI what customization you'd like.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="command"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Your Command</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="E.g., 'Change the dashboard primary color to green', 'Add a button to the quiz page that shows hints', 'Make the font size larger in the study notes section.'"
                        {...field}
                        className="min-h-[100px] input-glow"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="currentDashboard"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Current Context (Optional)</FormLabel>
                    <FormControl>
                     <Input placeholder="E.g., On Quiz Page" {...field} className="h-11 input-glow" />
                    </FormControl>
                    <FormDescription>Tell the AI where you are in the app if relevant.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full font-semibold text-lg py-6 glow-button" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-6 w-6" />
                )}
                Process Command with AI
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isPending && !aiResponse && (
        <div className="text-center py-10">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">AI is thinking about your customization... this might take a moment.</p>
        </div>
      )}

      {aiResponse && (
        <Card className="max-w-2xl mx-auto mt-12 interactive-card shadow-xl shadow-accent/10">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl font-headline glow-text-accent">
              <SlidersHorizontal className="mr-3 h-8 w-8" /> AI Customization Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-accent mb-1">AI's Understanding:</h3>
              <p className="text-base whitespace-pre-wrap italic bg-muted/30 p-3 rounded-md">{aiResponse.explanation}</p>
            </div>
             <div>
              <h3 className="text-lg font-semibold text-accent mb-1 flex items-center">
                <FeasibilityIcon feasibility={aiResponse.feasibility} />
                Feasibility: <span className="ml-2 font-bold">{aiResponse.feasibility}</span>
              </h3>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-accent mb-1">Conceptual Instruction:</h3>
              <pre className="bg-muted/50 p-3 rounded-md text-sm overflow-x-auto font-code">
                <code>{aiResponse.instruction}</code>
              </pre>
            </div>
            {aiResponse.clarifyingQuestion && (
                 <div>
                    <h3 className="text-lg font-semibold text-accent mb-1">AI Needs More Info:</h3>
                    <p className="text-base whitespace-pre-wrap bg-muted/30 p-3 rounded-md">{aiResponse.clarifyingQuestion}</p>
                </div>
            )}
            <div className="pt-4 border-t border-border/30">
                <p className="text-xs text-muted-foreground flex items-center"><Info className="w-3 h-3 mr-1.5"/>Note: This tool is conceptual. The AI provides guidance on how changes might be implemented, but does not apply them directly to the app.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
    
