
// src/app/dashboard/rewards-wheel/page.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Gift, RefreshCw, Loader2, AlertTriangle, Coins, History, CalendarDays, Sparkles, Palette, UserCircle2, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as apiClient from '@/lib/apiClient';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO } from 'date-fns';


const rewards = [
  { id: 'coins_10', name: "+10 Focus Coins", color: "hsl(var(--primary))", type: "coins", value: 10, weight: 5, icon: <Coins/>, dataAiHint: "gold coins" },
  { id: 'token_ai', name: "AI Help Token", color: "hsl(var(--accent))", type: "token", value: 1, weight: 2, icon: <Sparkles/>, dataAiHint: "token bright" },
  { id: 'cosmetic_avatar_frame', name: "New Avatar Frame", color: "hsl(120, 60%, 50%)", type: "cosmetic", value: 'avatar_frame_01', weight: 3, icon: <UserCircle2/>, dataAiHint: "avatar frame" },
  { id: 'cosmetic_theme_ocean', name: "Ocean Blue Theme", color: "hsl(270, 70%, 60%)", type: "cosmetic", value: 'theme_ocean', weight: 1, icon: <Palette/>, dataAiHint: "theme abstract" },
  { id: 'none_try_again', name: "Try Again!", color: "hsl(var(--muted-foreground))", type: "none", value: 0, weight: 6, icon: <RefreshCw/>, dataAiHint: "question mark" },
  { id: 'coins_25', name: "+25 Focus Coins", color: "hsl(var(--primary))", type: "coins", value: 25, weight: 2, icon: <Coins/>, dataAiHint: "coins stack"},
  { id: 'coins_5', name: "+5 Focus Coins", color: "hsl(30, 90%, 55%)", type: "coins", value: 5, weight: 4, icon: <Coins/>, dataAiHint: "few coins" }, 
  { id: 'avatar_rare_01', name: "Rare Avatar!", color: "hsl(330, 80%, 60%)", type: "cosmetic", value: 'avatar_rare_01', weight: 1, icon: <UserCircle2/>, dataAiHint: "rare avatar cool" }, 
];

const weightedRewards = rewards.flatMap(reward => Array(reward.weight).fill(reward));

interface SpinHistoryEntry {
  rewardName: string;
  rewardType: string;
  rewardValue?: number | string;
  timestamp: string;
}

export default function RewardsWheelPage() {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [finalReward, setFinalReward] = useState<typeof rewards[0] | null>(null);
  const [canSpin, setCanSpin] = useState(true); 
  const [spinHistory, setSpinHistory] = useState<SpinHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const { toast } = useToast();

  const loadSpinHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    const history = await apiClient.fetchSpinHistory();
    setSpinHistory(history);
    setIsLoadingHistory(false);
  }, []);

  useEffect(() => {
    loadSpinHistory();
    // TODO: Implement daily spin limit check
    // Example: const lastSpinDate = await apiClient.getLastSpinDate();
    // if (lastSpinDate && isToday(parseISO(lastSpinDate))) setCanSpin(false);
  }, [loadSpinHistory]);


  const spinWheel = async () => {
    if (!canSpin || isSpinning) return;

    setIsSpinning(true);
    setFinalReward(null);

    // Simulate daily spin limit for demo
    // setCanSpin(false); // Uncomment to enforce one spin per session/day (needs proper backend)

    const randomRewardIndex = Math.floor(Math.random() * weightedRewards.length);
    const selectedReward = weightedRewards[randomRewardIndex];
    
    const actualRewardIndexInDisplay = rewards.findIndex(r => r.id === selectedReward.id);

    const segmentAngle = 360 / rewards.length;
    const targetSegmentMiddle = (actualRewardIndexInDisplay * segmentAngle) + (segmentAngle / 2);
    const fullSpins = Math.floor(Math.random() * 3) + 5; 
    const finalRotation = (fullSpins * 360) + targetSegmentMiddle; 
    
    if (wheelRef.current) {
        wheelRef.current.style.transition = 'none';
        wheelRef.current.style.transform = `rotate(0deg)`; 
        wheelRef.current.offsetHeight; 
        wheelRef.current.style.transition = 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)';
        wheelRef.current.style.transform = `rotate(${finalRotation}deg)`;
    }

    setTimeout(async () => {
      setIsSpinning(false);
      setFinalReward(selectedReward);
      
      toast({
        title: "You Won!",
        description: `Congratulations! You received: ${selectedReward.name}`,
        className: `bg-opacity-20 border border-[${selectedReward.color}] text-[${selectedReward.color}]`,
      });
      
      let xpEarned = 0;
      if (selectedReward.type === 'coins' && typeof selectedReward.value === 'number') {
        await apiClient.updateUserFocusCoins((await apiClient.fetchUserFocusCoins()) + selectedReward.value);
        xpEarned = selectedReward.value; // Example: 1 XP per coin
      } else if (selectedReward.type === 'token') {
        xpEarned = 20; // XP for a token
        // await apiClient.addAiHelpToken(); // Conceptual
      } else if (selectedReward.type === 'cosmetic') {
        xpEarned = 15; // XP for cosmetic
        // await apiClient.unlockStoreItem(selectedReward.value as string); // Conceptual
      }

      if (xpEarned > 0) {
          await apiClient.addUserXP(xpEarned);
          toast({ title: "XP Gained!", description: `You earned +${xpEarned} XP from the wheel!`, className: "bg-secondary/10 border-secondary text-secondary-foreground" });
      }
      
      await apiClient.addSpinToHistory(selectedReward.name, selectedReward.type, selectedReward.value);
      loadSpinHistory(); 

    }, 4100); 
  };
  
  const segmentAngle = 360 / rewards.length;

  const getRewardDisplayValue = (spin: SpinHistoryEntry): string => {
    if (spin.rewardType === 'coins') {
      return `+${spin.rewardValue} Focus Coins`;
    }
    return spin.rewardName; 
  };


  return (
    <div className="space-y-10 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Gift className="mr-4 h-10 w-10 text-primary" /> Spin-the-Wheel Rewards
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Feeling lucky? Spin the wheel for a chance to win awesome rewards!
        </p>
      </header>

      <Card className="max-w-md mx-auto interactive-card p-6 shadow-xl shadow-primary/10">
        <CardContent className="flex flex-col items-center justify-center space-y-8">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80">
            <div 
              className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-20"
              style={{
                width: 0, height: 0,
                borderLeft: '15px solid transparent',
                borderRight: '15px solid transparent',
                borderTop: '25px solid hsl(var(--primary))',
                filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.3))'
              }}
            />
            <div 
              ref={wheelRef}
              className="w-full h-full rounded-full border-8 border-primary/30 shadow-2xl overflow-hidden bg-card"
            >
              {rewards.map((reward, index) => (
                  <div 
                      key={reward.id}
                      className="absolute w-1/2 h-1/2 origin-bottom-right flex items-center justify-center"
                      style={{ 
                          transform: `rotate(${segmentAngle * index}deg)`,
                          clipPath: `polygon(0 0, 100% 0, 50% 100%)`,
                          backgroundColor: `${reward.color.replace('hsl(var(--','').replace('))',')').replace(/(\d+)\s+(\d+%)\s+(\d+%)/, 'hsla($1, $2, $3, 0.3)')}`,
                      }}
                  >
                       <div 
                        className="transform -rotate-45 text-center flex flex-col items-center justify-center"
                        style={{
                             transform: `translateY(-25%) rotate(${segmentAngle/2 + 90}deg)`, 
                             color: reward.color, 
                             maxWidth: '70%',
                        }}
                       >
                        {React.cloneElement(reward.icon as React.ReactElement, { className: "h-5 w-5 mb-0.5"})}
                        <span className="text-xs font-bold truncate block leading-tight">{reward.name}</span>
                       </div>
                  </div>
              ))}
            </div>
          </div>
          
          <Button 
            onClick={spinWheel} 
            disabled={!canSpin || isSpinning}
            className="w-full font-semibold text-xl py-6 glow-button"
          >
            {isSpinning ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <RefreshCw className="mr-2 h-6 w-6" />}
            {isSpinning ? 'Spinning...' : (canSpin ? 'Spin the Wheel!' : 'Spun Today!')}
          </Button>

          {finalReward && !isSpinning && (
            <Card 
                className="p-4 text-center w-full"
                style={{ 
                    backgroundColor: `${finalReward.color.replace('hsl(var(--','').replace('))',')').replace(/(\d+)\s+(\d+%)\s+(\d+%)/, 'hsla($1, $2, $3, 0.2)')}`, 
                    borderColor: finalReward.color,
                    borderWidth: '2px' 
                }}
                data-ai-hint={finalReward.dataAiHint}
            >
              <CardTitle className="text-2xl font-bold mb-1 flex items-center justify-center" style={{ color: finalReward.color }}>
                {React.cloneElement(finalReward.icon as React.ReactElement, {className: "inline-block mr-2 h-7 w-7"})}
                {finalReward.name}
              </CardTitle>
              <CardDescription className="text-sm" style={{ color: finalReward.color, opacity: 0.8 }}>
                You've won this awesome reward!
              </CardDescription>
            </Card>
          )}
        </CardContent>
      </Card>
      
      <Card className="max-w-lg mx-auto mt-12 interactive-card shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline glow-text-accent">
            <History className="mr-2 h-6 w-6" /> Recent Spins
          </CardTitle>
          <CardDescription>Your last few rewards from the wheel.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="flex justify-center items-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : spinHistory.length === 0 ? (
            <p className="text-muted-foreground text-center p-4">No spins recorded yet.</p>
          ) : (
            <ScrollArea className="h-60">
              <ul className="space-y-3 pr-3">
                {spinHistory.map((spin, index) => (
                  <li key={index} className="p-3 bg-muted/50 rounded-md border border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground">{getRewardDisplayValue(spin)}</span>
                      <span className="text-xs text-muted-foreground flex items-center">
                         <CalendarDays className="h-3 w-3 mr-1"/> {format(parseISO(spin.timestamp), "PPp")}
                      </span>
                    </div>
                    <p className="text-xs text-accent">Type: {spin.rewardType}</p>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
         <CardFooter>
            <p className="text-xs text-muted-foreground">Spin history is now saved to your account.</p>
         </CardFooter>
      </Card>
    </div>
  );
}
    