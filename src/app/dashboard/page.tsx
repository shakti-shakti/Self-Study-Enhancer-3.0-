
// src/app/dashboard/page.tsx
'use client';

import { createClient } from '@/lib/supabase/client'; // Use client for client-side fetching
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { 
  Edit3, Target as TargetIcon, Trophy, Bot, BookOpen as BookOpenIcon, Brain, 
  Lightbulb, FileText as FileTextIcon, SlidersHorizontal, Sparkles, Zap, CalendarDays, 
  Clock, Info, Music, Globe, UploadCloud, Star, FolderOpen, AlarmClock, SpellCheck, Languages, Calculator, Users, BarChart3, History, Settings, UserCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Tables } from '@/lib/database.types';

// For Random Fact AI Flow
import { generateSyllabusFact, GenerateSyllabusFactInput } from '@/ai/flows/random-fact-generator'; 

interface CountdownProps {
  targetDate: string; // ISO string
  eventName: string;
}

const CountdownTimer: React.FC<CountdownProps> = ({ targetDate, eventName }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  });

  const timerComponents: JSX.Element[] = [];
  Object.keys(timeLeft).forEach((interval) => {
    // Ensure that timeLeft[interval] is a number before rendering
    const value = timeLeft[interval as keyof typeof timeLeft];
    if (typeof value !== 'number' || isNaN(value)) {
      return;
    }
    timerComponents.push(
      <div key={interval} className="text-center p-2 bg-primary/10 rounded-lg shadow-md">
        <span className="text-2xl md:text-3xl font-bold text-primary glow-text-primary">{value}</span>
        <span className="block text-xs text-muted-foreground uppercase">{interval}</span>
      </div>
    );
  });

  return (
    <Card className="interactive-card shadow-lg shadow-accent/20 border-accent/30 col-span-1 md:col-span-3">
      <CardHeader>
        <CardTitle className="text-2xl font-medium text-accent glow-text-accent text-center">
          Countdown to {eventName || "NEET 2026"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center items-center gap-2 md:gap-4 flex-wrap">
        {timerComponents.length ? timerComponents : <span className="text-xl text-muted-foreground">Time's up or event date not set!</span>}
      </CardContent>
    </Card>
  );
};


export default function DashboardPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null); // Replace any with actual User type from Supabase
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);
  const [randomFact, setRandomFact] = useState<string | null>(null);
  const [isLoadingFact, setIsLoadingFact] = useState(true);

  // Placeholder data - this would ideally come from Supabase queries
  const [tasksToday, setTasksToday] = useState(0); 
  const [upcomingExams, setUpcomingExams] = useState(0); 
  const [studyHoursLogged, setStudyHoursLogged] = useState(0);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
      if (authUser) {
        const { data: userProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        if (userProfile) {
          setProfile(userProfile);
        } else if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
        }

        // Fetch dashboard stats
        // Example: Fetch today's tasks count
        const today = new Date().toISOString().split('T')[0];
        const { count: tasksCount } = await supabase
            .from('study_plans')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', authUser.id)
            .eq('completed', false)
            .gte('due_date', `${today}T00:00:00Z`)
            .lte('due_date', `${today}T23:59:59Z`);
        setTasksToday(tasksCount || 0);
        
        // Fetch upcoming exams (e.g., in next 7 days)
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
         const { count: examsCount } = await supabase
            .from('study_plans')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', authUser.id)
            .eq('plan_type', 'exam')
            .gte('due_date', new Date().toISOString())
            .lte('due_date', nextWeek);
        setUpcomingExams(examsCount || 0);
        
        // Placeholder for study hours - this would need dedicated logging
        setStudyHoursLogged(18.5); 
      }
    };

    const fetchRandomFact = async () => {
      setIsLoadingFact(true);
      try {
        // Assuming class_level is available from profile or default to "11/12"
        const input: GenerateSyllabusFactInput = { class_level: profile?.class_level || "11/12" };
        const factResult = await generateSyllabusFact(input);
        setRandomFact(factResult.fact);
      } catch (error) {
        console.error("Error fetching random fact:", error);
        setRandomFact("Could not load a fact at this moment. Stay curious!");
      } finally {
        setIsLoadingFact(false);
      }
    };

    fetchUserAndProfile();
    fetchRandomFact();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, profile?.class_level]); // Refetch fact if class_level changes

  const quickAccessItems = [
    { name: 'Planner', href: '/dashboard/planner', icon: Edit3, description: "Map your study journey.", color: "primary" },
    { name: 'Quizzes', href: '/dashboard/quizzes', icon: TargetIcon, description: "Test your knowledge.", color: "accent" },
    { name: 'Challenges', href: '/dashboard/challenges', icon: Trophy, description: "Missions & Leaderboard.", color: "secondary" },
    { name: 'AI Assistant', href: '/dashboard/ai-study-assistant', icon: Bot, description: "Your personal AI tutor.", color: "primary" },
    { name: 'NCERT Explorer', href: '/dashboard/ncert-explorer', icon: BookOpenIcon, description: "AI-powered chapter insights.", color: "accent" },
    { name: 'Notes Generator', href: '/dashboard/smart-notes-generator', icon: FileTextIcon, description: "Concise AI study notes.", color: "secondary" },
    { name: 'Doubt Resolver', href: '/dashboard/smart-doubt-resolver', icon: Lightbulb, description: "AI help for tough questions.", color: "primary" },
    { name: 'Progress Tracker', href: '/dashboard/progress', icon: BarChart3, description: "Visualize your growth.", color: "accent" },
    { name: 'File Uploads', href: '/dashboard/file-uploads', icon: UploadCloud, description: "Your personal document cloud.", color: "secondary" },
    { name: 'Saved Questions', href: '/dashboard/saved-questions', icon: Star, description: "Revisit important questions.", color: "primary" },
    { name: 'Custom Tasks', href: '/dashboard/custom-tasks', icon: FolderOpen, description: "Manage personal to-dos.", color: "accent"},
    { name: 'Task Reminders', href: '/dashboard/task-reminders', icon: AlarmClock, description: "Set study alarms.", color: "secondary"},

  ];

  const userDisplayName = profile?.full_name || user?.email?.split('@')[0] || 'Aspirant';
  const neetTargetDate = "2026-05-03T00:00:00Z"; // Example NEET 2026 date, first Sunday of May
  const countdownEventName = profile?.custom_countdown_event_name || "NEET Exam";
  const countdownTargetDate = profile?.custom_countdown_target_date || neetTargetDate;

  return (
    <div className="space-y-10 pb-16 md:pb-0"> {/* Added padding-bottom for mobile nav */}
      <header className="relative p-6 md:p-8 rounded-xl bg-gradient-to-br from-card via-primary/10 to-secondary/10 overflow-hidden shadow-2xl shadow-primary/20 border border-primary/20">
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/worn-dots.png')] bg-repeat"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-headline font-bold mb-2">
            <span className="glow-text-primary">Welcome Back,</span> <span className="text-accent glow-text-accent">{userDisplayName}!</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl">
            Your Self Study Enhancer is ready. Let's conquer today's objectives!
          </p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Today's Objectives", value: tasksToday, icon: CalendarDays, unit: "Tasks", color: "primary", desc: "Stay focused and crush them!" },
          { title: "Upcoming Exams", value: upcomingExams, icon: Zap, unit: "Exams", color: "accent", desc: "Prepare and ace your tests!" },
          { title: "Weekly Study Log (Demo)", value: studyHoursLogged, icon: Clock, unit: "Hours", color: "secondary", desc: "Consistency is your superpower!" },
        ].map(item => (
          <Card key={item.title} className={`interactive-card shadow-lg shadow-${item.color}/20 border-${item.color}/30`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-lg font-medium text-${item.color} glow-text-${item.color}`}>{item.title}</CardTitle>
              <item.icon className={`h-7 w-7 text-${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold glow-text-${item.color}`}>{item.value} <span className="text-2xl text-muted-foreground">{item.unit}</span></div>
              <p className="text-sm text-muted-foreground pt-1">
                {item.desc}
              </p>
            </CardContent>
          </Card>
        ))}
         <CountdownTimer targetDate={countdownTargetDate} eventName={countdownEventName} />
      </div>
      
      <Card className="interactive-card p-2 md:p-0 shadow-xl shadow-card/50">
        <CardHeader className="px-4 md:px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-10 w-10 text-primary glow-text-primary" />
            <div>
              <CardTitle className="font-headline text-4xl glow-text-primary">Feature Arsenal</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">Deploy your tools for maximum impact.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 p-4 md:p-6">
          {quickAccessItems.map((item) => {
            const IconComponent = item.icon;
            return (
             <Link href={item.href} key={item.name} className="group">
                <div className={`p-4 md:p-5 border-2 border-input bg-card hover:border-${item.color} hover:bg-${item.color}/10 rounded-xl text-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-${item.color}/30 flex flex-col items-center justify-start h-full min-h-[160px] md:min-h-[180px]`}>
                    <IconComponent className={`h-8 w-8 md:h-10 md:w-10 mb-2 md:mb-3 text-${item.color} group-hover:scale-110 transition-transform duration-300 glow-text-${item.color}`} />
                    <p className={`font-headline text-lg md:text-xl mt-1 text-foreground group-hover:text-${item.color} transition-colors duration-300`}>{item.name}</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1 flex-grow">{item.description}</p>
                </div>
            </Link>
            );
          })}
        </CardContent>
      </Card>

      <Card className="interactive-card shadow-lg shadow-secondary/20 border-secondary/30">
        <CardHeader>
          <CardTitle className="text-2xl font-medium text-secondary glow-text-secondary flex items-center">
            <Lightbulb className="mr-2 h-7 w-7"/> Random Syllabus Fact
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingFact ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-secondary"/> 
              <p className="text-muted-foreground">Fetching a cool fact for you...</p>
            </div>
          ) : (
            <p className="text-lg text-foreground">{randomFact}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    