import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Placeholder data for dashboard items
  const tasksToday = 5;
  const upcomingExams = 2;
  const studyHoursLogged = 12.5;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">Welcome, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'}!</h1>
        <p className="text-muted-foreground">Here's your NEET Prep+ overview for today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Today</CardTitle>
            <CheckCircle className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksToday}</div>
            <p className="text-xs text-muted-foreground">
              Keep up the great work!
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-5 w-5 text-accent">
              <path d="M12 22V18M12 6V2M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M7.76 16.24L4.93 19.07M19.07 4.93L16.24 7.76" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingExams}</div>
            <p className="text-xs text-muted-foreground">
              Prepare and ace them!
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Hours Logged (Week)</CardTitle>
            <Clock className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studyHoursLogged} hrs</div>
            <p className="text-xs text-muted-foreground">
              Consistency is key!
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="font-headline">Quick Access</CardTitle>
          <CardDescription>Jump right into your preparation.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {/* Placeholder for quick access links - to be implemented later */}
          <div className="p-4 border rounded-lg text-center hover:shadow-md transition-shadow cursor-pointer">
            <p className="font-medium">Planner</p>
          </div>
          <div className="p-4 border rounded-lg text-center hover:shadow-md transition-shadow cursor-pointer">
            <p className="font-medium">Quizzes</p>
          </div>
          <div className="p-4 border rounded-lg text-center hover:shadow-md transition-shadow cursor-pointer">
            <p className="font-medium">Study Rooms</p>
          </div>
           <div className="p-4 border rounded-lg text-center hover:shadow-md transition-shadow cursor-pointer">
            <p className="font-medium">NCERT Explorer</p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
