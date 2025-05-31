
// src/app/dashboard/page.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { generateSyllabusFact } from '@/ai/flows/random-fact-generator';
import { generateDailyChallenge, type GenerateDailyChallengeOutput } from '@/ai/flows/daily-challenge-flow';
import { generateDailyMotivation, type GenerateDailyMotivationOutput } from '@/ai/flows/daily-motivation-flow';
import { Lightbulb, MessageSquare, TrendingUp, ChevronRight, CalendarDays, Edit, Award, Zap } from 'lucide-react';
import type { QuizAttemptWithQuizTopic, ChatSessionPreview, Tables } from '@/lib/database.types';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import ClockWidget from '@/components/dashboard/ClockWidget';
import CountdownWidget from '@/components/dashboard/CountdownWidget';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let dailyMotivation: GenerateDailyMotivationOutput = { quote: "Loading your daily motivation..." };
  let dailyChallenge: GenerateDailyChallengeOutput = { 
    challengeTitle: "Loading Daily Challenge...", 
    challengeDescription: "Stay tuned for today's mission!", 
    subjectHint: "" 
  };

  try {
    dailyMotivation = await generateDailyMotivation({});
  } catch (error: any) {
    console.error("[ Server ] Error fetching daily motivation for dashboard:", error.message || JSON.stringify(error));
    dailyMotivation = { quote: "Could not load daily motivation. Keep pushing towards your goals!" };
  }

  try {
    dailyChallenge = await generateDailyChallenge({}); 
  } catch (error: any) {
    console.error("[ Server ] Error fetching daily challenge:", error.message || JSON.stringify(error));
    dailyChallenge = { 
      challengeTitle: "Challenge Unreachable", 
      challengeDescription: "Could not load today's challenge. Your mission, should you choose to accept it, is to study hard!", 
      subjectHint: "Persistence" 
    };
  }


  let recentQuizAttempts: QuizAttemptWithQuizTopic[] = [];
  let profileData: Tables<'profiles'> | null = null;

  if (user) {
    const { data: attemptsData, error: attemptsError } = await supabase
      .from('quiz_attempts')
      .select('id, score, total_questions, completed_at, created_at, quizzes!inner(*)')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(3);
    if (attemptsError) {
      console.error("[ Server ] Error fetching recent quiz attempts:", attemptsError.message);
    } else {
      recentQuizAttempts = (attemptsData as any[] || []).map(attempt => ({
        ...attempt,
        quizzes: attempt.quizzes ? { 
            topic: attempt.quizzes.topic || null, 
            class_level: attempt.quizzes.class_level || null, 
            subject: attempt.quizzes.subject || null
        } : null
      })) as QuizAttemptWithQuizTopic[];
    }

    const { data: fetchedProfileData, error: profileError } = await supabase
      .from('profiles')
      .select('custom_countdown_event_name, custom_countdown_target_date')
      .eq('id', user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') { 
      console.error("[ Server ] Error fetching profile for dashboard:", profileError.message);
    } else {
      profileData = fetchedProfileData;
    }
  }
  
  let recentChatSessions: ChatSessionPreview[] = [];
    if (user) {
    const { data: rawMessages, error: messagesError } = await supabase
      .from('study_assistant_logs')
      .select('session_id, content, created_at, user_id, role')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (messagesError) {
      console.error("[ Server ] Error fetching recent chat messages for dashboard:", messagesError.message);
    } else if (rawMessages) {
      const sessionsMap = new Map<string, ChatSessionPreview>();
      for (let i = rawMessages.length - 1; i >= 0; i--) {
        const msg = rawMessages[i];
        if (msg.role === 'user' && !sessionsMap.has(msg.session_id) && sessionsMap.size < 3) {
          sessionsMap.set(msg.session_id, {
            session_id: msg.session_id,
            first_message_preview: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
            last_message_at: msg.created_at,
            user_id: msg.user_id,
          });
        }
        if (sessionsMap.has(msg.session_id)) {
           const existingSession = sessionsMap.get(msg.session_id)!;
           if (new Date(msg.created_at) > new Date(existingSession.last_message_at)) {
               sessionsMap.set(msg.session_id, {...existingSession, last_message_at: msg.created_at});
           }
        }
      }
      recentChatSessions = Array.from(sessionsMap.values())
                                .sort((a,b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
    }
  }

  const currentDate = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <div className="space-y-8">
      <Card className="w-full p-6 md:p-8 interactive-card shadow-2xl shadow-primary/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl md:text-4xl font-headline font-bold glow-text-primary mb-2">
            Welcome Back, Aspirant!
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            This is your command center for NEET conquest.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-muted/30 border-border/50 shadow-inner">
              <CardHeader>
                <CardTitle className="text-xl font-headline glow-text-accent flex items-center"><CalendarDays className="mr-2"/>Today's Date</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-foreground">{currentDate}</p>
                <ClockWidget />
              </CardContent>
            </Card>
            {profileData?.custom_countdown_event_name && profileData?.custom_countdown_target_date && (
              <Card className="bg-muted/30 border-border/50 shadow-inner">
                <CardHeader>
                  <CardTitle className="text-xl font-headline glow-text-accent flex items-center justify-between">
                    <span>{profileData.custom_countdown_event_name}</span>
                     <Button variant="ghost" size="icon" asChild className="text-primary hover:text-primary/80 -mr-2 -mt-2">
                        <Link href="/dashboard/profile"><Edit className="h-4 w-4"/></Link>
                     </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CountdownWidget 
                    targetDate={profileData.custom_countdown_target_date} 
                    eventName={profileData.custom_countdown_event_name} 
                  />
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="bg-accent/10 border border-accent/30 p-4 rounded-lg shadow-inner mb-6">
            <div className="flex items-start">
              <Award className="h-8 w-8 text-accent mr-3 mt-1 shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-accent mb-1">AI Daily Challenge: {dailyChallenge.challengeTitle}</h3>
                <p className="text-foreground">{dailyChallenge.challengeDescription}</p>
                {dailyChallenge.subjectHint && (
                  <p className="text-xs text-muted-foreground mt-1">Subject Hint: {dailyChallenge.subjectHint}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="bg-primary/10 border border-primary/30 p-4 rounded-lg shadow-inner mb-8">
            <div className="flex items-start">
              <Lightbulb className="h-8 w-8 text-primary mr-3 mt-1 shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-primary mb-1">Daily Motivation:</h3>
                <p className="text-foreground italic">"{dailyMotivation.quote}"</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="glow-button text-base py-6"><Link href="/dashboard/planner">Access Planner</Link></Button>
            <Button asChild variant="outline" className="glow-button text-base py-6"><Link href="/dashboard/quizzes">Take a Quiz</Link></Button>
            <Button asChild variant="outline" className="glow-button text-base py-6"><Link href="/dashboard/ai-study-assistant">AI Study Assistant</Link></Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="interactive-card shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl glow-text-accent flex items-center"><TrendingUp className="mr-2"/>Recent Quiz Scores</CardTitle>
            <CardDescription>A quick look at your latest quiz performances.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentQuizAttempts.length > 0 ? (
              <ul className="space-y-3">
                {recentQuizAttempts.map(attempt => (
                  <li key={attempt.id} className="p-3 bg-card-foreground/5 rounded-md border border-border/30">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground truncate pr-2">
                        {attempt.quizzes?.topic || attempt.quizzes?.subject || 'General Quiz'}
                      </span>
                      <span className="font-bold text-primary">{attempt.score}/{attempt.total_questions}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{format(parseISO(attempt.created_at), "MMM d, yyyy - p")}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent quiz attempts found. Time to test your knowledge!</p>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="link" asChild className="text-primary hover:text-accent"><Link href="/dashboard/progress">View Full Progress <ChevronRight className="ml-1 h-4 w-4"/></Link></Button>
          </CardFooter>
        </Card>

        <Card className="interactive-card shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl glow-text-accent flex items-center"><MessageSquare className="mr-2"/>Recent AI Chats</CardTitle>
            <CardDescription>Continue your conversations with the AI Study Assistant.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentChatSessions.length > 0 ? (
              <ul className="space-y-3">
                {recentChatSessions.map(session => (
                  <li key={session.session_id} className="p-3 bg-card-foreground/5 rounded-md border border-border/30 hover:bg-accent/10 transition-colors">
                    <Link href={`/dashboard/ai-study-assistant?session_id=${session.session_id}`}>
                      <p className="font-medium text-foreground truncate">{session.first_message_preview}</p>
                      <p className="text-xs text-muted-foreground">
                        Last message: {formatDistanceToNow(parseISO(session.last_message_at), { addSuffix: true })}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent AI chat sessions. Ask the AI for help!</p>
            )}
          </CardContent>
           <CardFooter>
            <Button variant="link" asChild className="text-primary hover:text-accent"><Link href="/dashboard/ai-study-assistant">Go to AI Assistant <ChevronRight className="ml-1 h-4 w-4"/></Link></Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

