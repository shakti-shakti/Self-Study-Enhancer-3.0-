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
          setActiveTab(data[0].id); // Set first tab as active if none is set
          contentForm.setValue('content', data[0].content);
        } else if (data && data.length > 0 && activeTab) {
            const currentActiveTabData = data.find(t => t.id === activeTab);
            if (currentActiveTabData) {
                contentForm.setValue('content', currentActiveTabData.content);
            } else { // If current active tab was deleted, default to first
                 setActiveTab(data[0].id);
                 contentForm.setValue('content', data[0].content);
            }
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
      if (editingTab) { // Editing existing tab name (not content)
        const { error } = await supabase
          .from('neet_guidelines')
          .update({ tab_name: values.tab_name, updated_at: new Date().toISOString() })
          .eq('id', editingTab.id)
          .eq('user_id', userId);
        if (error) toast({ variant: 'destructive', title: 'Error updating tab', description: error.message });
        else { toast({ title: 'Tab updated!' }); fetchTabs(); }
      } else { // Adding new tab
        const { data: newTab, error } = await supabase
          .from('neet_guidelines')
          .insert({ user_id: userId, tab_name: values.tab_name, content: 'Add your tips and guidelines here!' })
          .select()
          .single();
        if (error) toast({ variant: 'destructive', title: 'Error adding tab', description: error.message });
        else { 
            toast({ title: 'New tab added!', className: 'bg-primary/10 border-primary text-primary-foreground' });
            fetchTabs();
            if(newTab) setActiveTab(newTab.id); // Activate the new tab
        }
      }
      setIsTabDialogOpen(false);
      setEditingTab(null);
      tabForm.reset();
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
            // Optimistically update local state or refetch
            setTabs(prevTabs => prevTabs.map(t => t.id === activeTab ? {...t, content: values.content, updated_at: new Date().toISOString()} : t));
        }
    });
  };

  const handleDeleteTab = async (tabId: string) => {
    if (!userId) return;
    // Add confirmation dialog here if desired
    startTransition(async () => {
      const { error } = await supabase
        .from('neet_guidelines')
        .delete()
        .eq('id', tabId)
        .eq('user_id', userId);
      if (error) toast({ variant: 'destructive', title: 'Error deleting tab', description: error.message });
      else {
        toast({ title: 'Tab deleted.' });
        if (activeTab === tabId) setActiveTab(undefined); // Reset active tab if deleted
        fetchTabs();
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
    setIsContentEditing(false); // Exit editing mode when switching tabs
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
            <Input {...tabForm.register('tab_name')} placeholder="Tab name (e.g., Exam Strategy)" className="input-glow" />
            {tabForm.formState.errors.tab_name && <p className="text-sm text-destructive">{tabForm.formState.errors.tab_name.message}</p>}
            <DialogFooter className="pt-2">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isPending} className="glow-button">
                {isPending ? <Loader2 className="animate-spin"/> : (editingTab ? <Save/> : <PlusCircle/>)} {editingTab ? 'Save Name' : 'Create Tab'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isPending && tabs.length === 0 && (
         <div className="text-center py-10"><Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" /><p className="text-muted-foreground">Loading guidelines...</p></div>
      )}
      
      {tabs.length === 0 && !isPending && (
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
                    <CardDescription>Last updated: {format(parseISO(tab.updated_at), "PPP, p")}</CardDescription>
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
                    <form onSubmit={contentForm.handleSubmit(handleSaveContent)} className="space-y-4">
                      <Textarea {...contentForm.register('content')} rows={15} className="input-glow w-full min-h-[300px]" />
                      {contentForm.formState.errors.content && <p className="text-sm text-destructive">{contentForm.formState.errors.content.message}</p>}
                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => {setIsContentEditing(false); contentForm.setValue('content', tab.content);}} className="glow-button">Cancel</Button>
                        <Button type="submit" disabled={isPending} className="glow-button">
                          {isPending ? <Loader2 className="animate-spin" /> : <Save />} Save Content
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="prose dark:prose-invert max-w-none p-2 bg-background/30 rounded-md min-h-[300px] whitespace-pre-wrap border border-border/30">
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
