import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { CheckCircle, Clock, Brain, Edit3, Users, BookOpen, BarChart3, Target, Bot, MessageSquare, SlidersHorizontal, Lightbulb, FileText, Trophy } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Placeholder data for dashboard items
  const tasksToday = 5; // This would ideally come from study_plans table
  const upcomingExams = 2; // This would also come from study_plans table
  const studyHoursLogged = 12.5; // Could be derived from study_plans completed or a dedicated log

  const quickAccessItems = [
    { name: 'Planner', href: '/dashboard/planner', icon: <Edit3 className="h-8 w-8 mb-2 text-primary group-hover:scale-110 transition-transform" />, description: "Plan your study sessions & tasks." },
    { name: 'Quizzes', href: '/dashboard/quizzes', icon: <Target className="h-8 w-8 mb-2 text-primary group-hover:scale-110 transition-transform" />, description: "Test your knowledge." },
    { name: 'Challenges', href: '/dashboard/challenges', icon: <Trophy className="h-8 w-8 mb-2 text-accent group-hover:scale-110 transition-transform" />, description: "Missions & Leaderboard." },
    { name: 'Study Rooms', href: '/dashboard/study-rooms', icon: <Users className="h-8 w-8 mb-2 text-primary group-hover:scale-110 transition-transform" />, description: "Collaborate with peers." },
    { name: 'NCERT Explorer', href: '/dashboard/ncert-explorer', icon: <BookOpen className="h-8 w-8 mb-2 text-primary group-hover:scale-110 transition-transform" />, description: "Explore NCERT content." },
    { name: 'Mind & Focus Hub', href: '/dashboard/mental-health', icon: <Brain className="h-8 w-8 mb-2 text-accent group-hover:scale-110 transition-transform" />, description: "Track your well-being." },
    { name: 'Progress Tracker', href: '/dashboard/progress', icon: <BarChart3 className="h-8 w-8 mb-2 text-primary group-hover:scale-110 transition-transform" />, description: "Monitor your growth." },
    { name: 'Smart Doubt Resolver', href: '/dashboard/smart-doubt-resolver', icon: <Lightbulb className="h-8 w-8 mb-2 text-accent group-hover:scale-110 transition-transform" />, description: "Get help with tough questions." },
    { name: 'Smart Notes Generator', href: '/dashboard/smart-notes-generator', icon: <FileText className="h-8 w-8 mb-2 text-primary group-hover:scale-110 transition-transform" />, description: "Generate concise study notes." },
    { name: 'AI Study Assistant', href: '/dashboard/ai-study-assistant', icon: <Bot className="h-8 w-8 mb-2 text-accent group-hover:scale-110 transition-transform" />, description: "Your personal AI tutor." },
    { name: 'App Customization', href: '/dashboard/app-customization', icon: <SlidersHorizontal className="h-8 w-8 mb-2 text-primary group-hover:scale-110 transition-transform" />, description: "Personalize your app experience." },
  ];


  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary">Welcome, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'}!</h1>
        <p className="text-lg text-muted-foreground mt-1">Here's your NEET Prep+ overview for today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="interactive-card shadow-lg shadow-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Tasks Today</CardTitle>
            <CheckCircle className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold glow-text-primary">{tasksToday}</div>
            <p className="text-sm text-muted-foreground">
              Keep up the great work!
            </p>
          </CardContent>
        </Card>
        <Card className="interactive-card shadow-lg shadow-accent/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Upcoming Exams</CardTitle>
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-6 w-6 text-accent">
              <path d="M12 22V18M12 6V2M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M7.76 16.24L4.93 19.07M19.07 4.93L16.24 7.76" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold glow-text-accent">{upcomingExams}</div>
            <p className="text-sm text-muted-foreground">
              Prepare and ace them!
            </p>
          </CardContent>
        </Card>
        <Card className="interactive-card shadow-lg shadow-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Study Hours Logged (Week)</CardTitle>
            <Clock className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold glow-text-primary">{studyHoursLogged} hrs</div>
            <p className="text-sm text-muted-foreground">
              Consistency is key!
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-10 interactive-card p-2 md:p-0">
        <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
          <CardTitle className="font-headline text-3xl glow-text-primary">Quick Access</CardTitle>
          <CardDescription>Jump right into your preparation modules.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 p-4 md:p-6">
          {quickAccessItems.map((item) => (
             <Link href={item.href} key={item.name} className="group">
                <div className="p-4 md:p-6 border-2 border-input bg-card hover:border-primary hover:bg-primary/5 rounded-xl text-center transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-primary/20 flex flex-col items-center justify-center h-full min-h-[150px]">
                    {item.icon}
                    <p className="font-semibold text-lg mt-1 text-foreground group-hover:text-primary transition-colors">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                </div>
            </Link>
          ))}
        </CardContent>
      </Card>

    </div>
  );
}

    

    