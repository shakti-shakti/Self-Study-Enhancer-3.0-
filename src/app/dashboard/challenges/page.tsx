// src/app/dashboard/challenges/page.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Tables, TablesInsert } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Star, Trophy, Zap, Loader2, HelpCircle, Award, Target as TargetIcon, CalendarDays, CheckCircle, Clock } from 'lucide-react';
import { Badge as ShadBadge } from '@/components/ui/badge'; // Renamed to avoid conflict

// Types for local data structure
type Mission = {
  id: string;
  title: string;
  description: string;
  mission_type: 'daily' | 'weekly';
  reward_points: number;
  badge_id_reward?: string;
  target_value: number; // e.g. solve 10 questions, study 2 hours (in minutes)
  current_progress: number; // User's current progress
  status: 'locked' | 'active' | 'completed';
  icon?: React.ElementType;
};

type Badge = {
  id: string;
  name: string;
  description: string;
  icon?: React.ElementType;
  icon_url?: string; // For image-based icons
};

type LeaderboardUser = {
  id: string;
  name: string;
  score: number;
  rank: number;
  avatarUrl?: string;
};

const sampleMissions: Mission[] = [
  { id: 'm1', title: 'NCERT Quick Scan', description: 'Solve 10 NCERT-based questions in 15 mins.', mission_type: 'daily', reward_points: 50, target_value: 10, current_progress: 3, status: 'active', icon: TargetIcon, badge_id_reward: 'b1' },
  { id: 'm2', title: 'Physics Power Hour', description: 'Complete 1 hour of focused Physics study.', mission_type: 'daily', reward_points: 75, target_value: 60, current_progress: 0, status: 'locked', icon: Zap },
  { id: 'm3', title: 'Weekly Quiz Champion', description: 'Score above 80% in 3 quizzes this week.', mission_type: 'weekly', reward_points: 200, target_value: 3, current_progress: 1, status: 'active', icon: Trophy, badge_id_reward: 'b2' },
  { id: 'm4', title: 'Study Streak Keeper', description: 'Log study time for 5 consecutive days.', mission_type: 'weekly', reward_points: 150, target_value: 5, current_progress: 2, status: 'active', icon: CalendarDays },
];

const sampleBadges: Badge[] = [
  { id: 'b1', name: 'NCERT Novice', description: 'Completed your first NCERT mission!', icon: Award },
  { id: 'b2', name: 'Quiz Conqueror', description: 'Dominated multiple quizzes in a week.', icon: ShieldCheck },
  { id: 'b3', name: 'Streak Master', description: 'Maintained a 5-day study streak.', icon: Star, icon_url: 'https://placehold.co/64x64/A758A9/FFFFFF.png?text=S' },
];

const sampleLeaderboard: LeaderboardUser[] = [
  { id: 'u1', name: 'RacerX', score: 1250, rank: 1, avatarUrl: 'https://placehold.co/40x40/559BBA/FFFFFF.png?text=RX' },
  { id: 'u2', name: 'StudyNinja', score: 1100, rank: 2, avatarUrl: 'https://placehold.co/40x40/A758A9/FFFFFF.png?text=SN' },
  { id: 'u3', name: 'AtomSmasher', score: 980, rank: 3, avatarUrl: 'https://placehold.co/40x40/84CC16/FFFFFF.png?text=AS' },
];


export default function ChallengesPage() {
  const [isPending, startTransition] = useTransition();
  const [userMissions, setUserMissions] = useState<Mission[]>(sampleMissions); // Will be fetched from Supabase
  const [userBadges, setUserBadges] = useState<Badge[]>([]); // Will be fetched from Supabase
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(sampleLeaderboard); // Will be fetched

  const { toast } = useToast();
  const supabase = createClient();

  // TODO: Fetch userMissions, userBadges, leaderboard from Supabase
  // useEffect(() => {
  //   const fetchData = async () => {
  //     const { data: { user } } = await supabase.auth.getUser();
  //     if (!user) return;
  //     startTransition(async () => {
  //       // Fetch user_missions and join with missions table
  //       // Fetch user_badges and join with badges table
  //       // Fetch leaderboard_entries
  //     });
  //   };
  //   fetchData();
  // }, []);

  const handleCompleteMission = (missionId: string) => {
    // This would typically involve verifying the mission completion criteria.
    // For now, it's a manual completion for demo purposes.
    startTransition(async () => {
      setUserMissions(prevMissions =>
        prevMissions.map(m =>
          m.id === missionId ? { ...m, status: 'completed', current_progress: m.target_value } : m
        )
      );
      
      const completedMission = userMissions.find(m => m.id === missionId);
      if (completedMission?.badge_id_reward) {
        const badge = sampleBadges.find(b => b.id === completedMission.badge_id_reward);
        if (badge && !userBadges.find(ub => ub.id === badge.id)) {
          setUserBadges(prev => [...prev, badge]);
          toast({
            title: "Badge Unlocked!",
            description: `You've earned the ${badge.name} badge!`,
            className: 'bg-accent/20 border-accent text-accent-foreground glow-text-accent'
          });
        }
      }
      // TODO: Update Supabase: user_missions status, potentially user_badges, leaderboard_entries
      toast({
        title: "Mission Complete!",
        description: `You've completed "${completedMission?.title}" and earned ${completedMission?.reward_points} points!`,
        className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary'
      });
    });
  };
  
  const MissionCard = ({ mission }: { mission: Mission }) => (
    <Card className="interactive-card shadow-lg shadow-primary/10 overflow-hidden relative transition-all duration-300 hover:shadow-primary/20">
      {mission.status === 'completed' && (
        <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full z-10">
          <CheckCircle className="h-5 w-5" />
        </div>
      )}
      <CardHeader className="bg-card-foreground/5 p-4 border-b border-border/20">
        <CardTitle className="font-headline text-xl glow-text-primary flex items-center">
          {mission.icon && <mission.icon className="mr-2 h-6 w-6 text-primary" />}
          {mission.title}
        </CardTitle>
        <ShadBadge variant={mission.mission_type === 'daily' ? 'secondary' : 'outline'} className="absolute top-3 left-3 text-xs">
            {mission.mission_type === 'daily' ? <Clock className="mr-1 h-3 w-3"/> : <CalendarDays className="mr-1 h-3 w-3"/>}
            {mission.mission_type.charAt(0).toUpperCase() + mission.mission_type.slice(1)}
        </ShadBadge>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground">{mission.description}</p>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{mission.current_progress} / {mission.target_value}</span>
          </div>
          <Progress value={(mission.current_progress / mission.target_value) * 100} className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent" />
        </div>
        <p className="text-sm font-semibold text-accent">Reward: {mission.reward_points} Points {mission.badge_id_reward && "+ Badge"}</p>
      </CardContent>
      <CardFooter className="p-4 bg-card-foreground/5 border-t border-border/20">
        {mission.status === 'active' && (
          <Button 
            className="w-full glow-button" 
            onClick={() => handleCompleteMission(mission.id)}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="animate-spin mr-2"/> : <CheckCircle className="mr-2"/>}
            Mark as Complete (Demo)
          </Button>
        )}
        {mission.status === 'locked' && (
          <Button className="w-full" variant="outline" disabled>
            <HelpCircle className="mr-2"/> Locked (Complete other tasks)
          </Button>
        )}
        {mission.status === 'completed' && (
          <p className="text-green-400 font-semibold w-full text-center flex items-center justify-center">
            <Trophy className="mr-2"/> Mission Accomplished!
          </p>
        )}
      </CardFooter>
    </Card>
  );

  const BadgeCard = ({ badge }: { badge: Badge }) => (
    <Card className="interactive-card shadow-md shadow-accent/10 text-center p-4 flex flex-col items-center justify-center aspect-square">
      {badge.icon ? <badge.icon className="h-12 w-12 text-accent mb-2"/> : 
      badge.icon_url ? <img src={badge.icon_url} alt={badge.name} className="h-12 w-12 mb-2 rounded-full" data-ai-hint="achievement badge icon"/> : <Award className="h-12 w-12 text-accent mb-2"/> }
      <h3 className="font-semibold text-lg glow-text-accent">{badge.name}</h3>
      <p className="text-xs text-muted-foreground">{badge.description}</p>
    </Card>
  );

  return (
    <div className="space-y-10">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Trophy className="mr-4 h-10 w-10" /> Challenges &amp; Leaderboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Test your mettle! Complete missions, earn badges, and climb the ranks.
        </p>
      </header>

      <Tabs defaultValue="missions" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto h-12 bg-primary/5 border border-primary/20">
          <TabsTrigger value="missions" className="text-base h-full data-[state=active]:bg-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">Missions</TabsTrigger>
          <TabsTrigger value="badges" className="text-base h-full data-[state=active]:bg-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">Badges</TabsTrigger>
          <TabsTrigger value="leaderboard" className="text-base h-full data-[state=active]:bg-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="missions" className="mt-8">
          <div className="mb-8">
            <h2 className="text-2xl font-headline font-semibold mb-2 glow-text-accent text-center">Daily Missions</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userMissions.filter(m => m.mission_type === 'daily').map(mission => <MissionCard key={mission.id} mission={mission} />)}
              {userMissions.filter(m => m.mission_type === 'daily').length === 0 && <p className="text-muted-foreground col-span-full text-center py-4">No daily missions currently active. Check back soon!</p>}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-headline font-semibold mb-2 glow-text-accent text-center">Weekly Missions</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userMissions.filter(m => m.mission_type === 'weekly').map(mission => <MissionCard key={mission.id} mission={mission} />)}
              {userMissions.filter(m => m.mission_type === 'weekly').length === 0 && <p className="text-muted-foreground col-span-full text-center py-4">No weekly missions currently active. Check back soon!</p>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="badges" className="mt-8">
           <h2 className="text-2xl font-headline font-semibold mb-4 glow-text-accent text-center">Your Earned Badges</h2>
           {userBadges.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {userBadges.map(badge => <BadgeCard key={badge.id} badge={badge} />)}
            </div>
           ) : (
            <p className="text-muted-foreground text-center py-10">You haven't earned any badges yet. Complete missions to unlock them!</p>
           )}
           <h2 className="text-2xl font-headline font-semibold mt-10 mb-4 glow-text-accent text-center">Available Badges</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 opacity-60">
                {sampleBadges.filter(b => !userBadges.find(ub => ub.id === b.id)).map(badge => <BadgeCard key={badge.id} badge={badge} />)}
            </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-8">
          <Card className="max-w-md mx-auto interactive-card shadow-xl shadow-primary/10">
            <CardHeader>
              <CardTitle className="font-headline text-2xl glow-text-primary text-center">Top Achievers</CardTitle>
              <CardDescription className="text-center">See who's leading the charge!</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {leaderboard.map(user => (
                  <li key={user.id} className="flex items-center justify-between p-3 bg-card-foreground/5 rounded-lg border border-border/20 hover:bg-primary/10 transition-colors">
                    <div className="flex items-center">
                      <span className={`font-bold text-lg mr-3 w-6 text-center ${user.rank === 1 ? 'text-yellow-400' : user.rank === 2 ? 'text-gray-400' : user.rank === 3 ? 'text-orange-400' : 'text-primary'}`}>#{user.rank}</span>
                      <img src={user.avatarUrl || `https://placehold.co/40x40/777/FFF.png?text=${user.name.charAt(0)}`} alt={user.name} className="w-8 h-8 rounded-full mr-3" data-ai-hint="avatar user"/>
                      <span className="font-medium text-foreground">{user.name}</span>
                    </div>
                    <span className="font-bold text-lg text-accent">{user.score} PTS</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    