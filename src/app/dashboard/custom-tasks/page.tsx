// src/app/dashboard/custom-tasks/page.tsx
'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { CalendarIcon, CheckCircle, Edit3, FolderOpen, Loader2, PlusCircle, Trash2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types';
import { cn } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';

const taskFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.').max(100),
  description: z.string().optional(),
  due_date: z.date().optional(),
  completed: z.boolean().default(false),
});

type TaskFormData = z.infer<typeof taskFormSchema>;
type CustomTask = Tables<'custom_tasks'>;

export default function CustomTasksPage() {
  const [isPending, startTransition] = useTransition();
  const [tasks, setTasks] = useState<CustomTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<CustomTask | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();
  const [userId, setUserId] = useState<string|null>(null);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
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

  const fetchTasks = useCallback(async () => {
    if (!userId) return;
    startTransition(async () => {
      const { data, error } = await supabase
        .from('custom_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        toast({ variant: 'destructive', title: 'Error fetching tasks', description: error.message });
      } else {
        setTasks(data || []);
      }
    });
  }, [userId, supabase, toast]);

  useEffect(() => {
    if (userId) fetchTasks();
  }, [userId, fetchTasks]);

  const onSubmit = async (values: TaskFormData) => {
    if (!userId) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }

    startTransition(async () => {
      const taskData: Omit<TablesInsert<'custom_tasks'>, 'id' | 'created_at' | 'user_id'> & { user_id: string } = {
        user_id: userId,
        title: values.title,
        description: values.description || null,
        due_date: values.due_date ? values.due_date.toISOString() : null,
        completed: values.completed,
      };
      
      let error;
      if (selectedTask) { // Update
        const { error: updateError } = await supabase
          .from('custom_tasks')
          .update(taskData as TablesUpdate<'custom_tasks'>)
          .eq('id', selectedTask.id)
          .eq('user_id', userId);
        error = updateError;
      } else { // Insert
        const { error: insertError } = await supabase.from('custom_tasks').insert(taskData as TablesInsert<'custom_tasks'>);
        error = insertError;
      }

      if (error) {
        toast({ variant: 'destructive', title: `Error ${selectedTask ? 'updating' : 'adding'} task`, description: error.message });
      } else {
        toast({ title: `Task ${selectedTask ? 'updated' : 'added'} successfully`, className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary' });
        
        // Log activity
        const activityLog: TablesInsert<'activity_logs'> = {
          user_id: userId,
          activity_type: selectedTask ? 'custom_task_updated' : 'custom_task_created',
          description: `${selectedTask ? 'Updated' : 'Created'} custom task: "${values.title.substring(0,50)}..."`,
          details: { title: values.title, completed: values.completed, due_date: values.due_date }
        };
        await supabase.from('activity_logs').insert(activityLog);
        
        fetchTasks();
        handleCloseDialog();
      }
    });
  };

  const handleDeleteTask = async (taskId: string) => {
     if (!userId) return;
    startTransition(async () => {
      const taskToDelete = tasks.find(t => t.id === taskId);
      const { error } = await supabase.from('custom_tasks').delete().eq('id', taskId).eq('user_id', userId);
      if (error) {
        toast({ variant: 'destructive', title: 'Error deleting task', description: error.message });
      } else {
        toast({ title: 'Task deleted successfully' });
         if (taskToDelete) {
          const activityLog: TablesInsert<'activity_logs'> = {
            user_id: userId,
            activity_type: 'custom_task_deleted',
            description: `Deleted custom task: "${taskToDelete.title.substring(0,50)}..."`,
            details: { title: taskToDelete.title }
          };
          await supabase.from('activity_logs').insert(activityLog);
        }
        fetchTasks();
      }
    });
  };
  
  const handleToggleComplete = async (task: CustomTask) => {
    if (!userId) return;
    startTransition(async () => {
      const { error } = await supabase
        .from('custom_tasks')
        .update({ completed: !task.completed })
        .eq('id', task.id)
        .eq('user_id', userId);
      if (error) {
        toast({ variant: 'destructive', title: 'Error updating task status', description: error.message });
      } else {
        toast({ title: `Task marked as ${!task.completed ? 'complete' : 'incomplete'}` });
         const activityLog: TablesInsert<'activity_logs'> = {
          user_id: userId,
          activity_type: 'custom_task_status_changed',
          description: `Task "${task.title.substring(0,50)}..." marked as ${!task.completed ? 'complete' : 'incomplete'}.`,
          details: { title: task.title, new_status: !task.completed }
        };
        await supabase.from('activity_logs').insert(activityLog);
        fetchTasks();
      }
    });
  };

  const handleOpenDialog = (task?: CustomTask) => {
    setSelectedTask(task || null);
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || '',
        due_date: task.due_date ? parseISO(task.due_date) : undefined,
        completed: task.completed,
      });
    } else {
      form.reset({
        title: '',
        description: '',
        due_date: undefined,
        completed: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedTask(null);
    form.reset();
  };

  return (
    <div className="space-y-10 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <FolderOpen className="mr-4 h-10 w-10" /> Custom Task Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Manage your personal to-do list and other non-academic tasks here.
        </p>
      </header>

      <div className="text-center mb-8">
        <Button onClick={() => handleOpenDialog()} className="glow-button text-lg py-6">
          <PlusCircle className="mr-2 h-6 w-6" /> Add New Custom Task
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border shadow-xl shadow-primary/20">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl glow-text-primary">{selectedTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1 max-h-[70vh] overflow-y-auto">
              <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input placeholder="E.g., Buy groceries, Call mom" {...field} className="input-glow" /></FormControl>
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
              <FormField control={form.control} name="due_date" render={({ field }) => (
                  <FormItem className="flex flex-col">
                      <FormLabel>Due Date (Optional)</FormLabel>
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
                  {isPending ? <Loader2 className="animate-spin mr-2" /> : (selectedTask ? <Edit3 className="mr-2" /> : <PlusCircle className="mr-2" />)}
                  {selectedTask ? 'Save Changes' : 'Add Task'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {(isPending && tasks.length === 0) && <div className="text-center py-10"><Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" /><p className="text-muted-foreground">Loading tasks...</p></div>}
      {(!isPending && tasks.length === 0) && <p className="text-center text-muted-foreground py-10 text-lg">No custom tasks yet. Add your first one!</p>}

      {tasks.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map(task => (
            <Card key={task.id} className={cn("interactive-card shadow-lg", task.completed ? "shadow-green-500/20 border-green-500/30 opacity-70" : "shadow-primary/10")}>
              <CardHeader>
                <CardTitle className={cn("font-headline text-xl flex justify-between items-start", task.completed ? "text-green-400" : "glow-text-primary")}>
                  <span className="flex-1 break-words mr-2">{task.title}</span>
                </CardTitle>
                <CardDescription className={cn(task.completed ? "text-green-500/80" : "text-muted-foreground")}>
                  {task.due_date && isValid(parseISO(task.due_date)) ? `Due: ${format(parseISO(task.due_date), "PPP")}` : 'No due date'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {task.description && <p className="text-sm mb-2 line-clamp-3">{task.description}</p>}
                 <Button 
                    variant={task.completed ? "outline" : "default"} 
                    size="sm" 
                    onClick={() => handleToggleComplete(task)}
                    className={cn("w-full", task.completed ? "border-green-500 text-green-500 hover:bg-green-500/10" : "glow-button")}
                    disabled={isPending}
                  >
                    {task.completed ? <XCircle className="mr-2" /> : <CheckCircle className="mr-2" />}
                    {task.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                  </Button>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(task)} disabled={isPending} className="glow-button border-accent text-accent hover:bg-accent/10 hover:text-accent">
                  <Edit3 className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteTask(task.id)} disabled={isPending} className="glow-button">
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
