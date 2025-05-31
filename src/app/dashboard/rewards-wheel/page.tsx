
// src/app/dashboard/rewards-wheel/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// import { createClient } from '@/lib/supabase/client'; // For future coin updates

// Sample rewards
const rewards = [
  { name: "+10 Focus Coins", color: "gold", weight: 5, dataAiHint: "gold coins" },
  { name: "AI Help Token", color: "cyan", weight: 2, dataAiHint: "token bright" },
  { name: "New Avatar Frame", color: "lime", weight: 3, dataAiHint: "avatar frame" },
  { name: "Study Theme Unlock", color: "violet", weight: 1, dataAiHint: "theme abstract" },
  { name: "Try Again!", color: "silver", weight: 6, dataAiHint: "question mark" },
  { name: "+5 Focus Coins", color: "orange", weight: 4, dataAiHint: "coins stack" },
];

// Create a weighted list for easier random selection
const weightedRewards = rewards.flatMap(reward => Array(reward.weight).fill(reward));

export default function RewardsWheelPage() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningDegrees, setSpinningDegrees] = useState(0);
  const [finalReward, setFinalReward] = useState<typeof rewards[0] | null>(null);
  const [canSpin, setCanSpin] = useState(true); // Placeholder for daily spin limit
  const { toast } = useToast();
  // const supabase = createClient(); // For future Supabase interactions

  const spinWheel = () => {
    if (!canSpin || isSpinning) return;

    setIsSpinning(true);
    setFinalReward(null);

    const totalSpins = Math.floor(Math.random() * 3) + 5; // 5 to 7 full spins
    const randomRewardIndex = Math.floor(Math.random() * weightedRewards.length);
    const selectedReward = weightedRewards[randomRewardIndex];
    
    // Calculate the angle for the selected reward
    // This is a simplified visual representation; a real wheel would map degrees to segments.
    // For now, we'll just spin to a random degree and then show the reward.
    const randomExtraDegrees = Math.random() * 360;
    const targetDegrees = totalSpins * 360 + randomExtraDegrees;

    setSpinningDegrees(targetDegrees);

    setTimeout(() => {
      setIsSpinning(false);
      setFinalReward(selectedReward);
      setCanSpin(false); // For demo, one spin per session/load
      toast({
        title: "You Won!",
        description: `Congratulations! You received: ${selectedReward.name}`,
        className: `bg-${selectedReward.color}-500/20 border-${selectedReward.color}-500 text-${selectedReward.color}-700 dark:text-${selectedReward.color}-300 glow-text-${selectedReward.color}-500`,
      });
      // Here you would update user's coins or inventory in Supabase
    }, 4000); // Corresponds to animation duration
  };
  
  useEffect(() => {
    // Check if user has already spun today (conceptual)
    // const lastSpinDate = localStorage.getItem('lastSpinDate');
    // if (lastSpinDate && new Date(lastSpinDate).toDateString() === new Date().toDateString()) {
    //   setCanSpin(false);
    //   toast({ title: "Already Spun!", description: "You can spin the wheel once per day. Come back tomorrow!"});
    // }
  }, [toast]);


  return (
    <div className="space-y-10">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Gift className="mr-4 h-10 w-10 text-primary" /> Spin-the-Wheel Rewards
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Feeling lucky? Spin the wheel daily for a chance to win awesome rewards!
        </p>
      </header>

      <Card className="max-w-md mx-auto interactive-card p-6 shadow-xl shadow-primary/10">
        <CardContent className="flex flex-col items-center justify-center space-y-8">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full border-8 border-primary/30 shadow-2xl overflow-hidden bg-gradient-to-br from-background via-muted to-background">
            {/* Simplified Visual Wheel - Actual segments would be more complex */}
            {rewards.map((reward, index) => (
                <div 
                    key={index}
                    className="absolute w-1/2 h-1/2 origin-bottom-right"
                    style={{ 
                        transform: `rotate(${(360 / rewards.length) * index}deg)`,
                        clipPath: `polygon(0 0, 100% 0, 50% 100%)`, // Triangle segment
                    }}
                >
                     <div className={`w-full h-full bg-${reward.color}-500/30 flex items-center justify-center text-xs font-semibold text-${reward.color}-800 dark:text-${reward.color}-200`} style={{transform: 'rotate(45deg) scale(0.7)'}}>
                        {/* Text might be hard to position well in simple CSS triangles */}
                     </div>
                </div>
            ))}
            <div 
              className="absolute inset-0 rounded-full transition-transform duration-[4000ms] ease-out"
              style={{ transform: `rotate(${spinningDegrees}deg)` }}
            >
              {/* Could add more details for segments here if needed */}
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2 w-0 h-0 
              border-l-[10px] border-l-transparent
              border-r-[10px] border-r-transparent
              border-t-[15px] border-t-primary z-10 glow-text-primary shadow-lg"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-background rounded-full border-4 border-primary shadow-md flex items-center justify-center">
                    <Gift className="h-8 w-8 text-primary"/>
                </div>
            </div>
          </div>
          
          <Button 
            onClick={spinWheel} 
            disabled={!canSpin || isSpinning}
            className="w-full font-semibold text-xl py-6 glow-button"
          >
            {isSpinning ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <RefreshCw className="mr-2 h-6 w-6" />}
            {isSpinning ? 'Spinning...' : (canSpin ? 'Spin the Wheel!' : 'Spun for Today!')}
          </Button>

          {finalReward && !isSpinning && (
            <Card className={`p-4 text-center bg-${finalReward.color}-500/20 border-${finalReward.color}-500 text-${finalReward.color}-700 dark:text-${finalReward.color}-300`} data-ai-hint={finalReward.dataAiHint}>
              <CardTitle className="text-xl">You Won: {finalReward.name}</CardTitle>
            </Card>
          )}
        </CardContent>
      </Card>
        <p className="text-center text-muted-foreground mt-8 text-sm">
            Note: This is a conceptual UI for the Spin Wheel. Animation is simplified. Reward logic and daily spin limits need full implementation.
        </p>
    </div>
  );
}

