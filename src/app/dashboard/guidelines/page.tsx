// src/app/dashboard/guidelines/page.tsx
'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Info, Loader2, PlusCircle, Edit2, Trash2, Save } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format, parseISO } from 'date-fns';

type GuidelineTab = Tables<'neet_guidelines'>;

const tabSchema = z.object({
  tab_name: z.string().min(3, 'Tab name must be at least 3 characters.').max(50),
});
type TabFormData = z.infer<typeof tabSchema>;

const contentSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty.'),
});
type ContentFormData = z.infer<typeof contentSchema>;


export default function GuidelinesPage() {
  const [tabs, setTabs] = useState<GuidelineTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const supabase = createClient();
  const [userId, setUserId] = useState<string|null>(null);
  
  const [isTabDialogOpen, setIsTabDialogOpen] = useState(false);
  const [isContentEditing, setIsContentEditing] = useState(false);
  const [editingTab, setEditingTab] = useState<GuidelineTab | null>(null);


  const tabForm = useForm<TabFormData>({ resolver: zodResolver(tabSchema) });
  const contentForm = useForm<ContentFormData>({ resolver: zodResolver(contentSchema) });

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

  const fetchTabs = useCallback(async () => {
    if (!userId) return;
    startTransition(async () => {
      const { data, error } = await supabase
        .from('neet_guidelines')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        toast({ variant: 'destructive', title: 'Error fetching guideline tabs', description: error.message });
      } else {
        setTabs(data || []);
        if (data && data.length > 0 && !activeTab) {
          setActiveTab(data[0].id); 
          contentForm.setValue('content', data[0].content);
        } else if (data && data.length > 0 && activeTab) {
            const currentActiveTabData = data.find(t => t.id === activeTab);
            if (currentActiveTabData) {
                contentForm.setValue('content', currentActiveTabData.content);
            } else { 
                 setActiveTab(data[0].id);
                 contentForm.setValue('content', data[0].content);
            }
        } else if (data && data.length === 0) { // No tabs exist
            setActiveTab(undefined);
            contentForm.setValue('content', '');
        }
      }
    });
  }, [userId, supabase, toast, activeTab, contentForm]);

  useEffect(() => {
    if (userId) fetchTabs();
  }, [userId, fetchTabs]);

  const handleAddOrEditTab = async (values: TabFormData) => {
    if (!userId) return;
    startTransition(async () => {
      let newActiveTabId = activeTab;
      if (editingTab) { 
        const { error } = await supabase
          .from('neet_guidelines')
          .update({ tab_name: values.tab_name, updated_at: new Date().toISOString() })
          .eq('id', editingTab.id)
          .eq('user_id', userId);
        if (error) toast({ variant: 'destructive', title: 'Error updating tab', description: error.message });
        else { toast({ title: 'Tab updated!' }); fetchTabs(); }
      } else { 
        const { data: newTab, error } = await supabase
          .from('neet_guidelines')
          .insert({ user_id: userId, tab_name: values.tab_name, content: 'Add your tips and guidelines here!' })
          .select()
          .single();
        if (error) toast({ variant: 'destructive', title: 'Error adding tab', description: error.message });
        else { 
            toast({ title: 'New tab added!', className: 'bg-primary/10 border-primary text-primary-foreground' });
            if(newTab) {
                newActiveTabId = newTab.id; // Prepare to set new tab as active
                setTabs(prev => [...prev, newTab]); // Optimistic update
                setActiveTab(newTab.id);
                contentForm.setValue('content', newTab.content);
            }
        }
      }
      setIsTabDialogOpen(false);
      setEditingTab(null);
      tabForm.reset();
      // If a new tab was created, fetchTabs will be called, and it will set the active tab
      // If only name was edited, fetchTabs will update list, activeTab remains
    });
  };
  
  const handleSaveContent = async (values: ContentFormData) => {
    if (!userId || !activeTab) return;
    const currentTab = tabs.find(t => t.id === activeTab);
    if (!currentTab) return;

    startTransition(async () => {
        const { error } = await supabase
            .from('neet_guidelines')
            .update({ content: values.content, updated_at: new Date().toISOString() })
            .eq('id', activeTab)
            .eq('user_id', userId);
        if (error) {
            toast({ variant: 'destructive', title: 'Error saving content', description: error.message });
        } else {
            toast({ title: 'Content saved!', className: 'bg-primary/10 border-primary text-primary-foreground'});
            setIsContentEditing(false);
            setTabs(prevTabs => prevTabs.map(t => t.id === activeTab ? {...t, content: values.content, updated_at: new Date().toISOString()} : t));
            const activityLog: TablesInsert<'activity_logs'> = {
              user_id: userId,
              activity_type: 'guideline_updated',
              description: `Updated guideline tab: "${currentTab.tab_name}"`,
              details: { tab_id: currentTab.id, tab_name: currentTab.tab_name }
            };
            await supabase.from('activity_logs').insert(activityLog);
        }
    });
  };

  const handleDeleteTab = async (tabId: string) => {
    if (!userId) return;
    startTransition(async () => {
      const tabToDelete = tabs.find(t => t.id === tabId);
      const { error } = await supabase
        .from('neet_guidelines')
        .delete()
        .eq('id', tabId)
        .eq('user_id', userId);
      if (error) toast({ variant: 'destructive', title: 'Error deleting tab', description: error.message });
      else {
        toast({ title: 'Tab deleted.' });
        if (tabToDelete) {
           const activityLog: TablesInsert<'activity_logs'> = {
            user_id: userId,
            activity_type: 'guideline_deleted',
            description: `Deleted guideline tab: "${tabToDelete.tab_name}"`,
            details: { tab_name: tabToDelete.tab_name }
          };
          await supabase.from('activity_logs').insert(activityLog);
        }
        
        // Adjust activeTab if the deleted tab was active
        setTabs(prevTabs => {
            const remainingTabs = prevTabs.filter(t => t.id !== tabId);
            if (activeTab === tabId) {
                if (remainingTabs.length > 0) {
                    setActiveTab(remainingTabs[0].id);
                    contentForm.setValue('content', remainingTabs[0].content);
                } else {
                    setActiveTab(undefined);
                    contentForm.setValue('content', '');
                }
            }
            return remainingTabs;
        });
      }
    });
  };

  const openTabDialog = (tab?: GuidelineTab) => {
    setEditingTab(tab || null);
    if (tab) tabForm.setValue('tab_name', tab.tab_name);
    else tabForm.reset();
    setIsTabDialogOpen(true);
  };
  
  const onTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const selectedTabData = tabs.find(t => t.id === tabId);
    if (selectedTabData) {
        contentForm.setValue('content', selectedTabData.content);
    }
    setIsContentEditing(false); 
  };

  const currentTabData = tabs.find(t => t.id === activeTab);

  return (
    <div className="space-y-10 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Info className="mr-4 h-10 w-10" /> NEET Guidelines Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Curate important tips, reminders, and guidelines. Organize them into custom tabs.
        </p>
      </header>

      <Dialog open={isTabDialogOpen} onOpenChange={setIsTabDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => openTabDialog()} className="glow-button fixed bottom-20 right-6 md:static md:mb-4 z-50 shadow-xl">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Tab
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl glow-text-primary">{editingTab ? 'Edit Tab Name' : 'Create New Tab'}</DialogTitle>
            <DialogDescription>{editingTab ? 'Rename your custom guideline tab.' : 'Enter a name for your new guideline tab.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={tabForm.handleSubmit(handleAddOrEditTab)} className="space-y-4">
            <FormField control={tabForm.control} name="tab_name" render={({ field }) => (
                <FormItem>
                    <FormLabel>Tab Name</FormLabel>
                    <FormControl><Input placeholder="Tab name (e.g., Exam Strategy)" {...field} className="input-glow" /></FormControl>
                    <FormMessage />
                </FormItem>
            )}/>
            <DialogFooter className="pt-2">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isPending} className="glow-button">
                {isPending ? <Loader2 className="animate-spin"/> : (editingTab ? <Save/> : <PlusCircle/>)} {editingTab ? 'Save Name' : 'Create Tab'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {(isPending && tabs.length === 0 && !userId) && <div className="text-center py-10"><Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" /><p className="text-muted-foreground">Authenticating...</p></div>}
      {(isPending && tabs.length === 0 && userId) && <div className="text-center py-10"><Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" /><p className="text-muted-foreground">Loading guidelines...</p></div>}
      
      {tabs.length === 0 && !isPending && userId && (
        <Card className="interactive-card shadow-lg text-center">
          <CardContent className="pt-10">
            <Info className="mx-auto h-16 w-16 text-muted-foreground/50 my-4" />
            <p className="text-xl text-muted-foreground">No guideline tabs created yet.</p>
            <p className="text-sm text-muted-foreground">Click "Add New Tab" to start organizing your NEET prep notes.</p>
          </CardContent>
        </Card>
      )}

      {tabs.length > 0 && (
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 bg-primary/5 border border-primary/20 h-auto p-1">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="text-sm md:text-base h-11 data-[state=active]:bg-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg whitespace-normal text-center break-words">
                {tab.tab_name}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-4">
              <Card className="interactive-card shadow-xl shadow-primary/10 min-h-[400px]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-headline text-2xl glow-text-primary">{tab.tab_name}</CardTitle>
                    <CardDescription>Last updated: {format(parseISO(tab.updated_at), "PPp")}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                     <Button variant="outline" size="sm" onClick={() => { openTabDialog(tab); }} className="glow-button border-accent text-accent hover:bg-accent/10">
                        <Edit2 className="h-4 w-4"/> <span className="ml-1 hidden sm:inline">Rename Tab</span>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteTab(tab.id)} disabled={isPending} className="glow-button">
                        <Trash2 className="h-4 w-4"/> <span className="ml-1 hidden sm:inline">Delete Tab</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isContentEditing && activeTab === tab.id ? (
                    <Form {...contentForm}>
                    <form onSubmit={contentForm.handleSubmit(handleSaveContent)} className="space-y-4">
                      <FormField control={contentForm.control} name="content" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="sr-only">Tab Content</FormLabel>
                            <FormControl>
                                <Textarea {...field} rows={15} className="input-glow w-full min-h-[300px]" />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                      )}/>
                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => {setIsContentEditing(false); contentForm.setValue('content', tab.content);}} className="glow-button">Cancel</Button>
                        <Button type="submit" disabled={isPending || !contentForm.formState.isValid} className="glow-button">
                          {isPending ? <Loader2 className="animate-spin" /> : <Save />} Save Content
                        </Button>
                      </div>
                    </form>
                    </Form>
                  ) : (
                    <>
                      <div className="prose dark:prose-invert max-w-none p-4 bg-background/30 rounded-md min-h-[300px] whitespace-pre-wrap border border-border/30">
                        {tab.content || "No content yet. Click edit to add your notes!"}
                      </div>
                      <Button onClick={() => { setIsContentEditing(true); contentForm.setValue('content', tab.content); }} className="mt-4 glow-button">
                        <Edit2 className="mr-2" /> Edit Content
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
