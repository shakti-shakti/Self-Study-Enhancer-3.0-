
// src/app/dashboard/rewards-wheel/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, RefreshCw, Loader2, AlertTriangle, Coins } from 'lucide-react'; // Added Coins
import { useToast } from '@/hooks/use-toast';

const rewards = [
  { name: "+10 Focus Coins", color: "hsl(var(--primary))", type: "coins", value: 10, weight: 5, dataAiHint: "gold coins" },
  { name: "AI Help Token", color: "hsl(var(--accent))", type: "token", value: 1, weight: 2, dataAiHint: "token bright" },
  { name: "New Avatar Frame", color: "hsl(120, 60%, 50%)", type: "cosmetic", value: 1, weight: 3, dataAiHint: "avatar frame" }, // Lime
  { name: "Study Theme Unlock", color: "hsl(270, 70%, 60%)", type: "cosmetic", value: 1, weight: 1, dataAiHint: "theme abstract" }, // Violet
  { name: "Try Again!", color: "hsl(var(--muted-foreground))", type: "none", value: 0, weight: 6, dataAiHint: "question mark" },
  { name: "+25 Focus Coins", color: "hsl(var(--primary))", type: "coins", value: 25, weight: 2, dataAiHint: "coins stack"}, // Orange
  { name: "+5 Focus Coins", color: "hsl(30, 90%, 55%)", type: "coins", value: 5, weight: 4, dataAiHint: "few coins" }, // Orange
  { name: "Rare Avatar!", color: "hsl(330, 80%, 60%)", type: "cosmetic", value: 1, weight: 1, dataAiHint: "rare avatar cool" }, // Pink/Magenta
];

const weightedRewards = rewards.flatMap(reward => Array(reward.weight).fill(reward));

export default function RewardsWheelPage() {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [finalReward, setFinalReward] = useState<typeof rewards[0] | null>(null);
  const [canSpin, setCanSpin] = useState(true); 
  const { toast } = useToast();

  const spinWheel = () => {
    if (!canSpin || isSpinning) return;

    setIsSpinning(true);
    setFinalReward(null);

    const randomRewardIndex = Math.floor(Math.random() * weightedRewards.length);
    const selectedReward = weightedRewards[randomRewardIndex];
    
    // Determine the actual index in the original `rewards` array for segment calculation
    const actualRewardIndexInDisplay = rewards.findIndex(r => r.name === selectedReward.name && r.value === selectedReward.value);

    const segmentAngle = 360 / rewards.length;
    // Calculate target rotation: middle of the segment + multiple full spins
    const targetSegmentMiddle = (actualRewardIndexInDisplay * segmentAngle) + (segmentAngle / 2);
    const fullSpins = Math.floor(Math.random() * 3) + 5; // 5 to 7 full spins
    const targetRotation = (fullSpins * 360) + targetSegmentMiddle; // Spin to land on the segment. Pointer is at top (0 deg or 360 deg).
                                                              // The wheel spins, so segment 0 needs to align with pointer.
                                                              // We want to rotate so segment `actualRewardIndexInDisplay` is at the top.
                                                              // If pointer is at top (0deg), segment 0 starts at 0. Segment 1 at segmentAngle, etc.
                                                              // So we need to rotate by -targetSegmentMiddle to bring it to top.
    const finalRotation = targetRotation - (targetSegmentMiddle); // Ensure it lands correctly
    
    if (wheelRef.current) {
        // Reset transition to snap to start, then apply spin transition
        wheelRef.current.style.transition = 'none';
        wheelRef.current.style.transform = `rotate(0deg)`; // Or current accumulated rotation if you want smooth restart

        // Force reflow
        wheelRef.current.offsetHeight; 

        wheelRef.current.style.transition = 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)';
        wheelRef.current.style.transform = `rotate(${finalRotation}deg)`;
    }


    setTimeout(() => {
      setIsSpinning(false);
      setFinalReward(selectedReward);
      setCanSpin(false); 
      toast({
        title: "You Won!",
        description: `Congratulations! You received: ${selectedReward.name}`,
        className: `bg-opacity-20 border border-[${selectedReward.color}] text-[${selectedReward.color}]`, // Use HSL directly
      });
      // Conceptual: Update user's coins or inventory
      // if (selectedReward.type === 'coins') {
      //   // supabase.rpc('increment_focus_coins', { user_id: userId, amount: selectedReward.value });
      // }
    }, 4100); 
  };
  
  // useEffect(() => { // Placeholder for daily spin limit check
  // }, [toast]);

  const segmentAngle = 360 / rewards.length;

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
          <div className="relative w-64 h-64 sm:w-80 sm:h-80">
            {/* Pointer */}
            <div 
              className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-20"
              style={{
                width: 0, height: 0,
                borderLeft: '15px solid transparent',
                borderRight: '15px solid transparent',
                borderTop: '25px solid hsl(var(--primary))', // Use primary color
                filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.3))'
              }}
            />
            {/* Wheel */}
            <div 
              ref={wheelRef}
              className="w-full h-full rounded-full border-8 border-primary/30 shadow-2xl overflow-hidden bg-card"
            >
              {rewards.map((reward, index) => (
                  <div 
                      key={index}
                      className="absolute w-1/2 h-1/2 origin-bottom-right flex items-center justify-center"
                      style={{ 
                          transform: `rotate(${segmentAngle * index}deg)`,
                          clipPath: `polygon(0 0, 100% 0, 50% 100%)`,
                          backgroundColor: `${reward.color.replace('hsl(var(--','').replace('))',')').replace(/(\d+)\s+(\d+%)\s+(\d+%)/, 'hsla($1, $2, $3, 0.3)')}`, // Convert HSL to HSLA for background
                      }}
                  >
                       <div 
                        className="transform -rotate-45 text-center"
                        style={{
                             transform: `translateY(-25%) rotate(${segmentAngle/2 + 90}deg)`, // Adjust text rotation to be readable
                             color: reward.color, // Use reward color for text
                             maxWidth: '70%',
                        }}
                       >
                        {reward.type === 'coins' ? <Coins className="h-5 w-5 inline-block mr-1"/> : null}
                        <span className="text-xs font-bold truncate block">{reward.name}</span>
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
            {isSpinning ? 'Spinning...' : (canSpin ? 'Spin the Wheel!' : 'Spun for Today!')}
          </Button>

          {finalReward && !isSpinning && (
            <Card 
                className="p-4 text-center"
                style={{ backgroundColor: `${finalReward.color.replace('hsl(var(--','').replace('))',')').replace(/(\d+)\s+(\d+%)\s+(\d+%)/, 'hsla($1, $2, $3, 0.2)')}`, borderColor: finalReward.color }}
                data-ai-hint={finalReward.dataAiHint}
            >
              <CardTitle className="text-xl" style={{ color: finalReward.color }}>You Won: {finalReward.name}</CardTitle>
            </Card>
          )}
        </CardContent>
      </Card>
        <p className="text-center text-muted-foreground mt-8 text-sm">
            Note: This is a conceptual UI for the Spin Wheel. Reward logic and daily spin limits need full implementation.
        </p>
    </div>
  );
}
