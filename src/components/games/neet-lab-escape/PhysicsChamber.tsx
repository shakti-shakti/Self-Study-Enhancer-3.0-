
// src/components/games/neet-lab-escape/PhysicsChamber.tsx
import type { NEETLabEscapeState } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Target, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import PuzzleRayOptics from './PuzzleRayOptics'; // Example puzzle
import PuzzleWrapper from '../PuzzleWrapper';

interface PhysicsChamberProps {
  gameState: NEETLabEscapeState;
  updateGameState: (newState: Partial<NEETLabEscapeState>) => void;
  advanceRoom: (nextRoom: NEETLabEscapeState['currentRoom']) => void;
}

const TOTAL_PUZZLES = 5; // For Physics Chamber

export default function PhysicsChamber({ gameState, updateGameState, advanceRoom }: PhysicsChamberProps) {
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0); // 0-4 for 5 puzzles
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  
  const { physicsPuzzlesSolved, masterLocksSolved } = gameState;

  const handlePuzzleSolved = (puzzleIdx: number) => {
    const newSolvedState = [...physicsPuzzlesSolved];
    newSolvedState[puzzleIdx] = true;
    updateGameState({ physicsPuzzlesSolved: newSolvedState });
    setFeedbackMessage(`Physics Puzzle ${puzzleIdx + 1} Solved! Accessing next schematic...`);
    if (puzzleIdx < TOTAL_PUZZLES - 1) {
      setCurrentPuzzleIndex(puzzleIdx + 1);
    } else {
      // All 5 individual puzzles solved, present master lock
      setFeedbackMessage("All primary physics puzzles solved. Master lock controls accessible.");
    }
  };

  const handlePuzzleFailed = (puzzleIdx: number, message: string) => {
    setFeedbackMessage(`Physics Puzzle ${puzzleIdx + 1} Failed: ${message}. Retrying sequence.`);
    // Add retry logic if needed, e.g., incrementing gameState.retriesUsed
    updateGameState({ retriesUsed: (gameState.retriesUsed || 0) + 1 });
  };
  
  const handleMasterLockSolved = () => {
      updateGameState({ masterLocksSolved: {...masterLocksSolved, physics: true }});
      setFeedbackMessage("Physics Chamber Master Lock OVERRIDDEN! Access to Chemistry Vault granted.");
  };

  const renderCurrentPuzzle = () => {
    if (currentPuzzleIndex >= TOTAL_PUZZLES && !masterLocksSolved.physics) {
      // Render Master Lock Puzzle
      return (
        <PuzzleWrapper title="Physics Master Lock: Circuit Simulation" description="Configure the circuit correctly. Wrong resistance causes a blackout. (Conceptual: Solve the logic puzzle to proceed)">
            <div className="p-4 text-center space-y-4">
                <p className="text-muted-foreground">This is a conceptual placeholder for the final circuit simulation puzzle for the Physics Chamber.</p>
                <p className="text-sm">Imagine a complex circuit diagram here with interactive components.</p>
                <Button onClick={handleMasterLockSolved} className="glow-button">Simulate Correct Configuration</Button>
            </div>
        </PuzzleWrapper>
      );
    }
    if (masterLocksSolved.physics) {
        return null; // Room cleared
    }

    // Placeholder for other puzzles
    switch(currentPuzzleIndex) {
        case 0:
            return <PuzzleRayOptics onSolve={() => handlePuzzleSolved(0)} onFail={(msg) => handlePuzzleFailed(0, msg)} />;
        case 1: // Example for a second puzzle
            return (
                 <PuzzleWrapper title="Physics Puzzle 2: Motion Graph Matching" description="Match the kinematic graphs to their corresponding equations.">
                    <div className="p-4 text-center">
                        <p className="text-muted-foreground mb-4">Placeholder for Motion Graph Matching puzzle UI.</p>
                        <Button onClick={() => handlePuzzleSolved(1)} className="glow-button">Solve Puzzle 2 (Demo)</Button>
                    </div>
                </PuzzleWrapper>
            );
        // Add cases for puzzles 2, 3, 4
        default:
             return (
                 <PuzzleWrapper title={`Physics Puzzle ${currentPuzzleIndex + 1}`} description="Placeholder for this physics puzzle.">
                    <div className="p-4 text-center">
                        <p className="text-muted-foreground mb-4">Placeholder UI for Puzzle {currentPuzzleIndex + 1}.</p>
                        <Button onClick={() => handlePuzzleSolved(currentPuzzleIndex)} className="glow-button">Solve Puzzle {currentPuzzleIndex+1} (Demo)</Button>
                    </div>
                </PuzzleWrapper>
            );
    }
  };

  return (
    <Card className="w-full max-w-4xl text-center lab-escape-puzzle-card p-6 md:p-8">
      <CardHeader>
        <Zap className="h-16 w-16 mx-auto text-primary mb-4 animate-pulse" />
        <CardTitle className="text-4xl font-headline glow-text-primary">Room 1: Physics Chamber</CardTitle>
        <CardDescription className="text-lg text-muted-foreground mt-2">
          Lasers hum, gears whir. Solve 5 physics puzzles and the master lock to proceed.
        </CardDescription>
        <div className="mt-4">
            Progress: {physicsPuzzlesSolved.filter(s => s).length} / {TOTAL_PUZZLES} Puzzles Solved. 
            Master Lock: {masterLocksSolved.physics ? <CheckCircle className="inline text-green-400"/> : <AlertTriangle className="inline text-yellow-400"/>}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {feedbackMessage && (
          <p className={`text-sm p-3 rounded-md flex items-center justify-center ${feedbackMessage.includes("Solved") || feedbackMessage.includes("OVERRIDDEN") ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {feedbackMessage.includes("Solved") || feedbackMessage.includes("OVERRIDDEN") ? <CheckCircle className="mr-2 h-5 w-5" /> : <AlertTriangle className="mr-2 h-5 w-5" />}
            {feedbackMessage}
          </p>
        )}
        
        {masterLocksSolved.physics ? (
             <div className="p-6 bg-green-600/20 rounded-lg">
                <CheckCircle className="h-12 w-12 mx-auto text-green-300 mb-3"/>
                <p className="text-2xl font-semibold text-green-200">Physics Chamber Cleared!</p>
                <Button onClick={() => advanceRoom('chemistry')} className="mt-6 glow-button bg-primary hover:bg-primary/80">
                    Proceed to Chemistry Vault <ChevronRight className="ml-2"/>
                </Button>
            </div>
        ) : (
            renderCurrentPuzzle()
        )}

      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground mx-auto">Retries Used: {gameState.retriesUsed}</p>
      </CardFooter>
    </Card>
  );
}

    