// src/app/dashboard/achievements/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, ShieldCheck, Star, Trophy, Zap, Lock, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress'; // If showing progress towards an achievement
// import { createClient } from '@/lib/supabase/client'; // For fetching actual user achievements
// import type { Tables } from '@/lib/database.types';

// Placeholder data structure for achievements
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  isUnlocked: boolean; // Conceptual: replace with actual user data
  progress?: number; // Optional: 0-100 for progress bar
  xpReward?: number;
  badgeImageUrl?: string; // For specific badge images
}

const sampleAchievements: Achievement[] = [
  { id: 'quiz_master_1', title: 'Quiz Novice', description: 'Complete your first quiz.', icon: Star, isUnlocked: true, xpReward: 50 },
  { id: 'quiz_master_2', title: 'Quiz Adept', description: 'Score 80%+ on 3 quizzes in a row.', icon: ShieldCheck, isUnlocked: false, progress: 33, xpReward: 100 },
  { id: 'study_streak_7', title: 'Weekly Warrior', description: 'Maintain a 7-day study streak.', icon: Zap, isUnlocked: false, progress: 60, xpReward: 150 },
  { id: 'physics_champ', title: 'Physics Phenom', description: 'Complete all Physics chapter challenges.', icon: Zap, isUnlocked: true, badgeImageUrl: 'https://placehold.co/64x64/FFFF00/000000.png?text=P⚡' , dataAiHint: 'physics award'},
  { id: 'chemistry_guru', title: 'Chemistry Catalyst', description: 'Unlock 10 Chemistry concept notes.', icon: Trophy, isUnlocked: false, progress: 20, badgeImageUrl: 'https://placehold.co/64x64/00FFFF/000000.png?text=C⚛️', dataAiHint: 'chemistry award' },
  { id: 'biology_expert', title: 'Biology Buff', description: 'Identify 50 specimens in Botany & Zoology.', icon: Award, isUnlocked: false, progress: 0, badgeImageUrl: 'https://placehold.co/64x64/00FF00/000000.png?text=B🌿', dataAiHint: 'biology award' },
  { id: 'perfect_score', title: 'Flawless Victory', description: 'Get a perfect score on any hard quiz.', icon: Star, isUnlocked: false, xpReward: 200 },
  { id: 'ai_ally', title: 'AI Collaborator', description: 'Use the AI Study Assistant 20 times.', icon: ShieldCheck, isUnlocked: true, xpReward: 75 },
];


export default function AchievementsPage() {
  // const [userAchievements, setUserAchievements] = useState<Achievement[]>(sampleAchievements); // Load actual user achievements later
  // const supabase = createClient();

  // useEffect(() => {
  //   // Fetch actual user achievements and merge with sample/default list
  //   // For now, we use the sampleAchievements directly
  // }, []);

  return (
    <div className="space-y-10">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Trophy className="mr-4 h-10 w-10 text-primary" /> Achievements & Trophies
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Track your accomplishments and showcase your dedication!
        </p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sampleAchievements.map(ach => (
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
                  {ach.xpReward && <span className="ml-auto text-xs font-medium text-accent/80">+{ach.xpReward} XP</span>}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center text-muted-foreground">
                     <Lock className="mr-2 h-5 w-5" /> Locked
                     {ach.xpReward && <span className="ml-auto text-xs font-medium text-accent/80">+{ach.xpReward} XP</span>}
                  </div>
                  {ach.progress !== undefined && (
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
        Note: This is a placeholder UI. Achievement unlocking logic and XP system to be implemented.
      </p>
    </div>
  );
}
