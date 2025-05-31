
// src/components/games/chronomind/PuzzleKinematics.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Zap, AlertTriangle } from 'lucide-react';

interface PuzzleKinematicsProps {
  onComplete: () => void;
  onFail: (message: string) => void;
}

// Simplified Kinematics Puzzle: Match the timing of two falling objects
// For NEET, this would involve actual physics principles.
// Here, it's a logic/timing puzzle representation.
const TARGET_TIME_1 = 50; // Arbitrary target value for slider 1
const TARGET_TIME_2 = 70; // Arbitrary target value for slider 2

export default function PuzzleKinematics({ onComplete, onFail }: PuzzleKinematicsProps) {
  const [time1, setTime1] = useState([30]);
  const [time2, setTime2] = useState([40]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = () => {
    // Check if sliders are close to target values (within a tolerance)
    const tolerance = 5;
    const isTime1Correct = Math.abs(time1[0] - TARGET_TIME_1) <= tolerance;
    const isTime2Correct = Math.abs(time2[0] - TARGET_TIME_2) <= tolerance;

    if (isTime1Correct && isTime2Correct) {
      setFeedback("Synchronization successful! Temporal field stable.");
      onComplete();
    } else {
      let failMessage = "Synchronization failed. ";
      if (!isTime1Correct) failMessage += "Emitter Alpha timing is off. ";
      if (!isTime2Correct) failMessage += "Emitter Beta timing is off. ";
      failMessage += "A minor temporal flux detected.";
      setFeedback(failMessage);
      onFail(failMessage);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto chronomind-puzzle-card p-6">
      <CardHeader>
        <CardTitle className="text-2xl font-headline glow-text-accent">Kinematics Synchronization</CardTitle>
        <CardDescription className="text-muted-foreground">
          Calibrate the temporal emitters. Emitter Alpha and Emitter Beta particles must achieve target resonance simultaneously to stabilize the local timeline. Adjust their release timings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <label htmlFor="time1" className="block text-sm font-medium text-foreground">Emitter Alpha Timing ({time1[0]})</label>
          <Slider
            id="time1"
            min={0}
            max={100}
            step={1}
            value={time1}
            onValueChange={setTime1}
            className="[&_.slider-thumb]:bg-accent [&_.slider-range]:bg-accent/80"
          />
        </div>
        <div className="space-y-4">
          <label htmlFor="time2" className="block text-sm font-medium text-foreground">Emitter Beta Timing ({time2[0]})</label>
          <Slider
            id="time2"
            min={0}
            max={100}
            step={1}
            value={time2}
            onValueChange={setTime2}
            className="[&_.slider-thumb]:bg-primary [&_.slider-range]:bg-primary/80"
          />
        </div>
        {feedback && (
          <p className={`text-sm p-3 rounded-md flex items-center ${feedback.includes("successful") ? 'bg-green-500/20 text-green-300 border border-green-400/50' : 'bg-red-500/20 text-red-300 border border-red-400/50'}`}>
            {feedback.includes("successful") ? <Zap className="mr-2 h-5 w-5" /> : <AlertTriangle className="mr-2 h-5 w-5" />}
            {feedback}
          </p>
        )}
        <Button onClick={handleSubmit} className="w-full glow-button text-lg">
          Attempt Synchronization
        </Button>
      </CardContent>
    </Card>
  );
}
    
