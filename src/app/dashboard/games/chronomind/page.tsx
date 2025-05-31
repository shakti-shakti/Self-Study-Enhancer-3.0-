
// src/app/dashboard/games/chronomind/page.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserGameProgress, ChronoMindState, GameSpecificState } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, ChevronRight } from 'lucide-react';
import IntroChrono from '@/components/games/chronomind/IntroChrono';
import Chapter1TimeChamber from '@/components/games/chronomind/Chapter1TimeChamber';
// Import other chapter components as they are created
// import Chapter2ChemicalCollapse from '@/components/games/chronomind/Chapter2ChemicalCollapse';
// import Chapter3BiocodeSimulator from '@/components/games/chronomind/Chapter3BiocodeSimulator';
// import Chapter4MindFracture from '@/components/games/chronomind/Chapter4MindFracture';
// import Chapter5ChronoCore from '@/components/games/chronomind/Chapter5ChronoCore';

const GAME_ID = "chronomind_quantum_rescue";

const initialChronoMindState: ChronoMindState = {
  currentChapter: 'intro',
  chapter1Progress: {
    kinematicsSolved: false,
    timeDilationSolved: false,
    projectileMotionSolved: false,
  },
  playerChoices: {},
  memoryLossEvents: 0,
};

export default function ChronoMindPage() {
  const [isPending, startTransition] = useTransition();
  const [userId, setUserId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<ChronoMindState>(initialChronoMindState);
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
  }, []);

  const loadGameProgress = async (currentUserId: string) => {
    setIsLoadingGame(true);
    startTransition(async () => {
      const { data, error } = await supabase
        .from('user_game_progress')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('game_id', GAME_ID)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
        toast({ variant: 'destructive', title: 'Error loading progress', description: error.message });
      } else if (data && data.game_specific_state) {
        setGameState(data.game_specific_state as ChronoMindState);
      } else {
        // No existing progress, use initial state. Save it.
        await saveGameProgress(currentUserId, initialChronoMindState);
      }
      setIsLoadingGame(false);
    });
  };

  const saveGameProgress = async (currentUserId: string, newGameState: ChronoMindState) => {
    if (!currentUserId) return;
    startTransition(async () => {
      const progressData: Omit<UserGameProgress, 'id' | 'last_played'> & { last_played?: string } = {
        user_id: currentUserId,
        game_id: GAME_ID,
        current_chapter: newGameState.currentChapter,
        current_room: null, // ChronoMind uses chapters primarily
        game_specific_state: newGameState as GameSpecificState,
        score: null, // ChronoMind scoring is based on endings/accuracy, handle later
        last_played: new Date().toISOString(),
        completed_at: newGameState.currentChapter === 'completed' ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from('user_game_progress')
        .upsert(progressData, { onConflict: 'user_id, game_id' });

      if (error) {
        toast({ variant: 'destructive', title: 'Error saving progress', description: error.message });
      }
    });
  };

  const updateGameState = (newState: Partial<ChronoMindState>) => {
    setGameState(prev => {
      const updatedState = { ...prev, ...newState };
      if (userId) saveGameProgress(userId, updatedState);
      return updatedState;
    });
  };

  const handleStartGame = () => {
    updateGameState({ currentChapter: 'chapter1' });
  };
  
  const advanceChapter = (nextChapter: ChronoMindState['currentChapter']) => {
    updateGameState({currentChapter: nextChapter});
  }

  if (isLoadingGame) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-black/80 rounded-xl shadow-2xl shadow-accent/30 border border-accent/50">
        <Loader2 className="h-24 w-24 animate-spin text-accent mb-6" />
        <p className="text-2xl font-headline text-accent-foreground glow-text-accent">Loading ChronoMind Protocol...</p>
        <p className="text-lg text-muted-foreground">Initializing quantum pathways...</p>
      </div>
    );
  }
  
  if (!userId) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-black/80 rounded-xl shadow-2xl shadow-destructive/30 border border-destructive/50">
            <Zap className="h-24 w-24 text-destructive mb-6" />
            <p className="text-2xl font-headline text-destructive-foreground glow-text-destructive">Authentication Required</p>
            <p className="text-lg text-muted-foreground">Please log in to access ChronoMind.</p>
            <Button onClick={() => window.location.href = '/login'} className="mt-6 glow-button">Go to Login</Button>
        </div>
    );
  }


  const renderGameContent = () => {
    switch (gameState.currentChapter) {
      case 'intro':
        return <IntroChrono onStartGame={handleStartGame} />;
      case 'chapter1':
        return <Chapter1TimeChamber gameState={gameState} updateGameState={updateGameState} advanceChapter={advanceChapter} />;
      // case 'chapter2':
      //   return <Chapter2ChemicalCollapse gameState={gameState} updateGameState={updateGameState} advanceChapter={advanceChapter} />;
      // case 'chapter3':
      //   return <Chapter3BiocodeSimulator gameState={gameState} updateGameState={updateGameState} advanceChapter={advanceChapter} />;
      // case 'chapter4':
      //   return <Chapter4MindFracture gameState={gameState} updateGameState={updateGameState} advanceChapter={advanceChapter} />;
      // case 'chapter5':
      //   return <Chapter5ChronoCore gameState={gameState} updateGameState={updateGameState} advanceChapter={advanceChapter} />;
      case 'completed':
        return (
            <div className="text-center p-8 bg-gradient-to-br from-primary/20 via-background to-accent/20 rounded-xl shadow-2xl shadow-primary/40 border border-primary/50">
                <Zap className="h-20 w-20 mx-auto text-primary mb-4" />
                <h2 className="text-4xl font-headline font-bold text-primary glow-text-primary mb-4">Multiverse Stabilized!</h2>
                <p className="text-xl text-foreground mb-6">You've successfully navigated the quantum decay. Your mind is truly unlocked.</p>
                {/* TODO: Display specific ending based on playerChoices, accuracy etc. */}
                <p className="text-lg text-muted-foreground">Thank you for playing ChronoMind.</p>
                 <Button onClick={() => updateGameState(initialChronoMindState)} className="mt-8 glow-button">
                    Play Again <ChevronRight className="ml-2"/>
                </Button>
            </div>
        );
      default:
        return <p>Loading chapter...</p>;
    }
  };

  return (
    <div className="chronomind-game-container text-foreground min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center p-4 md:p-8">
      {/* Game-specific background or wrapper if needed */}
      {renderGameContent()}
    </div>
  );
}

// Basic CSS for ChronoMind theme (can be expanded in globals.css or here)
// For a real game, you'd have more sophisticated styling.
// This is just to give a hint of the sci-fi theme.
const chronomindStyles = `
  .chronomind-game-container {
    background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
    color: #e0e0e0;
  }
  .chronomind-text-accent {
    color: hsl(var(--accent));
    text-shadow: 0 0 8px hsl(var(--accent)/0.7);
  }
  .chronomind-puzzle-card {
    background-color: rgba(20, 20, 40, 0.7);
    border: 1px solid hsl(var(--accent)/0.5);
    backdrop-filter: blur(5px);
  }
`;

if (typeof window !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = chronomindStyles;
  document.head.appendChild(styleSheet);
}

    