
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // Merge with initial state to ensure all keys are present if new ones were added
        const loadedState = data.game_specific_state as Partial<ChronoMindState>;
        setGameState({
          ...initialChronoMindState, // Start with a complete default structure
          ...loadedState, // Override with loaded values
          chapter1Progress: { // Ensure nested objects are also merged/defaulted
            ...initialChronoMindState.chapter1Progress,
            ...(loadedState.chapter1Progress || {}),
          }
        });
      } else {
        // No existing progress, use initial state. Save it.
        await saveGameProgress(currentUserId, initialChronoMindState);
        setGameState(initialChronoMindState); // ensure local state is set
      }
      setIsLoadingGame(false);
    });
  };

  const saveGameProgress = async (currentUserId: string, newGameState: ChronoMindState) => {
    if (!currentUserId) return;
    // This function might be called rapidly; consider debouncing or less frequent saves if performance issues arise
    // For now, direct save on each update is fine.
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
  };

  const updateGameState = (newState: Partial<ChronoMindState>) => {
    setGameState(prev => {
      const updatedState = { 
        ...prev, 
        ...newState,
        // Ensure nested objects like chapterProgress are correctly merged
        chapter1Progress: newState.chapter1Progress ? {...prev.chapter1Progress, ...newState.chapter1Progress} : prev.chapter1Progress, 
      };
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
 <Button onClick={() => window.location.href = '/login'} className="mt-6 glow-button text-2xl px-8 py-4">Go to Login</Button>
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
 <Button onClick={() => updateGameState(initialChronoMindState)} className="mt-8 glow-button text-2xl px-8 py-4">
                    Play Again <ChevronRight className="ml-2"/>
                </Button>
            </div>
        );
      default:
        // This handles cases where a chapter might not be implemented yet.
        return (
             <Card className="w-full max-w-xl text-center chronomind-puzzle-card p-6">
                <CardHeader>
                    <Zap className="h-16 w-16 mx-auto text-yellow-400 mb-4" />
                    <CardTitle className="text-3xl font-headline glow-text-primary">Temporal Anomaly Detected</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg text-muted-foreground mb-4">Chapter "{gameState.currentChapter}" is currently inaccessible or under construction in this reality stream.</p>
                     <Button onClick={() => updateGameState({currentChapter: 'intro'})} className="mt-4 glow-button">
                        Return to Introduction
                    </Button>
                </CardContent>
            </Card>
        );
    }
  };

  return (
    <div className="chronomind-game-container text-foreground min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center p-4 md:p-8">
      {renderGameContent()}
    </div>
  );
}

const chronomindStyles = `
  .chronomind-game-container {
    background: radial-gradient(ellipse at bottom, hsl(275, 25%, 8%), hsl(275, 30%, 5%)); /* Darker purples */
    color: hsl(var(--foreground)); /* Use theme foreground */
  }
  .chronomind-text-accent { /* Use a specific class if needed, or rely on theme accent */
    color: hsl(var(--accent));
    text-shadow: 0 0 8px hsl(var(--accent)/0.7);
  }
  .chronomind-puzzle-card { /* Styling for cards within this game */
    background-color: hsla(var(--card-rgb), 0.8); /* Use card color with alpha */
    border: 1px solid hsl(var(--accent)/0.5);
    backdrop-filter: blur(5px);
    color: hsl(var(--card-foreground));
  }
`;

if (typeof window !== 'undefined') {
  // Check if style already exists to prevent duplicates during HMR
  if (!document.getElementById('chronomind-game-styles')) {
    const styleSheet = document.createElement("style");
    styleSheet.id = 'chronomind-game-styles';
    styleSheet.type = "text/css";
    styleSheet.innerText = chronomindStyles.replace(/var\(--card-rgb\)/g, getComputedStyle(document.documentElement).getPropertyValue('--card').trim().replace('hsl(','').replace(')','').split(' ').join(',')); // Hack to get RGB from HSL for hsla
    document.head.appendChild(styleSheet);
  }
}
    
