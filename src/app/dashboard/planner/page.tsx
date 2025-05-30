// src/app/dashboard/planner/page.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { CalendarIcon, CheckCircle, Edit3, Loader2, PlusCircle, Trash2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const planFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().optional(),
  due_date: z.date({ required_error: 'Due date is required.' }),
  subject: z.string().optional(),
  plan_type: z.enum(['task', 'exam', 'revision']).default('task'),
  completed: z.boolean().default(false),
});

type PlanFormData = z.infer<typeof planFormSchema>;
type StudyPlan = Tables<'study_plans'>;

export default function PlannerPage() {
  const [isPending, startTransition] = useTransition();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      title: '',
      description: '',
      subject: '',
      plan_type: 'task',
      completed: false,
    },
  });

  const fetchPlans = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    startTransition(async () => {
      const { data, error } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (error) {
        toast({ variant: 'destructive', title: 'Error fetching plans', description: error.message });
      } else {
        setPlans(data || []);
      }
    });
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const onSubmit = async (values: PlanFormData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }

    startTransition(async () => {
      const planData: TablesInsert<'study_plans'> = {
        ...values,
        user_id: user.id,
        due_date: format(values.due_date, 'yyyy-MM-dd HH:mm:ssXX'), // Ensure correct format for Supabase
      };

      let error;
      if (selectedPlan) { // Update
        const { error: updateError } = await supabase
          .from('study_plans')
          .update(planData as TablesUpdate<'study_plans'>)
          .eq('id', selectedPlan.id);
        error = updateError;
      } else { // Insert
        const { error: insertError } = await supabase.from('study_plans').insert(planData);
        error = insertError;
      }

      if (error) {
        toast({ variant: 'destructive', title: `Error ${selectedPlan ? 'updating' : 'adding'} plan`, description: error.message });
      } else {
        toast({ title: `Plan ${selectedPlan ? 'updated' : 'added'} successfully`, className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary' });
        fetchPlans();
        handleCloseDialog();
      }
    });
  };

  const handleDeletePlan = async (planId: string) => {
    startTransition(async () => {
      const { error } = await supabase.from('study_plans').delete().eq('id', planId);
      if (error) {
        toast({ variant: 'destructive', title: 'Error deleting plan', description: error.message });
      } else {
        toast({ title: 'Plan deleted successfully' });
        fetchPlans();
      }
    });
  };
  
  const handleToggleComplete = async (plan: StudyPlan) => {
    startTransition(async () => {
      const { error } = await supabase
        .from('study_plans')
        .update({ completed: !plan.completed })
        .eq('id', plan.id);
      if (error) {
        toast({ variant: 'destructive', title: 'Error updating plan status', description: error.message });
      } else {
        toast({ title: `Plan marked as ${!plan.completed ? 'complete' : 'incomplete'}` });
        fetchPlans();
      }
    });
  };


  const handleOpenDialog = (plan?: StudyPlan) => {
    setSelectedPlan(plan || null);
    if (plan) {
      form.reset({
        ...plan,
        due_date: new Date(plan.due_date),
      });
    } else {
      form.reset({
        title: '',
        description: '',
        due_date: new Date(),
        subject: '',
        plan_type: 'task',
        completed: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedPlan(null);
    form.reset();
  };

  return (
    <div className="space-y-10">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Edit3 className="mr-4 h-10 w-10" /> Study Planner & Task Arena
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Organize your conquest! Add tasks, schedule exams, and track your study milestones.
        </p>
      </header>

      <div className="text-center mb-8">
        <Button onClick={() => handleOpenDialog()} className="glow-button text-lg py-6">
          <PlusCircle className="mr-2 h-6 w-6" /> Add New Plan / Task
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border shadow-xl shadow-primary/20">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl glow-text-primary">{selectedPlan ? 'Edit Plan' : 'Add New Plan'}</DialogTitle>
            <DialogDescription>
              {selectedPlan ? 'Update the details of your study plan.' : 'Fill in the details for your new study plan or task.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-2 max-h-[70vh] overflow-y-auto">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Solve Physics Chapter 5 MCQs" {...field} className="border-2 border-input focus:border-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any specific notes or details..." {...field} className="border-2 border-input focus:border-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal border-2 border-input focus:border-primary h-11",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Physics, Biology" {...field} className="border-2 border-input focus:border-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plan_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-2 border-input focus:border-primary h-11">
                          <SelectValue placeholder="Select plan type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                        <SelectItem value="revision">Revision Session</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="completed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background/50">
                    <div className="space-y-0.5">
                      <FormLabel>Mark as Completed</FormLabel>
                    </div>
                    <FormControl>
                       <Button 
                        type="button"
                        variant={field.value ? "default" : "outline"}
                        size="icon"
                        onClick={() => field.onChange(!field.value)}
                        className={cn("w-auto px-3", field.value ? "bg-green-500 hover:bg-green-600" : "border-primary text-primary hover:bg-primary/10")}
                       >
                        {field.value ? <CheckCircle className="mr-2"/> : <XCircle className="mr-2"/>}
                        {field.value ? "Completed" : "Pending"}
                       </Button>
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={handleCloseDialog} className="glow-button">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isPending} className="glow-button">
                  {isPending ? <Loader2 className="animate-spin mr-2" /> : (selectedPlan ? <Edit3 className="mr-2" /> : <PlusCircle className="mr-2" />)}
                  {selectedPlan ? 'Save Changes' : 'Add Plan'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {isPending && plans.length === 0 && <div className="text-center py-10"><Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" /><p className="text-muted-foreground">Loading plans...</p></div>}
      {!isPending && plans.length === 0 && <p className="text-center text-muted-foreground py-10 text-lg">No plans yet. Add your first task or schedule!</p>}

      {plans.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map(plan => (
            <Card key={plan.id} className={cn("interactive-card shadow-lg", plan.completed ? "shadow-green-500/20 border-green-500/30 opacity-70" : "shadow-primary/10")}>
              <CardHeader>
                <CardTitle className={cn("font-headline text-xl flex justify-between items-center", plan.completed ? "text-green-400" : "glow-text-primary")}>
                  {plan.title}
                  <span className={cn("text-xs px-2 py-1 rounded-full", 
                    plan.plan_type === 'exam' ? 'bg-red-500/20 text-red-300' : 
                    plan.plan_type === 'revision' ? 'bg-yellow-500/20 text-yellow-300' : 
                    'bg-blue-500/20 text-blue-300'
                  )}>
                    {plan.plan_type}
                  </span>
                </CardTitle>
                <CardDescription className={cn(plan.completed ? "text-green-500/80" : "text-muted-foreground")}>
                  Due: {format(new Date(plan.due_date), "PPP")} {plan.subject && `| Subject: ${plan.subject}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {plan.description && <p className="text-sm mb-4">{plan.description}</p>}
                 <Button 
                    variant={plan.completed ? "outline" : "default"} 
                    size="sm" 
                    onClick={() => handleToggleComplete(plan)}
                    className={cn("w-full mb-2", plan.completed ? "border-green-500 text-green-500 hover:bg-green-500/10" : "glow-button")}
                    disabled={isPending}
                  >
                    {plan.completed ? <XCircle className="mr-2" /> : <CheckCircle className="mr-2" />}
                    {plan.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                  </Button>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(plan)} disabled={isPending} className="glow-button border-accent text-accent hover:bg-accent/10 hover:text-accent">
                  <Edit3 className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeletePlan(plan.id)} disabled={isPending} className="glow-button">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

    