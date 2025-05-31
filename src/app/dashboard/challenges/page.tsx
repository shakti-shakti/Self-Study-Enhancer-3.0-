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
import Image from 'next/image';

// Types for local data structure
type Mission = Tables<'missions'> & {
  current_progress: number; // User's current progress (fetched from user_missions)
  status: "locked" | "active" | "completed" | "failed"; // User's status for this mission
  icon?: React.ElementType; // For Lucide icons
};

type Badge = Tables<'badges'> & {
  icon?: React.ElementType;
};

type LeaderboardUser = Tables<'leaderboard_entries'> & {
  rank?: number; 
  profiles: { full_name: string | null; username: string | null; avatar_url: string | null } | null;
};


const sampleMissions: Mission[] = [
  // This will be replaced by fetched data
];

const sampleBadges: Badge[] = [
  // This will be replaced by fetched data
];

const sampleLeaderboard: LeaderboardUser[] = [
    // This will be replaced by fetched data
];


export default function ChallengesPage() {
  const [isPending, startTransition] = useTransition();
  const [userId, setUserId] = useState<string|null>(null);
  const [userMissions, setUserMissions] = useState<Mission[]>([]);
  const [userBadges, setUserBadges] = useState<Badge[]>([]);
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);

  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getCurrentUser();
  }, [supabase]);


  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      startTransition(async () => {
        // Fetch all active missions
        const { data: missionsData, error: missionsError } = await supabase
          .from('missions')
          .select('*')
          .eq('is_active', true);
        if (missionsError) toast({ variant: 'destructive', title: 'Error fetching missions', description: missionsError.message });

        // Fetch user's progress on these missions
        const { data: userMissionsData, error: userMissionsError } = await supabase
          .from('user_missions')
          .select('*')
          .eq('user_id', userId);
        if (userMissionsError) toast({ variant: 'destructive', title: 'Error fetching user mission progress', description: userMissionsError.message });

        if (missionsData) {
          const combinedMissions = missionsData.map(mission => {
            const userProgress = userMissionsData?.find(um => um.mission_id === mission.id);
            let iconComponent = TargetIcon; // Default icon
            if (mission.title.toLowerCase().includes("physics")) iconComponent = Zap;
            else if (mission.title.toLowerCase().includes("quiz")) iconComponent = Trophy;
            else if (mission.title.toLowerCase().includes("streak")) iconComponent = CalendarDays;

            return {
              ...mission,
              icon: iconComponent,
              current_progress: userProgress?.current_progress || 0,
              status: userProgress?.status || 'locked', 
            };
          });
          setUserMissions(combinedMissions);
        }

        // Fetch all badges
        const { data: allBadgesData, error: allBadgesError } = await supabase.from('badges').select('*');
        if (allBadgesError) toast({ variant: 'destructive', title: 'Error fetching badges', description: allBadgesError.message });
        
        // Fetch user's earned badges
        const { data: earnedUserBadgesData, error: userBadgesError } = await supabase
          .from('user_badges')
          .select('*, badges(*)')
          .eq('user_id', userId);
        if (userBadgesError) toast({ variant: 'destructive', title: 'Error fetching user badges', description: userBadgesError.message });
        
        if (earnedUserBadgesData && allBadgesData) {
            const mappedUserBadges = earnedUserBadgesData.map(ub => {
                const badgeDetails = ub.badges as Badge; 
                let iconComp = Award; 
                if(badgeDetails?.icon_name_or_url?.toLowerCase().includes("ncert")) iconComp = Award;
                else if(badgeDetails?.icon_name_or_url?.toLowerCase().includes("quiz")) iconComp = ShieldCheck;
                else if(badgeDetails?.icon_name_or_url?.toLowerCase().includes("streak")) iconComp = Star;
                return { ...badgeDetails, icon: iconComp };
            });
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


        // Fetch leaderboard
        const { data: leaderboardData, error: leaderboardError } = await supabase
          .from('leaderboard_entries')
          .select('*, profiles!user_id(full_name, username, avatar_url)')
          .eq('period', 'all_time')
          .order('score', { ascending: false })
          .limit(10);

        if (leaderboardError) {
            toast({ variant: 'destructive', title: 'Error fetching leaderboard', description: leaderboardError.message });
            console.error("Leaderboard fetch error:", leaderboardError);
        } else {
            const processedLeaderboard = (leaderboardData as LeaderboardUser[] || []).map((entry, index) => {
                if (!entry.profiles) {
                    console.warn(`Leaderboard entry for user ID ${entry.user_id} is missing profile data. Join might have failed or profile doesn't exist.`);
                }
                return {...entry, rank: index + 1};
            });
            setLeaderboard(processedLeaderboard);
        }
      });
    };
    fetchData();
  }, [userId, supabase, toast]);

  const handleCompleteMission = async (mission: Mission) => {
    if(!userId) return;
    if (mission.status !== 'active') {
        toast({title: "Mission not active", description: "This mission is either locked or already completed."});
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
        
        const { error: scoreError } = await supabase.rpc('increment_leaderboard_score', { 
            p_user_id: userId, 
            p_score_increment: mission.reward_points, 
            p_period: 'all_time' 
        });
        if (scoreError) console.error("Error updating score via RPC:", scoreError);


        if (mission.badge_id_reward) {
            const { error: badgeError } = await supabase
                .from('user_badges')
                .insert({ user_id: userId, badge_id: mission.badge_id_reward });
            
            if (badgeError && badgeError.code !== '23505') { 
                toast({ variant: 'destructive', title: "Error granting badge", description: badgeError.message });
            } else if (!badgeError) {
                const awardedBadge = availableBadges.find(b => b.id === mission.badge_id_reward) || userBadges.find(b => b.id === mission.badge_id_reward);
                 toast({
                    title: "Badge Unlocked!",
                    description: `You've earned the ${awardedBadge?.name || 'new'} badge!`,
                    className: 'bg-accent/20 border-accent text-accent-foreground glow-text-accent'
                });
            }
        }
        
        const activityLog: TablesInsert<'activity_logs'> = {
          user_id: userId,
          activity_type: 'mission_completed',
          description: `Completed mission: "${mission.title}" (+${mission.reward_points} pts)`,
          details: { mission_id: mission.id, points: mission.reward_points, badge: mission.badge_id_reward }
        };
        await supabase.from('activity_logs').insert(activityLog);

        toast({
            title: "Mission Complete!",
            description: `You've completed "${mission.title}" and earned ${mission.reward_points} points!`,
            className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary'
        });
        
        if (userId) { 
            const { data: missionsData } = await supabase.from('missions').select('*').eq('is_active', true);
            const { data: userMissionsData } = await supabase.from('user_missions').select('*').eq('user_id', userId);
            if (missionsData) {
                const combinedMissions = missionsData.map(m => {
                    const userProgress = userMissionsData?.find(um => um.mission_id === m.id);
                     let iconComponent = TargetIcon;
                    if (m.title.toLowerCase().includes("physics")) iconComponent = Zap;
                    else if (m.title.toLowerCase().includes("quiz")) iconComponent = Trophy;
                    else if (m.title.toLowerCase().includes("streak")) iconComponent = CalendarDays;
                    return { ...m, icon: iconComponent, current_progress: userProgress?.current_progress || 0, status: userProgress?.status || 'locked' };
                });
                setUserMissions(combinedMissions);
            }
            const { data: earnedUserBadgesData } = await supabase.from('user_badges').select('*, badges(*)').eq('user_id', userId);
            const { data: allBadgesData } = await supabase.from('badges').select('*');
             if (earnedUserBadgesData && allBadgesData) {
                 const mappedUserBadges = earnedUserBadgesData.map(ub => ({ ...(ub.badges as Badge), icon: Award })); 
                 setUserBadges(mappedUserBadges);
                 setAvailableBadges(allBadgesData.filter(ab => !mappedUserBadges.find(ub => ub.id === ab.id)).map(b => ({...b, icon: Award})));
             }
            const { data: leaderboardData, error: leaderboardRefetchError } = await supabase
                .from('leaderboard_entries')
                .select('*, profiles!user_id(full_name, username, avatar_url)')
                .eq('period', 'all_time')
                .order('score', { ascending: false })
                .limit(10);
            if (leaderboardRefetchError) {
                console.error("Leaderboard refetch error:", leaderboardRefetchError);
            } else {
                 const processedLeaderboard = (leaderboardData as LeaderboardUser[] || []).map((entry, index) => {
                    if (!entry.profiles) {
                        console.warn(`Leaderboard entry for user ID ${entry.user_id} is missing profile data after refetch.`);
                    }
                    return {...entry, rank: index + 1};
                });
                setLeaderboard(processedLeaderboard);
            }
        }
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
        <p className="text-sm font-semibold text-accent">Reward: {mission.reward_points} Points {mission.badge_id_reward && "+ Badge"}</p>
      </CardContent>
      <CardFooter className="p-4 bg-card-foreground/5 border-t border-border/20">
        {mission.status === 'active' && (
          <Button 
            className="w-full glow-button" 
            onClick={() => handleCompleteMission(mission)}
            disabled={isPending || mission.current_progress >= mission.target_value} 
          >
            {isPending ? <Loader2 className="animate-spin mr-2"/> : <CheckCircle className="mr-2"/>}
            {mission.current_progress >= mission.target_value ? 'Claim Reward' : 'Mark as Complete (Demo)'}
          </Button>
        )}
        {mission.status === 'locked' && (
          <Button className="w-full" variant="outline" disabled>
            <HelpCircle className="mr-2"/> Locked
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
      badge.icon_name_or_url && badge.icon_name_or_url.startsWith('http') ? 
        <Image src={badge.icon_name_or_url} alt={badge.name} width={48} height={48} className="mb-2 rounded-full" data-ai-hint="badge icon"/> : 
        <Award className="h-12 w-12 text-accent mb-2"/> }
      <h3 className="font-semibold text-lg glow-text-accent">{badge.name}</h3>
      <p className="text-xs text-muted-foreground">{badge.description}</p>
    </Card>
  );
  
  if (isPending && userMissions.length === 0 && leaderboard.length === 0) {
     return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-10 pb-16 md:pb-0">
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
           <h2 className="text-2xl font-headline font-semibold mt-10 mb-4 glow-text-accent text-center">Available Badges to Earn</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 opacity-60">
                {availableBadges.map(badge => <BadgeCard key={badge.id} badge={badge} />)}
            </div>
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
                ) : (
                 <p className="text-muted-foreground text-center py-10">Leaderboard is currently empty. Start completing missions!</p>
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
    
