
// src/components/games/chronomind/Chapter1TimeChamber.tsx
import type { ChronoMindState } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Clock, Zap, ChevronRight } from 'lucide-react';
import PuzzleKinematics from './PuzzleKinematics';
// Import other puzzle components for Chapter 1 here
// import PuzzleTimeDilation from './PuzzleTimeDilation';
// import PuzzleProjectileMotion from './PuzzleProjectileMotion';
import { useState } from 'react';

interface Chapter1Props {
  gameState: ChronoMindState;
  updateGameState: (newState: Partial<ChronoMindState>) => void;
  advanceChapter: (nextChapter: ChronoMindState['currentChapter']) => void;
}

type ActivePuzzle = 'kinematics' | 'time_dilation' | 'projectile_motion' | null;

export default function Chapter1TimeChamber({ gameState, updateGameState, advanceChapter }: Chapter1Props) {
  const [activePuzzle, setActivePuzzle] = useState<ActivePuzzle>(null);
  const [chronosMessage, setChronosMessage] = useState<string | null>("The clocks tick differently here. Observe carefully.");
  const [showChapterComplete, setShowChapterComplete] = useState(false);

  const { chapter1Progress } = gameState;

  const handlePuzzleComplete = (puzzleName: keyof ChronoMindState['chapter1Progress']) => {
    const newProgress = { ...chapter1Progress, [puzzleName]: true };
    updateGameState({ chapter1Progress: newProgress });
    setActivePuzzle(null); // Return to chapter hub
    setChronosMessage("Interesting... you adapt quickly. But can you maintain this pace?");

    // Check if all puzzles in chapter 1 are complete
    if (Object.values(newProgress).every(status => status === true)) {
      setShowChapterComplete(true);
      setChronosMessage("The Time Chamber stabilizes... for now. A new path flickers into existence.");
    }
  };

  const handlePuzzleFail = (puzzleName: keyof ChronoMindState['chapter1Progress'], message: string) => {
     setChronosMessage(`A temporal anomaly detected in ${puzzleName.replace(/([A-Z])/g, ' $1')}. ${message} The loop resets.`);
     // Optionally, increment memoryLossEvents or trigger other effects
     updateGameState({ memoryLossEvents: (gameState.memoryLossEvents || 0) + 1 });
     // Reset puzzle or show variation (simplified for now, just shows message)
  };

  if (showChapterComplete) {
    return (
      <Card className="w-full max-w-3xl text-center chronomind-puzzle-card p-6">
        <CardHeader>
          <Clock className="h-16 w-16 mx-auto text-primary mb-4" />
          <CardTitle className="text-3xl font-headline glow-text-primary">Time Chamber Stabilized</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-muted-foreground mb-4">{chronosMessage}</p>
          <p className="text-lg text-foreground">The fabric of this reality shimmers, revealing an exit.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => advanceChapter('chapter2')} className="w-full glow-button text-lg">
            Proceed to Chemical Collapse <ChevronRight className="ml-2"/>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (activePuzzle === 'kinematics') {
    return <PuzzleKinematics onComplete={() => handlePuzzleComplete('kinematicsSolved')} onFail={(msg) => handlePuzzleFail('kinematicsSolved', msg)} />;
  }
  // Add other puzzle components here:
  // if (activePuzzle === 'time_dilation') {
  //   return <PuzzleTimeDilation onComplete={() => handlePuzzleComplete('timeDilationSolved')} />;
  // }
  // if (activePuzzle === 'projectile_motion') {
  //   return <PuzzleProjectileMotion onComplete={() => handlePuzzleComplete('projectileMotionSolved')} />;
  // }

  // Chapter Hub
  return (
    <Card className="w-full max-w-4xl text-center chronomind-puzzle-card p-6 md:p-10">
      <CardHeader>
        <Clock className="h-16 w-16 mx-auto text-primary mb-4 animate-pulse" />
        <CardTitle className="text-4xl font-headline glow-text-primary">Chapter 1: The Time Chamber</CardTitle>
        <CardDescription className="text-lg text-muted-foreground mt-2">
          The room is filled with floating clocks, shimmering lasers, and erratically moving platforms. Time itself feels unstable.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {chronosMessage && (
          <div className="p-4 bg-black/30 border border-accent/30 rounded-md text-accent-foreground italic shadow-lg">
            <p className="font-mono">{"<Chronos_AI>"} {chronosMessage}</p>
          </div>
        )}
        
        <div className="grid md:grid-cols-3 gap-6">
          <PuzzleAccessCard 
            title="Kinematics Synchronization" 
            description="Align temporal emitters to achieve particle collision."
            isSolved={chapter1Progress.kinematicsSolved}
            onClick={() => setActivePuzzle('kinematics')}
          />
          <PuzzleAccessCard 
            title="Time Dilation Paradox" 
            description="Resolve the conflicting temporal signatures."
            isSolved={chapter1Progress.timeDilationSolved}
            onClick={() => { /* setActivePuzzle('time_dilation') */ setChronosMessage("This temporal anomaly requires further calibration. Try another puzzle for now."); }}
            disabled={true} // Placeholder
          />
          <PuzzleAccessCard 
            title="Quantum Projectile Path" 
            description="Chart a safe course through shifting temporal fields."
            isSolved={chapter1Progress.projectileMotionSolved}
            onClick={() => { /* setActivePuzzle('projectile_motion') */ setChronosMessage("Trajectory calculation module offline. Focus elsewhere, Subject 17."); }}
            disabled={true} // Placeholder
          />
        </div>
      </CardContent>
       <CardFooter className="mt-6">
        <p className="text-sm text-muted-foreground mx-auto">Solve all puzzles to stabilize this reality fragment.</p>
      </CardFooter>
    </Card>
  );
}

interface PuzzleAccessCardProps {
  title: string;
  description: string;
  isSolved: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const PuzzleAccessCard = ({ title, description, isSolved, onClick, disabled }: PuzzleAccessCardProps) => (
  <Card className={`p-4 hover:shadow-lg transition-shadow chronomind-puzzle-card ${isSolved ? 'border-green-500/70 bg-green-500/10' : 'hover:border-primary/70'}`}>
    <h3 className={`text-xl font-semibold mb-2 ${isSolved ? 'text-green-400 glow-text-primary' : 'text-primary glow-text-primary'}`}>{title}</h3>
    <p className="text-sm text-muted-foreground mb-3 min-h-[40px]">{description}</p>
    <Button onClick={onClick} disabled={isSolved || disabled} className="w-full glow-button">
      {isSolved ? 'Calibrated' : (disabled ? 'Offline' : 'Access Puzzle')}
    </Button>
  </Card>
);


    