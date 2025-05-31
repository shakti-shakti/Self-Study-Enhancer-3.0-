
// src/app/dashboard/games/neet-lab-escape/page.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserGameProgress, NEETLabEscapeState, GameSpecificState } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Not used directly here, but by sub-components
import { useToast } from '@/hooks/use-toast';
import { Loader2, FlaskConical, DoorOpen, AlertTriangle, ChevronRight } from 'lucide-react';
import IntroLabEscape from '@/components/games/neet-lab-escape/IntroLabEscape';
import PhysicsChamber from '@/components/games/neet-lab-escape/PhysicsChamber';
// Import other room components
// import ChemistryVault from '@/components/games/neet-lab-escape/ChemistryVault';
// import BotanyDome from '@/components/games/neet-lab-escape/BotanyDome';
// import ZoologyDen from '@/components/games/neet-lab-escape/ZoologyDen';
// import FinalHallway from '@/components/games/neet-lab-escape/FinalHallway';
import GameTimer from '@/components/games/GameTimer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Used for fallback display


const GAME_ID_LAB_ESCAPE = "neet_lab_escape";
const TOTAL_GAME_TIME_SECONDS = 30 * 60; // 30 minutes for the entire escape

const initialLabEscapeState: NEETLabEscapeState = {
  currentRoom: 'intro',
  physicsPuzzlesSolved: Array(5).fill(false), // Assuming 5 puzzles per room for now
  chemistryPuzzlesSolved: Array(5).fill(false),
  botanyPuzzlesSolved: Array(5).fill(false),
  zoologyPuzzlesSolved: Array(5).fill(false),
  masterLocksSolved: { physics: false, chemistry: false, botany: false, zoology: false },
  remainingTime: TOTAL_GAME_TIME_SECONDS,
  retriesUsed: 0,
  finalQuestionAnsweredCorrectly: undefined,
};

export default function NEETLabEscapePage() {
  const [isPending, startTransition] = useTransition();
  const [userId, setUserId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<NEETLabEscapeState>(initialLabEscapeState);
  const [isLoadingGame, setIsLoadingGame] = useState(true);

  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUserAndLoadProgress = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadGameProgress(user.id);
      } else {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'Please log in to play.' });
        setIsLoadingGame(false);
      }
    };
    getCurrentUserAndLoadProgress();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGameProgress = async (currentUserId: string) => {
    setIsLoadingGame(true);
    startTransition(async () => {
      const { data, error } = await supabase
        .from('user_game_progress')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('game_id', GAME_ID_LAB_ESCAPE)
        .single();

      if (error && error.code !== 'PGRST116') {
        toast({ variant: 'destructive', title: 'Error loading progress', description: error.message });
      } else if (data && data.game_specific_state) {
         const loadedState = data.game_specific_state as Partial<NEETLabEscapeState>;
         setGameState({
            ...initialLabEscapeState, // Base default
            ...loadedState, // Loaded overrides
            // Ensure arrays and nested objects are correctly initialized/merged
            physicsPuzzlesSolved: loadedState.physicsPuzzlesSolved || Array(5).fill(false),
            chemistryPuzzlesSolved: loadedState.chemistryPuzzlesSolved || Array(5).fill(false),
            botanyPuzzlesSolved: loadedState.botanyPuzzlesSolved || Array(5).fill(false),
            zoologyPuzzlesSolved: loadedState.zoologyPuzzlesSolved || Array(5).fill(false),
            masterLocksSolved: {
                ...initialLabEscapeState.masterLocksSolved,
                ...(loadedState.masterLocksSolved || {}),
            },
            remainingTime: loadedState.remainingTime !== undefined ? loadedState.remainingTime : TOTAL_GAME_TIME_SECONDS,

         });
      } else {
        await saveGameProgress(currentUserId, initialLabEscapeState);
        setGameState(initialLabEscapeState);
      }
      setIsLoadingGame(false);
    });
  };

  const saveGameProgress = async (currentUserId: string, newGameState: NEETLabEscapeState) => {
    if (!currentUserId) return;
    const progressData: Omit<UserGameProgress, 'id' | 'last_played'> & { last_played?: string } = {
      user_id: currentUserId,
      game_id: GAME_ID_LAB_ESCAPE,
      current_chapter: null, 
      current_room: newGameState.currentRoom,
      game_specific_state: newGameState as GameSpecificState,
      score: calculateScore(newGameState), 
      last_played: new Date().toISOString(),
      completed_at: (newGameState.currentRoom === 'escaped' || newGameState.currentRoom === 'failed') ? new Date().toISOString() : null,
    };

    const { error } = await supabase
      .from('user_game_progress')
      .upsert(progressData, { onConflict: 'user_id, game_id' });

    if (error) {
      toast({ variant: 'destructive', title: 'Error saving progress', description: error.message });
    }
  };
  
  const calculateScore = (currentState: NEETLabEscapeState): number => {
    let score = 0;
    const puzzleSets = [currentState.physicsPuzzlesSolved, currentState.chemistryPuzzlesSolved, currentState.botanyPuzzlesSolved, currentState.zoologyPuzzlesSolved];
    puzzleSets.forEach(set => score += set.filter(solved => solved).length * 10); // 10 points per puzzle
    Object.values(currentState.masterLocksSolved).forEach(solved => { if(solved) score += 50; }); // 50 per master lock
    if(currentState.currentRoom === 'escaped') score += 100; // Escape bonus
    if (currentState.finalQuestionAnsweredCorrectly) score += 50; // Bonus for final question
    score -= currentState.retriesUsed * 5; // Penalty for retries
    return Math.max(0, score); // Ensure score is not negative
  };


  const updateGameState = (newState: Partial<NEETLabEscapeState>) => {
    setGameState(prev => {
      const updatedState = { 
        ...prev, 
        ...newState,
        // Ensure nested objects like masterLocksSolved are correctly merged
        masterLocksSolved: newState.masterLocksSolved ? {...prev.masterLocksSolved, ...newState.masterLocksSolved} : prev.masterLocksSolved,
      };
      if (userId) saveGameProgress(userId, updatedState);
      return updatedState;
    });
  };
  
  const handleTimeUp = () => {
    updateGameState({ currentRoom: 'failed', remainingTime: 0 });
  };
  
  const advanceRoom = (nextRoom: NEETLabEscapeState['currentRoom']) => {
    updateGameState({currentRoom: nextRoom});
  }

  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    if (gameState.currentRoom !== 'intro' && gameState.currentRoom !== 'escaped' && gameState.currentRoom !== 'failed' && gameState.remainingTime > 0) {
      timerInterval = setInterval(() => {
        setGameState(prev => {
          const newTime = prev.remainingTime - 1;
          if (newTime <= 0) {
            clearInterval(timerInterval);
            handleTimeUp();
            return { ...prev, remainingTime: 0, currentRoom: 'failed' };
          }
          // Save progress less frequently to avoid too many DB writes, e.g., every 10 seconds
          if (newTime % 10 === 0 && userId) {
            // Only save the time, not the full state, to avoid overwriting rapid puzzle updates
            saveGameProgress(userId, {...prev, remainingTime: newTime});
          }
          return { ...prev, remainingTime: newTime };
        });
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.currentRoom, gameState.remainingTime, userId]);


  if (isLoadingGame) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-slate-900/80 rounded-xl shadow-2xl shadow-primary/30 border border-primary/50">
        <Loader2 className="h-24 w-24 animate-spin text-primary mb-6" />
        <p className="text-2xl font-headline text-primary-foreground glow-text-primary">Initializing Lab Security Systems...</p>
        <p className="text-lg text-muted-foreground">Preparing experiment parameters...</p>
      </div>
    );
  }
  
   if (!userId) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-slate-900/80 rounded-xl shadow-2xl shadow-destructive/30 border border-destructive/50">
            <FlaskConical className="h-24 w-24 text-destructive mb-6" />
            <p className="text-2xl font-headline text-destructive-foreground glow-text-destructive">Access Denied</p>
            <p className="text-lg text-muted-foreground">Log in to attempt The NEET Lab Escape.</p>
            <Button onClick={() => window.location.href = '/login'} className="mt-6 glow-button">Go to Login</Button>
        </div>
    );
  }


  const renderGameContent = () => {
    switch (gameState.currentRoom) {
      case 'intro':
        return <IntroLabEscape onStartGame={() => updateGameState({ currentRoom: 'physics' })} />;
      case 'physics':
        return <PhysicsChamber gameState={gameState} updateGameState={updateGameState} advanceRoom={advanceRoom} />;
      // case 'chemistry':
      //   return <ChemistryVault gameState={gameState} updateGameState={updateGameState} advanceRoom={advanceRoom} />;
      // case 'botany':
      //   return <BotanyDome gameState={gameState} updateGameState={updateGameState} advanceRoom={advanceRoom} />;
      // case 'zoology':
      //   return <ZoologyDen gameState={gameState} updateGameState={updateGameState} advanceRoom={advanceRoom} />;
      // case 'final_hallway':
      //   return <FinalHallway gameState={gameState} updateGameState={updateGameState} advanceRoom={advanceRoom} />;
      case 'escaped':
        return (
            <div className="text-center p-8 bg-gradient-to-br from-green-500/20 via-background to-primary/20 rounded-xl shadow-2xl shadow-green-400/40 border border-green-500/50">
                <DoorOpen className="h-20 w-20 mx-auto text-green-400 mb-4" />
                <h2 className="text-4xl font-headline font-bold text-green-300 glow-text-primary mb-4">Lab Escaped!</h2>
                <p className="text-xl text-foreground mb-6">Congratulations! You've proven your NEET knowledge and escaped the lab!</p>
                <p className="text-lg text-muted-foreground">Final Score: {calculateScore(gameState)}</p>
                <p className="text-lg text-muted-foreground">Time Remaining: {Math.floor(gameState.remainingTime / 60)}m {gameState.remainingTime % 60}s</p>
                <Button onClick={() => updateGameState(initialLabEscapeState)} className="mt-8 glow-button">
                    Play Again <ChevronRight className="ml-2"/>
                </Button>
            </div>
        );
      case 'failed':
         return (
            <div className="text-center p-8 bg-gradient-to-br from-red-500/20 via-background to-destructive/20 rounded-xl shadow-2xl shadow-red-400/40 border border-red-500/50">
                <AlertTriangle className="h-20 w-20 mx-auto text-red-400 mb-4" />
                <h2 className="text-4xl font-headline font-bold text-red-300 glow-text-destructive mb-4">Experiment Failed!</h2>
                <p className="text-xl text-foreground mb-6">{gameState.remainingTime <= 0 ? "Time ran out!" : "Too many errors."} The lab remains sealed.</p>
                <p className="text-lg text-muted-foreground">Final Score: {calculateScore(gameState)}</p>
                <Button onClick={() => updateGameState(initialLabEscapeState)} className="mt-8 glow-button">
                    Try Again <ChevronRight className="ml-2"/>
                </Button>
            </div>
        );
      default:
        // Fallback for unimplemented rooms
         return (
             <Card className="w-full max-w-xl text-center lab-escape-puzzle-card p-6">
                <CardHeader>
                    <FlaskConical className="h-16 w-16 mx-auto text-yellow-400 mb-4" />
                    <CardTitle className="text-3xl font-headline glow-text-primary">Containment Breach!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg text-muted-foreground mb-4">Room "{gameState.currentRoom}" is currently unstable or not yet constructed.</p>
                     <Button onClick={() => updateGameState({currentRoom: 'intro'})} className="mt-4 glow-button">
                        Return to Lab Entrance
                    </Button>
                </CardContent>
            </Card>
        );
    }
  };

  return (
    <div className="neet-lab-escape-container text-foreground min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center p-4 md:p-6 relative">
        {gameState.currentRoom !== 'intro' && gameState.currentRoom !== 'escaped' && gameState.currentRoom !== 'failed' && (
            <GameTimer remainingTime={gameState.remainingTime} />
        )}
      {renderGameContent()}
    </div>
  );
}

// Basic CSS for Lab Escape theme
const labEscapeStyles = `
  .neet-lab-escape-container {
    background: linear-gradient(135deg, hsl(var(--background) / 0.9), hsl(var(--background) / 0.7)), 
                radial-gradient(ellipse at center, hsl(var(--primary)/0.1) 0%, transparent 70%);
    color: hsl(var(--foreground));
  }
  .lab-escape-text-accent {
    color: hsl(var(--primary));
    text-shadow: 0 0 6px hsl(var(--primary)/0.6);
  }
  .lab-escape-puzzle-card { /* Styling for cards within this game */
    background-color: hsl(var(--card) / 0.85); /* Use card color with alpha */
    border: 1px solid hsl(var(--border)/0.7);
    backdrop-filter: blur(4px);
    color: hsl(var(--card-foreground));
  }
`;

if (typeof window !== 'undefined') {
   if (!document.getElementById('neet-lab-escape-styles')) {
    const styleSheet = document.createElement("style");
    styleSheet.id = 'neet-lab-escape-styles';
    styleSheet.type = "text/css";
    styleSheet.innerText = labEscapeStyles;
    document.head.appendChild(styleSheet);
  }
}
    
