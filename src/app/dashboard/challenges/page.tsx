
// src/app/dashboard/challenges/page.tsx
'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Tables, TablesInsert, UserGameProgress, GameSpecificState } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Star, Trophy, Zap, Loader2, HelpCircle, Award, Target as TargetIcon, CalendarDays, CheckCircle, Clock, Coins } from 'lucide-react';
import { Badge as ShadBadge } from '@/components/ui/badge'; 
import Image from 'next/image';
import * as apiClient from '@/lib/apiClient';

type Mission = Tables<'missions'> & {
  current_progress: number; 
  status: "locked" | "active" | "completed" | "failed"; 
  icon?: React.ElementType; 
};

type Badge = Tables<'badges'> & {
  icon?: React.ElementType;
};

type LeaderboardUser = Tables<'leaderboard_entries'> & {
  rank?: number; 
  profiles: { full_name: string | null; username: string | null; avatar_url: string | null } | null;
};


export default function ChallengesPage() {
  const [isPending, startTransition] = useTransition();
  const [userId, setUserId] = useState<string|null>(null);
  const [userMissions, setUserMissions] = useState<Mission[]>([]);
  const [userBadges, setUserBadges] = useState<Badge[]>([]);
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);


  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getCurrentUser();
  }, [supabase]);

  const fetchChallengesData = useCallback(async () => {
    if (!userId) {
        setIsLoadingData(false);
        return;
    }
    
    setIsLoadingData(true);
    startTransition(async () => {
        try {
            const { data: missionsData, error: missionsError } = await supabase
                .from('missions')
                .select('*')
                .eq('is_active', true);
            if (missionsError) throw missionsError;

            const { data: userMissionsData, error: userMissionsError } = await supabase
                .from('user_missions')
                .select('*')
                .eq('user_id', userId);
            if (userMissionsError) throw userMissionsError;

            if (missionsData) {
                const combinedMissions = missionsData.map(mission => {
                    const userProgress = userMissionsData?.find(um => um.mission_id === mission.id);
                    let iconComponent = TargetIcon; 
                    if (mission.title.toLowerCase().includes("physics")) iconComponent = Zap;
                    else if (mission.title.toLowerCase().includes("quiz")) iconComponent = Trophy;
                    else if (mission.title.toLowerCase().includes("streak")) iconComponent = CalendarDays;
                    return { ...mission, icon: iconComponent, current_progress: userProgress?.current_progress || 0, status: userProgress?.status || 'locked' };
                });
                setUserMissions(combinedMissions);
            }

            const { data: allBadgesData, error: allBadgesError } = await supabase.from('badges').select('*');
            if (allBadgesError) throw allBadgesError;
            
            const { data: earnedUserBadgesData, error: userBadgesDbError } = await supabase
                .from('user_badges')
                .select('*, badges(*)')
                .eq('user_id', userId);
            if (userBadgesDbError) throw userBadgesDbError;
            
            if (earnedUserBadgesData && allBadgesData) {
                const mappedUserBadges = earnedUserBadgesData.map(ub => {
                    const badgeDetails = ub.badges as Badge; 
                    let iconComp = Award; 
                    if(badgeDetails?.icon_name_or_url?.toLowerCase().includes("ncert")) iconComp = Award;
                    else if(badgeDetails?.icon_name_or_url?.toLowerCase().includes("quiz")) iconComp = ShieldCheck;
                    else if(badgeDetails?.icon_name_or_url?.toLowerCase().includes("streak")) iconComp = Star;
                    return { ...badgeDetails, icon: iconComp };
                }).filter(b => b.id); 
                setUserBadges(mappedUserBadges);
                const available = allBadgesData.map(badge => {
                    let iconComp = Award;
                    if(badge.icon_name_or_url?.toLowerCase().includes("ncert")) iconComp = Award;
                    else if(badge.icon_name_or_url?.toLowerCase().includes("quiz")) iconComp = ShieldCheck;
                    else if(badge.icon_name_or_url?.toLowerCase().includes("streak")) iconComp = Star;
                    return {...badge, icon: iconComp } as Badge;
                });
                setAvailableBadges(available.filter(ab => !mappedUserBadges.find(ub => ub.id === ab.id)));
            }

            const { data: leaderboardData, error: leaderboardError } = await supabase
                .from('leaderboard_entries')
                .select('*, profiles!user_id(full_name, username, avatar_url)')
                .eq('period', 'all_time')
                .order('score', { ascending: false })
                .limit(10);
            if (leaderboardError) throw leaderboardError;
            const processedLeaderboard = (leaderboardData as LeaderboardUser[] || []).map((entry, index) => ({...entry, rank: index + 1}));
            setLeaderboard(processedLeaderboard);

        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Error fetching challenges data', description: error.message });
             console.error("Challenges data fetch error:", error);
        } finally {
            setIsLoadingData(false);
        }
    });
  }, [userId, supabase, toast]);

  useEffect(() => {
    fetchChallengesData();
  }, [fetchChallengesData]);


  const handleCompleteMission = async (mission: Mission) => {
    if(!userId) return;
    if (mission.status !== 'active' || mission.current_progress < mission.target_value) {
        toast({title: "Mission Requirement Not Met", description: "This mission is not yet ready to be claimed or is not active."});
        return;
    }

    startTransition(async () => {
        const { error: updateError } = await supabase
            .from('user_missions')
            .update({ status: 'completed', current_progress: mission.target_value, completed_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('mission_id', mission.id);

        if (updateError) {
            toast({ variant: 'destructive', title: "Error completing mission", description: updateError.message });
            return;
        }
        
        // Award XP and Coins using apiClient
        await apiClient.addUserXP(mission.reward_points); // Assuming reward_points also contribute to XP
        const currentCoins = await apiClient.fetchUserFocusCoins();
        await apiClient.updateUserFocusCoins(currentCoins + (mission.reward_points / 2)); // Example: coins are half of XP

        // Optionally, if your RPC also updates profile XP, you might not need separate addUserXP call
        // or adjust the RPC to only update leaderboard score.
        // For now, let's call the RPC primarily for leaderboard score update:
        const { error: scoreError } = await supabase.rpc('increment_leaderboard_score', { 
            p_user_id: userId, 
            p_score_increment: mission.reward_points, 
            p_period: 'all_time' 
        });
        if (scoreError) {
          console.error("Error updating leaderboard score via RPC:", scoreError);
          toast({ variant: "destructive", title: "Leaderboard Score Error", description: "Could not update leaderboard score. The RPC 'increment_leaderboard_score' might not be set up or there was an issue.", duration: 7000 });
        }

        if (mission.badge_id_reward) {
            const { error: badgeError } = await supabase
                .from('user_badges')
                .insert({ user_id: userId, badge_id: mission.badge_id_reward });
            
            if (badgeError && badgeError.code !== '23505') { 
                toast({ variant: 'destructive', title: "Error granting badge", description: badgeError.message });
            } else if (!badgeError) {
                const awardedBadge = availableBadges.find(b => b.id === mission.badge_id_reward) || userBadges.find(b => b.id === mission.badge_id_reward);
                 toast({ title: "Badge Unlocked!", description: `You've earned the ${awardedBadge?.name || 'new'} badge!`, className: 'bg-accent/20 border-accent text-accent-foreground glow-text-accent'});
                 await apiClient.unlockAchievement(mission.badge_id_reward); // Also mark in general achievements if applicable
            }
        }
        
        const activityLog: TablesInsert<'activity_logs'> = {
          user_id: userId, activity_type: 'mission_completed',
          description: `Completed mission: "${mission.title}" (+${mission.reward_points} XP, +${mission.reward_points / 2} Coins)`,
          details: { mission_id: mission.id, points: mission.reward_points, badge: mission.badge_id_reward }
        };
        await supabase.from('activity_logs').insert(activityLog);

        toast({ title: "Mission Complete!", description: `You've completed "${mission.title}" and earned rewards!`, className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary'});
        
        // Unlock general achievement for first mission
        if(mission.id === 'mission_example_1' || userMissions.filter(m=>m.status==='completed').length === 0) { // Assuming a specific ID or first completion
            await apiClient.unlockAchievement('ach_first_mission');
        }
        await fetchChallengesData(); // Refetch all data
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
        <p className="text-sm text-muted-foreground min-h-[40px]">{mission.description}</p>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{mission.current_progress} / {mission.target_value}</span>
          </div>
          <Progress value={(mission.current_progress / mission.target_value) * 100} className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent" />
        </div>
        <p className="text-sm font-semibold text-accent">Reward: {mission.reward_points} XP & {Math.floor(mission.reward_points/2)} Coins {mission.badge_id_reward && "+ Badge"}</p>
      </CardContent>
      <CardFooter className="p-4 bg-card-foreground/5 border-t border-border/20">
        {mission.status === 'active' && (
          <Button 
            className="w-full glow-button" 
            onClick={() => handleCompleteMission(mission)}
            disabled={isPending || mission.current_progress < mission.target_value} 
          >
            {isPending ? <Loader2 className="animate-spin mr-2"/> : <CheckCircle className="mr-2"/>}
            {mission.current_progress >= mission.target_value ? 'Claim Reward' : 'Complete Mission'}
          </Button>
        )}
        {mission.status === 'locked' && ( <Button className="w-full" variant="outline" disabled> <HelpCircle className="mr-2"/> Locked </Button> )}
        {mission.status === 'completed' && ( <p className="text-green-400 font-semibold w-full text-center flex items-center justify-center"> <Trophy className="mr-2"/> Mission Accomplished! </p> )}
      </CardFooter>
    </Card>
  );

  const BadgeCard = ({ badge }: { badge: Badge }) => (
    <Card className="interactive-card shadow-md shadow-accent/10 text-center p-4 flex flex-col items-center justify-center aspect-square">
      {badge.icon ? <badge.icon className="h-12 w-12 text-accent mb-2"/> : 
      badge.icon_name_or_url && badge.icon_name_or_url.startsWith('http') ? 
        <Image src={badge.icon_name_or_url} alt={badge.name} width={48} height={48} className="mb-2 rounded-full" data-ai-hint="badge icon"/> : 
        <Award className="h-12 w-12 text-accent mb-2"/> }
      <h3 className="font-semibold text-lg glow-text-accent">{badge.name}</h3>
      <p className="text-xs text-muted-foreground">{badge.description}</p>
    </Card>
  );
  
  if (isLoadingData) {
     return <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /><p className="ml-4 text-lg text-muted-foreground">Loading Challenges Data...</p></div>;
  }

  return (
    <div className="space-y-10 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Trophy className="mr-4 h-10 w-10" /> Challenges &amp; Leaderboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto"> Test your mettle! Complete missions, earn badges, and climb the ranks. </p>
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
            {(!isPending && userMissions.filter(m => m.mission_type === 'daily').length === 0) && ( <p className="text-muted-foreground col-span-full text-center py-4">No daily missions currently active. Check back soon!</p> )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userMissions.filter(m => m.mission_type === 'daily').map(mission => <MissionCard key={mission.id} mission={mission} />)}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-headline font-semibold mb-2 glow-text-accent text-center">Weekly Missions</h2>
            {(!isPending && userMissions.filter(m => m.mission_type === 'weekly').length === 0) && ( <p className="text-muted-foreground col-span-full text-center py-4">No weekly missions currently active. Check back soon!</p> )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userMissions.filter(m => m.mission_type === 'weekly').map(mission => <MissionCard key={mission.id} mission={mission} />)}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="badges" className="mt-8">
           <h2 className="text-2xl font-headline font-semibold mb-4 glow-text-accent text-center">Your Earned Badges</h2>
           {userBadges.length > 0 ? ( <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"> {userBadges.map(badge => <BadgeCard key={badge.id} badge={badge} />)} </div>
           ) : ( <p className="text-muted-foreground text-center py-10">You haven't earned any badges yet. Complete missions to unlock them!</p> )}
           <h2 className="text-2xl font-headline font-semibold mt-10 mb-4 glow-text-accent text-center">Available Badges to Earn</h2>
            {availableBadges.length > 0 ? ( <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 opacity-60"> {availableBadges.map(badge => <BadgeCard key={badge.id} badge={badge} />)} </div>
            ) : ( <p className="text-muted-foreground text-center py-10">All available badges have been earned or none are defined!</p> )}
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-8">
          <Card className="max-w-lg mx-auto interactive-card shadow-xl shadow-primary/10">
            <CardHeader>
              <CardTitle className="font-headline text-2xl glow-text-primary text-center">Top Achievers (All Time)</CardTitle>
              <CardDescription className="text-center">See who's leading the charge!</CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length > 0 ? (
                <ul className="space-y-3">
                    {leaderboard.map(user => (
                    <li key={user.id} className="flex items-center justify-between p-3 bg-card-foreground/5 rounded-lg border border-border/20 hover:bg-primary/10 transition-colors">
                        <div className="flex items-center">
                        <span className={`font-bold text-lg mr-3 w-6 text-center ${user.rank === 1 ? 'text-yellow-400' : user.rank === 2 ? 'text-gray-400' : user.rank === 3 ? 'text-orange-400' : 'text-primary'}`}>#{user.rank}</span>
                        <Image src={user.profiles?.avatar_url || `https://placehold.co/40x40/777/FFF.png?text=${user.profiles?.full_name?.charAt(0) || user.profiles?.username?.charAt(0) || 'U'}`} alt={user.profiles?.full_name || user.profiles?.username || 'User'} width={32} height={32} className="w-8 h-8 rounded-full mr-3" data-ai-hint="avatar user"/>
                        <span className="font-medium text-foreground">{user.profiles?.full_name || user.profiles?.username || 'Anonymous User'}</span>
                        </div>
                        <span className="font-bold text-lg text-accent">{user.score} PTS</span>
                    </li>
                    ))}
                </ul>
                ) : ( <p className="text-muted-foreground text-center py-10">Leaderboard is currently empty. Start completing missions!</p> )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
    