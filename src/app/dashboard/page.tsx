// src/app/dashboard/page.tsx
// VERY SIMPLIFIED VERSION FOR INITIAL TESTING AFTER REBUILD
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { generateSyllabusFact } from '@/ai/flows/random-fact-generator';
import { Lightbulb } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let randomFact = { fact: "Loading your daily fact...", source_hint: "" };
  try {
    randomFact = await generateSyllabusFact({ class_level: "11/12" });
  } catch (error) {
    console.error("Error fetching random fact for dashboard:", error);
    randomFact = { fact: "Could not load a fact. Check your AI flow setup.", source_hint: "Error" };
  }


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
          <p className="text-base md:text-lg mb-6">
            You are successfully logged in and viewing the main dashboard.
          </p>
          <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg shadow-inner">
            <div className="flex items-start">
              <Lightbulb className="h-8 w-8 text-primary mr-3 mt-1 shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-primary mb-1">Syllabus Spark:</h3>
                <p className="text-foreground">{randomFact.fact}</p>
                {randomFact.source_hint && randomFact.source_hint !== "Error" && (
                  <p className="text-xs text-muted-foreground mt-1">Hint: {randomFact.source_hint}</p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="glow-button text-base py-6"><Link href="/dashboard/planner">Access Planner</Link></Button>
            <Button asChild variant="outline" className="glow-button text-base py-6"><Link href="/dashboard/quizzes">Take a Quiz</Link></Button>
            <Button asChild variant="outline" className="glow-button text-base py-6"><Link href="/dashboard/ai-study-assistant">AI Study Assistant</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
