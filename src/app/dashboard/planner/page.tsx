// src/app/dashboard/planner/page.tsx
'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { CalendarIcon, CheckCircle, Edit3, Loader2, PlusCircle, Trash2, XCircle, AlarmClockPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Tables, TablesInsert, TablesUpdate, StudyPlanWithAlarm } from '@/lib/database.types';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

const planFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.').max(100),
  description: z.string().optional(),
  due_date: z.date({ required_error: 'Due date is required.' }),
  start_time: z.string().optional().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"), // HH:MM format for time input
  duration_minutes: z.coerce.number().int().min(0).optional(),
  subject: z.string().optional(),
  class_level: z.enum(['11', '12']).optional(),
  plan_type: z.enum(['day_task', 'month_subject_task', 'year_goal', 'revision', 'exam']).default('day_task'),
  completed: z.boolean().default(false),
  alarm_set_at: z.date().optional(), // For setting alarm
});

type PlanFormData = z.infer<typeof planFormSchema>;
type StudyPlan = StudyPlanWithAlarm;

export default function PlannerPage() {
  const [isPending, startTransition] = useTransition();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();
  const [userId, setUserId] = useState<string|null>(null);

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      title: '',
      description: '',
      start_time: '',
      duration_minutes: 0,
      subject: '',
      plan_type: 'day_task',
      completed: false,
    },
  });

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


  const fetchPlans = useCallback(async () => {
    if (!userId) return;

    startTransition(async () => {
      const { data, error } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true });

      if (error) {
        toast({ variant: 'destructive', title: 'Error fetching plans', description: error.message });
      } else {
        setPlans(data || []);
      }
    });
  }, [userId, supabase, toast]);

  useEffect(() => {
    if(userId) fetchPlans();
  }, [userId, fetchPlans]);

  // Combine date and time into a full ISO string for due_date or alarm_set_at
  const combineDateAndTime = (date: Date, timeString?: string): string => {
    const datePart = format(date, 'yyyy-MM-dd');
    if (timeString) {
      return `${datePart}T${timeString}:00`; // Assumes timeString is HH:MM
    }
    return format(date, "yyyy-MM-dd'T'HH:mm:ssXXX"); // Default to current time if not specified
  };


  const onSubmit = async (values: PlanFormData) => {
    if (!userId) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }

    startTransition(async () => {
      const planData: Omit<TablesInsert<'study_plans'>, 'id' | 'created_at' | 'user_id'> & { user_id: string } = {
        user_id: userId,
        title: values.title,
        description: values.description || null,
        due_date: combineDateAndTime(values.due_date, values.start_time), // Full datetime
        start_time: values.start_time ? combineDateAndTime(values.due_date, values.start_time) : null, // Store as full datetime if time is provided
        duration_minutes: values.duration_minutes || null,
        subject: values.subject || null,
        class_level: values.class_level || null,
        plan_type: values.plan_type,
        completed: values.completed,
        alarm_set_at: values.alarm_set_at ? combineDateAndTime(values.alarm_set_at, format(values.alarm_set_at, 'HH:mm')) : null,
      };
      
      let error;
      if (selectedPlan) { // Update
        const { error: updateError } = await supabase
          .from('study_plans')
          .update(planData as TablesUpdate<'study_plans'>)
          .eq('id', selectedPlan.id)
          .eq('user_id', userId);
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
     if (!userId) return;
    startTransition(async () => {
      const { error } = await supabase.from('study_plans').delete().eq('id', planId).eq('user_id', userId);
      if (error) {
        toast({ variant: 'destructive', title: 'Error deleting plan', description: error.message });
      } else {
        toast({ title: 'Plan deleted successfully' });
        fetchPlans();
      }
    });
  };
  
  const handleToggleComplete = async (plan: StudyPlan) => {
    if (!userId) return;
    startTransition(async () => {
      const { error } = await supabase
        .from('study_plans')
        .update({ completed: !plan.completed })
        .eq('id', plan.id)
        .eq('user_id', userId);
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
      const dueDate = parseISO(plan.due_date);
      form.reset({
        ...plan,
        due_date: dueDate,
        start_time: plan.start_time ? format(parseISO(plan.start_time), 'HH:mm') : '',
        duration_minutes: plan.duration_minutes || 0,
        alarm_set_at: plan.alarm_set_at ? parseISO(plan.alarm_set_at) : undefined,
        class_level: plan.class_level as '11' | '12' || undefined,
      });
    } else {
      form.reset({
        title: '',
        description: '',
        due_date: new Date(),
        start_time: '',
        duration_minutes: 0,
        subject: '',
        plan_type: 'day_task',
        completed: false,
        alarm_set_at: undefined,
        class_level: undefined,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedPlan(null);
    form.reset();
  };
  
  const getPlanTypeDisplay = (type: string) => {
    switch(type) {
        case 'day_task': return 'Daily Task';
        case 'month_subject_task': return 'Monthly Task';
        case 'year_goal': return 'Yearly Goal';
        case 'revision': return 'Revision';
        case 'exam': return 'Exam';
        default: return type;
    }
  };


  return (
    <div className="space-y-10 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Edit3 className="mr-4 h-10 w-10" /> Study Planner & Task Arena
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Organize your conquest! Add tasks, schedule exams, set alarms, and track your study milestones.
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
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1 max-h-[70vh] overflow-y-auto">
              <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input placeholder="E.g., Solve Physics Chapter 5 MCQs" {...field} className="input-glow" /></FormControl>
                    <FormMessage />
                  </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="Any specific notes or details..." {...field} className="input-glow" /></FormControl>
                    <FormMessage />
                  </FormItem>
              )} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="due_date" render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover><PopoverTrigger asChild>
                            <FormControl>
                            <Button variant={"outline"} className={cn("justify-start text-left font-normal input-glow h-11",!field.value && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                        </PopoverContent></Popover>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="start_time" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Start Time (Optional)</FormLabel>
                        <FormControl><Input type="time" {...field} className="input-glow h-11" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="duration_minutes" render={({ field }) => (
                <FormItem>
                    <FormLabel>Duration (Minutes, Optional)</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g., 60" {...field} className="input-glow h-11" /></FormControl>
                    <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject (Optional)</FormLabel>
                    <FormControl><Input placeholder="E.g., Physics, Biology" {...field} className="input-glow" /></FormControl>
                    <FormMessage />
                  </FormItem>
              )} />
               <FormField control={form.control} name="class_level" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Class (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="input-glow h-11"><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="11">Class 11</SelectItem><SelectItem value="12">Class 12</SelectItem></SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
              <FormField control={form.control} name="plan_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="input-glow h-11"><SelectValue placeholder="Select plan type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="day_task">Daily Task</SelectItem>
                        <SelectItem value="month_subject_task">Monthly Task</SelectItem>
                        <SelectItem value="year_goal">Yearly Goal</SelectItem>
                        <SelectItem value="revision">Revision Session</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
              )} />
               <FormField control={form.control} name="alarm_set_at" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center"><AlarmClockPlus className="mr-2 h-5 w-5 text-accent"/>Set Alarm Time (Optional)</FormLabel>
                    <Popover><PopoverTrigger asChild>
                        <FormControl>
                        <Button variant={"outline"} className={cn("justify-start text-left font-normal input-glow h-11",!field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP HH:mm") : <span>Pick date & time for alarm</span>}
                        </Button>
                        </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={(date) => {
                            // Combine with current time input or default to a time
                            const currentTime = field.value ? format(field.value, 'HH:mm') : '09:00';
                            const newDateTime = date ? parseISO(combineDateAndTime(date, currentTime)) : undefined;
                            field.onChange(newDateTime);
                        }} initialFocus/>
                        {/* Consider adding a time picker here as well */}
                         <Input type="time" className="input-glow mt-2" 
                            defaultValue={field.value ? format(field.value, 'HH:mm') : '09:00'}
                            onChange={(e) => {
                                const datePart = field.value || new Date();
                                const newDateTime = parseISO(combineDateAndTime(datePart, e.target.value));
                                field.onChange(newDateTime);
                            }}
                         />
                    </PopoverContent></Popover>
                    <FormMessage />
                  </FormItem>
              )} />
               <FormField control={form.control} name="completed" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background/50 input-glow">
                    <div className="space-y-0.5"><FormLabel>Mark as Completed</FormLabel></div>
                    <FormControl>
                       <Button type="button" variant={field.value ? "default" : "outline"} size="icon"
                        onClick={() => field.onChange(!field.value)}
                        className={cn("w-auto px-3", field.value ? "bg-green-500 hover:bg-green-600" : "border-primary text-primary hover:bg-primary/10")}>
                        {field.value ? <CheckCircle className="mr-2"/> : <XCircle className="mr-2"/>}
                        {field.value ? "Completed" : "Pending"}
                       </Button>
                    </FormControl>
                  </FormItem>
                )} />
              <DialogFooter className="pt-4">
                <DialogClose asChild><Button type="button" variant="outline" onClick={handleCloseDialog} className="glow-button">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isPending} className="glow-button">
                  {isPending ? <Loader2 className="animate-spin mr-2" /> : (selectedPlan ? <Edit3 className="mr-2" /> : <PlusCircle className="mr-2" />)}
                  {selectedPlan ? 'Save Changes' : 'Add Plan'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {(isPending && plans.length === 0) && <div className="text-center py-10"><Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" /><p className="text-muted-foreground">Loading plans...</p></div>}
      {(!isPending && plans.length === 0) && <p className="text-center text-muted-foreground py-10 text-lg">No plans yet. Add your first task or schedule!</p>}

      {plans.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map(plan => (
            <Card key={plan.id} className={cn("interactive-card shadow-lg", plan.completed ? "shadow-green-500/20 border-green-500/30 opacity-70" : "shadow-primary/10")}>
              <CardHeader>
                <CardTitle className={cn("font-headline text-xl flex justify-between items-start", plan.completed ? "text-green-400" : "glow-text-primary")}>
                  <span className="flex-1 break-words mr-2">{plan.title}</span>
                  <span className={cn("text-xs px-2 py-1 rounded-full whitespace-nowrap", 
                    plan.plan_type === 'exam' ? 'bg-red-500/20 text-red-300' : 
                    plan.plan_type === 'revision' ? 'bg-yellow-500/20 text-yellow-300' : 
                    'bg-blue-500/20 text-blue-300'
                  )}>
                    {getPlanTypeDisplay(plan.plan_type)}
                  </span>
                </CardTitle>
                <CardDescription className={cn(plan.completed ? "text-green-500/80" : "text-muted-foreground")}>
                  Due: {format(parseISO(plan.due_date), "PPP HH:mm")} {plan.subject && `| Subject: ${plan.subject}`}
                  {plan.class_level && ` | Class: ${plan.class_level}`}
                </CardDescription>
                 {plan.alarm_set_at && (
                    <p className="text-xs text-accent flex items-center"><AlarmClockPlus className="h-3 w-3 mr-1"/> Alarm: {format(parseISO(plan.alarm_set_at), "PPP HH:mm")}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {plan.description && <p className="text-sm mb-2 line-clamp-3">{plan.description}</p>}
                {(plan.start_time || plan.duration_minutes) && (
                    <p className="text-xs text-muted-foreground">
                        {plan.start_time && `Starts: ${format(parseISO(plan.start_time), 'HH:mm')}`}
                        {plan.start_time && plan.duration_minutes ? " | " : ""}
                        {plan.duration_minutes && `Duration: ${plan.duration_minutes} mins`}
                    </p>
                )}
                 <Button 
                    variant={plan.completed ? "outline" : "default"} 
                    size="sm" 
                    onClick={() => handleToggleComplete(plan)}
                    className={cn("w-full", plan.completed ? "border-green-500 text-green-500 hover:bg-green-500/10" : "glow-button")}
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
