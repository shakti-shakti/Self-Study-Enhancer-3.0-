import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { 
  CheckCircle, Clock, Brain, Edit3, Users, BookOpen as BookOpenIcon, BarChart3, Target as TargetIcon, Bot, MessageSquare, 
  SlidersHorizontal, Lightbulb, FileText as FileTextIcon, Trophy, Sparkles, Zap, CalendarDays
} from 'lucide-react';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Placeholder data - this would ideally come from Supabase queries
  const tasksToday = 7; 
  const upcomingExams = 3; 
  const studyHoursLogged = 18.5;

  const quickAccessItems = [
    { name: 'Planner', href: '/dashboard/planner', icon: Edit3, description: "Map your study journey.", color: "primary" },
    { name: 'Quizzes', href: '/dashboard/quizzes', icon: TargetIcon, description: "Test your knowledge.", color: "accent" },
    { name: 'Challenges', href: '/dashboard/challenges', icon: Trophy, description: "Missions & Leaderboard.", color: "secondary" },
    { name: 'Study Rooms', href: '/dashboard/study-rooms', icon: Users, description: "Collaborate with peers.", color: "primary" },
    { name: 'NCERT Explorer', href: '/dashboard/ncert-explorer', icon: BookOpenIcon, description: "AI-powered chapter insights.", color: "accent" },
    { name: 'Mind & Focus Hub', href: '/dashboard/mental-health', icon: Brain, description: "Track your well-being.", color: "secondary" },
    { name: 'Progress Tracker', href: '/dashboard/progress', icon: BarChart3, description: "Visualize your growth.", color: "primary" },
    { name: 'Doubt Resolver', href: '/dashboard/smart-doubt-resolver', icon: Lightbulb, description: "AI help for tough questions.", color: "accent" },
    { name: 'Notes Generator', href: '/dashboard/smart-notes-generator', icon: FileTextIcon, description: "Concise AI study notes.", color: "secondary" },
    { name: 'AI Assistant', href: '/dashboard/ai-study-assistant', icon: Bot, description: "Your personal AI tutor.", color: "primary" },
    { name: 'Customize App', href: '/dashboard/app-customization', icon: SlidersHorizontal, description: "Personalize your experience.", color: "accent" },
  ];

  const userDisplayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Aspirant';

  return (
    <div className="space-y-12">
      <header className="relative p-8 rounded-xl bg-gradient-to-br from-primary/20 via-card to-secondary/20 overflow-hidden shadow-2xl shadow-primary/30 border border-primary/30">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] bg-repeat"></div>
        <div className="relative z-10">
          <h1 className="text-5xl md:text-6xl font-headline font-bold mb-3">
            <span className="glow-text-primary">Welcome Back,</span> <span className="text-accent glow-text-accent">{userDisplayName}!</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Your NEET Prep+ Command Center is active. Let's conquer today's objectives!
          </p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Today's Objectives", value: tasksToday, icon: CalendarDays, unit: "Tasks", color: "primary", desc: "Stay focused and crush them!" },
          { title: "Upcoming Exams", value: upcomingExams, icon: Zap, unit: "Exams", color: "accent", desc: "Prepare and ace your tests!" },
          { title: "Weekly Study Hours", value: studyHoursLogged, icon: Clock, unit: "Hours", color: "secondary", desc: "Consistency is your superpower!" },
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
      </div>
      
      <Card className="interactive-card p-2 md:p-0 shadow-xl shadow-card">
        <CardHeader className="px-4 md:px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-10 w-10 text-primary glow-text-primary" />
            <div>
              <CardTitle className="font-headline text-4xl glow-text-primary">Feature Arsenal</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">Deploy your tools for maximum impact.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 p-4 md:p-6">
          {quickAccessItems.map((item) => {
            const IconComponent = item.icon;
            return (
             <Link href={item.href} key={item.name} className="group">
                <div className={`p-5 border-2 border-input bg-card hover:border-${item.color} hover:bg-${item.color}/10 rounded-xl text-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-${item.color}/30 flex flex-col items-center justify-start h-full min-h-[180px]`}>
                    <IconComponent className={`h-10 w-10 mb-3 text-${item.color} group-hover:scale-110 transition-transform duration-300 glow-text-${item.color}`} />
                    <p className={`font-headline text-xl mt-1 text-foreground group-hover:text-${item.color} transition-colors duration-300`}>{item.name}</p>
                    <p className="text-sm text-muted-foreground mt-1.5 flex-grow">{item.description}</p>
                </div>
            </Link>
            );
          })}
        </CardContent>
      </Card>

    </div>
  );
}
