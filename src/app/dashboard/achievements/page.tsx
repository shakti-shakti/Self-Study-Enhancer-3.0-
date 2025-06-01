
// src/app/dashboard/achievements/page.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, ShieldCheck, Star, Trophy, Zap, Lock, CheckCircle, Target as TargetIcon, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import * as apiClient from '@/lib/apiClient'; // Import the API client
import { useToast } from '@/hooks/use-toast';

// Placeholder data structure for achievements
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  isUnlocked: boolean;
  progress?: number; // Optional: 0-100 for progress bar
  xpValue?: number; // Conceptual: XP awarded or XP threshold for this achievement
  badgeImageUrl?: string;
  dataAiHint?: string;
}

// Updated to include achievement IDs used in apiClient and ChallengesPage
const initialSampleAchievements: Achievement[] = [
  { id: 'ach_first_mission', title: 'Mission Accomplished!', description: 'Complete your first mission from the Challenges page.', icon: TargetIcon, isUnlocked: false, xpValue: 75, dataAiHint: 'target mission complete' },
  { id: 'ach_xp_100', title: 'XP Centurion', description: 'Reach 100 XP!', icon: Star, isUnlocked: false, xpValue: 100, dataAiHint: 'star level up' },
  { id: 'quiz_master_1', title: 'Quiz Novice', description: 'Complete your first quiz.', icon: Award, isUnlocked: false, xpValue: 50, dataAiHint: 'star quiz' },
  { id: 'quiz_master_2', title: 'Quiz Adept', description: 'Score 80%+ on 3 quizzes in a row.', icon: ShieldCheck, isUnlocked: false, progress: 33, xpValue: 100, dataAiHint: 'shield check' },
  { id: 'study_streak_7', title: 'Weekly Warrior', description: 'Maintain a 7-day study streak.', icon: Zap, isUnlocked: false, progress: 60, xpValue: 150, dataAiHint: 'zap lightning' },
  { id: 'physics_champ', title: 'Physics Phenom', description: 'Complete all Physics chapter challenges.', icon: Trophy, isUnlocked: false, badgeImageUrl: 'https://placehold.co/64x64/FFFF00/000000.png?text=P⚡' , dataAiHint: 'physics award'},
  { id: 'chemistry_guru', title: 'Chemistry Catalyst', description: 'Unlock 10 Chemistry concept notes.', icon: Trophy, isUnlocked: false, progress: 20, badgeImageUrl: 'https://placehold.co/64x64/00FFFF/000000.png?text=C⚛️', dataAiHint: 'chemistry award' },
  { id: 'biology_expert', title: 'Biology Buff', description: 'Identify 50 specimens in Botany & Zoology.', icon: Award, isUnlocked: false, progress: 0, badgeImageUrl: 'https://placehold.co/64x64/00FF00/000000.png?text=B🌿', dataAiHint: 'biology award' },
  { id: 'perfect_score', title: 'Flawless Victory', description: 'Get a perfect score on any hard quiz.', icon: Star, isUnlocked: false, xpValue: 200, dataAiHint: 'trophy star' },
  { id: 'ai_ally', title: 'AI Collaborator', description: 'Use the AI Study Assistant 20 times.', icon: ShieldCheck, isUnlocked: false, xpValue: 75, dataAiHint: 'robot handshake' },
];


export default function AchievementsPage() {
  const [userAchievements, setUserAchievements] = useState<Achievement[]>(initialSampleAchievements);
  const [isLoading, startLoadingTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    startLoadingTransition(async () => {
      try {
        const unlockedIds = await apiClient.fetchUnlockedAchievements();
        setUserAchievements(prevAchievements =>
          prevAchievements.map(ach => ({
            ...ach,
            isUnlocked: unlockedIds.includes(ach.id),
          }))
        );
      } catch (error) {
        console.error("Error fetching achievements status:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load achievement statuses."});
      }
    });
  }, [toast]);

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-xl text-muted-foreground">Loading Achievements...</p>
        </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Trophy className="mr-4 h-10 w-10 text-primary" /> Achievements & Trophies
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Track your accomplishments and showcase your dedication! (Unlock system is conceptual for demo)
        </p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userAchievements.map(ach => (
          <Card 
            key={ach.id} 
            className={`interactive-card shadow-lg ${ach.isUnlocked ? 'border-green-500/50 bg-green-500/5 shadow-green-500/20' : 'border-border/30 bg-card/70 opacity-80 hover:opacity-100'}`}
          >
            <CardHeader className="flex flex-row items-center space-x-4 p-4">
              {ach.badgeImageUrl ? (
                <img src={ach.badgeImageUrl} alt={ach.title} className="w-12 h-12 rounded-full border-2 border-primary" data-ai-hint={ach.dataAiHint || 'achievement badge'} />
              ) : (
                <ach.icon className={`h-10 w-10 ${ach.isUnlocked ? 'text-green-400' : 'text-muted-foreground'}`} />
              )}
              <div>
                <CardTitle className={`text-xl font-semibold ${ach.isUnlocked ? 'glow-text-primary' : 'text-muted-foreground'}`}>
                  {ach.title}
                </CardTitle>
                <CardDescription className="text-sm">{ach.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {ach.isUnlocked ? (
                <div className="flex items-center text-green-400">
                  <CheckCircle className="mr-2 h-5 w-5" /> Unlocked!
                  {ach.xpValue && <span className="ml-auto text-xs font-medium text-accent/80">Value: {ach.xpValue} XP</span>}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center text-muted-foreground">
                     <Lock className="mr-2 h-5 w-5" /> Locked
                     {ach.xpValue && <span className="ml-auto text-xs font-medium text-accent/80">Value: {ach.xpValue} XP</span>}
                  </div>
                  {ach.progress !== undefined && !ach.isUnlocked && (
                    <>
                      <Progress value={ach.progress} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent" />
                      <p className="text-xs text-right text-muted-foreground">{ach.progress}% complete</p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
       <p className="text-center text-muted-foreground mt-8 text-sm">
        Note: Achievement unlocking logic and XP system are simulated on the client-side for demo. Full backend integration is required.
      </p>
    </div>
  );
}
