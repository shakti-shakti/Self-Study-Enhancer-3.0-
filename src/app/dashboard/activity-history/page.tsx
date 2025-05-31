
// src/app/dashboard/activity-history/page.tsx
'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@/lib/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { History, Loader2, Trash2, Filter, CalendarDays, ListChecks, Bot, Zap, Edit3, Star, Music, Download, FolderOpen, AlarmClock, SlidersHorizontal, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ActivityLog = Tables<'activity_logs'>;

export default function ActivityHistoryPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const supabase = createClient();
  const [userId, setUserId] = useState<string|null>(null);

  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState(''); 
  const [searchTerm, setSearchTerm] = useState('');


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

  const fetchActivities = useCallback(async () => {
    if (!userId) return;
    startTransition(async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100); 

      if (error) {
        toast({ variant: 'destructive', title: 'Error fetching activity history', description: error.message });
      } else {
        setActivities(data || []);
        setFilteredActivities(data || []);
      }
    });
  }, [userId, supabase, toast]);

  useEffect(() => {
    if (userId) fetchActivities();
  }, [userId, fetchActivities]);

  useEffect(() => {
    let tempActivities = [...activities];
    if (filterType) {
      tempActivities = tempActivities.filter(act => act.activity_type === filterType);
    }
    if (filterDate) {
      tempActivities = tempActivities.filter(act => format(parseISO(act.created_at), 'yyyy-MM-dd') === filterDate);
    }
    if (searchTerm) {
        tempActivities = tempActivities.filter(act => 
            act.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (act.details && typeof act.details === 'object' && JSON.stringify(act.details).toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }
    setFilteredActivities(tempActivities);
  }, [filterType, filterDate, searchTerm, activities]);

  const handleDeleteActivity = async (activityId: string) => {
    if(!userId) return;
    startTransition(async () => {
      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .eq('id', activityId)
        .eq('user_id', userId);

      if (error) {
        toast({ variant: 'destructive', title: 'Error deleting activity', description: error.message });
      } else {
        fetchActivities(); 
        toast({ title: 'Activity log removed.' });
      }
    });
  };
  
  const activityTypeOptions = [
    {value: "task_completed", label: "Task Completed", icon: <ListChecks/>},
    {value: "quiz_attempted", label: "Quiz Attempted", icon: <Zap/>},
    {value: "ai_query", label: "AI Interaction", icon: <Bot/>},
    {value: "guideline_updated", label: "Guideline Updated", icon: <Edit3/>},
    {value: "question_saved", label: "Question Saved", icon: <Star/>},
    {value: "music_played", label: "Music Player Used", icon: <Music/>},
    {value: "file_uploaded", label: "File Uploaded", icon: <Download/>},
    {value: "custom_task_created", label: "Custom Task Created", icon: <FolderOpen/>},
    {value: "alarm_set", label: "Alarm Set/Modified", icon: <AlarmClock/>},
    {value: "app_customized", label: "App Customization", icon: <SlidersHorizontal/>},
    {value: "profile_updated", label: "Profile Updated", icon: <SlidersHorizontal/>},
    {value: "mood_logged", label: "Mood Logged", icon: <Bot />},
    {value: "dictionary_lookup", label: "Dictionary Lookup", icon: <Zap />},
    {value: "text_translated", label: "Text Translated", icon: <Zap />},
    {value: "calculator_used", label: "Calculator Used", icon: <Zap />},
    {value: "mission_completed", label: "Mission Completed", icon: <ListChecks />},
    {value: "file_deleted", label: "File Deleted", icon: <Trash2 />},
    {value: "ncert_explorer_used", label: "NCERT Explorer Used", icon: <Bot />},
    {value: "smart_notes_generated", label: "Smart Notes Generated", icon: <Bot />},
    {value: "doubt_resolved", label: "Doubt Resolved", icon: <Bot />},
    {value: "music_player_visited", label: "Music Player Visited", icon: <Music />},
    {value: "guideline_deleted", label: "Guideline Deleted", icon: <Trash2 />},
    {value: "custom_task_updated", label: "Custom Task Updated", icon: <Edit3 />},
    {value: "custom_task_deleted", label: "Custom Task Deleted", icon: <Trash2 />},
    {value: "custom_task_status_changed", label: "Custom Task Status Changed", icon: <ListChecks />},
  ];
  
  const getActivityIcon = (type: string) => {
    const option = activityTypeOptions.find(opt => opt.value === type);
    return option?.icon || <History className="h-5 w-5 text-primary"/>;
  };


  if (isPending && activities.length === 0) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-10 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <History className="mr-4 h-10 w-10" /> Activity History
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Review your interactions and achievements within the app.
        </p>
      </header>

      <Card className="interactive-card shadow-lg p-4 md:p-6">
        <CardHeader>
          <CardTitle className="text-2xl font-headline glow-text-accent flex items-center justify-between">
            <span>Your Recent Activities</span>
            <Button variant="outline" size="sm" onClick={() => {setFilterDate(''); setFilterType(''); setSearchTerm('');}} className="glow-button">
              <Filter className="mr-2 h-4 w-4" /> Clear Filters
            </Button>
          </CardTitle>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="input-glow h-11"><SelectValue placeholder="Filter by type..." /></SelectTrigger>
              <SelectContent>
                {/* Removed "All Types" - value="" causes issues */}
                {activityTypeOptions.sort((a,b) => a.label.localeCompare(b.label)).map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input 
              type="date" 
              value={filterDate} 
              onChange={(e) => setFilterDate(e.target.value)} 
              className="input-glow h-11"
            />
            <div className="relative">
                 <Input 
                    type="text" 
                    placeholder="Search descriptions/details..."
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="input-glow h-11 pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 && !isPending && (
            <div className="text-center py-10">
              <History className="mx-auto h-16 w-16 text-muted-foreground/50 my-4" />
              <p className="text-xl text-muted-foreground">No activities recorded yet or matching filters.</p>
              <p className="text-sm text-muted-foreground">Your interactions with the app will appear here.</p>
            </div>
          )}
          <div className="space-y-4">
            {filteredActivities.map(activity => (
              <Card key={activity.id} className="p-4 rounded-lg shadow-md bg-card/70 border border-border/50 relative group">
                <div className="flex items-start space-x-3">
                    <span className="mt-1">{getActivityIcon(activity.activity_type)}</span>
                    <div className="flex-1">
                        <p className="font-semibold text-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground flex items-center">
                            <CalendarDays className="h-3 w-3 mr-1.5"/> {format(parseISO(activity.created_at), "PPP, p")} 
                            <Badge variant="outline" className="ml-2">{activity.activity_type.replace(/_/g, ' ')}</Badge>
                        </p>
                        {activity.details && typeof activity.details === 'object' && Object.keys(activity.details).length > 0 && (
                             <details className="mt-1 text-xs">
                                <summary className="cursor-pointer text-accent hover:underline">View Details</summary>
                                <pre className="p-2 bg-muted/20 rounded mt-1 text-muted-foreground whitespace-pre-wrap text-[0.7rem] max-h-40 overflow-auto">
                                    {JSON.stringify(activity.details, null, 2)}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteActivity(activity.id)} 
                    disabled={isPending}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

