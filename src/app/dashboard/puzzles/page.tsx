
// src/app/dashboard/puzzles/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Puzzle, Brain, Calculator, Palette, ChevronRight, Lock, Coins, KeyRound, Loader2, Eye, MessageSquare, Lightbulb, FlaskConical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as apiClient from '@/lib/apiClient';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import puzzleDatabase, { type PuzzleData as PuzzleItemClient } from '@/lib/puzzle-data'; // Use local data

interface PuzzleItemDisplay extends PuzzleItemClient {
  locked: boolean;
  icon?: React.ReactNode;
}

const puzzleCategories = [
  { id: 'logic', name: 'Logic Puzzles', icon: <Brain className="h-8 w-8 text-primary" />, description: "Test your reasoning and deduction skills." },
  { id: 'math', name: 'Mathematical Challenges', icon: <Calculator className="h-8 w-8 text-accent" />, description: "Sharpen your numerical and analytical abilities." },
  { id: 'creative', name: 'Creative Conundrums', icon: <Palette className="h-8 w-8 text-secondary" />, description: "Think outside the box and explore your imagination." },
  { id: 'conceptual', name: 'Conceptual Puzzles (NEET Focus)', icon: <Lightbulb className="h-8 w-8 text-green-500" />, description: "Apply your NEET concepts in unique ways." },
  { id: 'visual', name: 'Visual Puzzles', icon: <Eye className="h-8 w-8 text-blue-500" />, description: "Challenge your observation and spatial reasoning." },
  { id: 'word', name: 'Word Puzzles', icon: <MessageSquare className="h-8 w-8 text-orange-500" />, description: "Test your vocabulary and language skills with a scientific twist." },
];

export default function PuzzleDashboardPage() {
  const { toast } = useToast();
  const [puzzles, setPuzzles] = useState<PuzzleItemDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [isProcessingUnlock, setIsProcessingUnlock] = useState(false);
  const [currentFocusCoins, setCurrentFocusCoins] = useState(0);
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        setUserId(session?.user?.id ?? null);
    });
    const getInitialUser = async () => {
        const {data: {user}} = await supabase.auth.getUser();
        setUserId(user?.id ?? null);
    };
    getInitialUser();
    return () => {
        authListener.subscription.unsubscribe();
    };
  }, [supabase]);


  const refreshPuzzleData = useCallback(async () => {
    if (!userId) {
        setIsLoading(false);
        // If not logged in, still show puzzles but all potentially lockable ones will be locked.
        const clientPuzzles = Object.values(puzzleDatabase).map((puzzle): PuzzleItemDisplay => {
            const categoryInfo = puzzleCategories.find(cat => cat.id === puzzle.category.toLowerCase().replace(/\s+/g, '-').replace(/\(neet focus\)/g, 'conceptual'));
            return {
                ...puzzle,
                locked: !!(puzzle.unlock_cost_coins || puzzle.is_password_unlockable), // Lock if it has a cost/password and user not logged in
                icon: categoryInfo?.icon,
            };
        });
        setPuzzles(clientPuzzles);
        setCurrentFocusCoins(0);
        return;
    }
    setIsLoading(true);
    try {
        const unlockedIds = await apiClient.fetchUnlockedContentIds();
        const coins = await apiClient.fetchUserFocusCoins();
        setCurrentFocusCoins(coins);

        const clientPuzzles = Object.values(puzzleDatabase).map((puzzle): PuzzleItemDisplay => {
            const isLockedByOwnership = (puzzle.unlock_cost_coins || puzzle.is_password_unlockable)
                                      ? !unlockedIds.includes(puzzle.id)
                                      : false;
            
            let categoryKey = puzzle.category.toLowerCase().replace(/\s+/g, '-');
            if (categoryKey.includes('conceptual-puzzles-(neet-focus)')) {
                categoryKey = 'conceptual';
            } else if (categoryKey.includes('mathematical-challenges')) {
                 categoryKey = 'math';
            } else if (categoryKey.includes('creative-conundrums')) {
                 categoryKey = 'creative';
            } else if (categoryKey.includes('visual-puzzles')) {
                 categoryKey = 'visual';
            } else if (categoryKey.includes('word-puzzles')) {
                 categoryKey = 'word';
            } else if (categoryKey.includes('logic-puzzles')) {
                 categoryKey = 'logic';
            }


            const categoryInfo = puzzleCategories.find(cat => cat.id === categoryKey);
            return {
                ...puzzle,
                locked: isLockedByOwnership,
                icon: categoryInfo?.icon,
            };
        });
        setPuzzles(clientPuzzles);

    } catch (error: any) {
        console.error("Error loading puzzle dashboard data:", error);
        toast({ variant: 'destructive', title: 'Error loading puzzles', description: error.message });
        // Fallback to showing puzzles as locked if DB fetch fails for unlock status
        const clientPuzzles = Object.values(puzzleDatabase).map((puzzle): PuzzleItemDisplay => {
             const categoryInfo = puzzleCategories.find(cat => cat.id === puzzle.category.toLowerCase().replace(/\s+/g, '-').replace(/\(neet focus\)/g, 'conceptual'));
            return {
                ...puzzle,
                locked: !!(puzzle.unlock_cost_coins || puzzle.is_password_unlockable),
                icon: categoryInfo?.icon,
            };
        });
        setPuzzles(clientPuzzles);
    } finally {
        setIsLoading(false);
    }
  }, [userId, toast]);


  useEffect(() => {
    refreshPuzzleData();
  }, [userId, refreshPuzzleData]);


  const handleUnlockWithCoins = async (puzzle: PuzzleItemClient) => {
    if (!puzzle.unlock_cost_coins || !userId) return;
    setIsProcessingUnlock(true);
    const result = await apiClient.unlockContentWithCoins(puzzle.id, puzzle.unlock_cost_coins);
    if (result.success) {
      toast({ title: "Unlock Successful!", description: `${puzzle.name} unlocked. ${result.message}`, className: 'bg-primary/10 border-primary text-primary-foreground' });
      if (result.newCoinBalance !== undefined) setCurrentFocusCoins(result.newCoinBalance);
      await refreshPuzzleData();
    } else {
      toast({ variant: 'destructive', title: 'Unlock Failed', description: result.message || "Could not unlock with coins." });
    }
    setIsProcessingUnlock(false);
  };

  const handleUnlockWithPassword = async (puzzle: PuzzleItemClient) => {
    if (!userId) return;
    setIsProcessingUnlock(true);
    const result = await apiClient.unlockContentWithPassword(puzzle.id, passwordInput);
    if (result.success) {
      toast({ title: "Unlock Successful!", description: `${puzzle.name} unlocked. ${result.message}`, className: 'bg-accent/10 border-accent text-accent-foreground' });
      await refreshPuzzleData();
    } else {
      toast({ variant: 'destructive', title: 'Unlock Failed', description: result.message || "Incorrect password." });
    }
    setPasswordInput('');
    setIsProcessingUnlock(false);
  };


  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }
  
  const getCategoryIcon = (categoryName: string) => {
    let categoryKey = categoryName.toLowerCase().replace(/\s+/g, '-');
    if (categoryKey.includes('conceptual-puzzles-(neet-focus)')) {
        categoryKey = 'conceptual';
    } else if (categoryKey.includes('mathematical-challenges')) {
         categoryKey = 'math';
    } else if (categoryKey.includes('creative-conundrums')) {
         categoryKey = 'creative';
    } else if (categoryKey.includes('visual-puzzles')) {
         categoryKey = 'visual';
    } else if (categoryKey.includes('word-puzzles')) {
         categoryKey = 'word';
    } else if (categoryKey.includes('logic-puzzles')) {
         categoryKey = 'logic';
    }
    const categoryInfo = puzzleCategories.find(cat => cat.id === categoryKey);
    return categoryInfo?.icon || <Puzzle className="h-8 w-8 text-gray-400"/>;
  }


  return (
    <div className="space-y-10 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Puzzle className="mr-4 h-10 w-10" /> Puzzle Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Challenge your mind with a variety of puzzles. Current Focus Coins: {currentFocusCoins} 🪙
        </p>
      </header>

      <div className="space-y-12">
        {puzzleCategories.map(category => {
          const categoryPuzzles = puzzles.filter(p => p.category === category.name);
          if (categoryPuzzles.length === 0 && !isLoading) return null;

          return (
            <section key={category.id}>
              <div className="flex items-center mb-4 border-b border-border/30 pb-3">
                {getCategoryIcon(category.name)}
                <h2 className="text-2xl md:text-3xl font-headline font-semibold ml-3 glow-text-accent">{category.name}</h2>
              </div>
              <p className="text-muted-foreground mb-6 ml-11 -mt-3">{category.description}</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryPuzzles.map(puzzle => (
                  <Card key={puzzle.id} className={`interactive-card shadow-lg flex flex-col justify-between ${puzzle.locked ? 'opacity-75 bg-muted/30' : 'bg-card'}`}>
                    <CardHeader>
                      <CardTitle className={`text-xl font-semibold ${puzzle.locked ? 'text-muted-foreground' : 'glow-text-primary'}`}>{puzzle.name}</CardTitle>
                      {puzzle.subject && <p className="text-xs text-muted-foreground mt-1">Subject: {puzzle.subject}</p>}
                      <CardDescription className="text-sm mt-1 min-h-[3em]">{puzzle.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-end">
                      {puzzle.locked ? (
                          <div className="space-y-2 mt-auto">
                            {puzzle.unlock_cost_coins && (
                              <Button
                                  size="sm"
                                  className="w-full glow-button"
                                  variant="outline"
                                  onClick={() => handleUnlockWithCoins(puzzle)}
                                  disabled={isProcessingUnlock || currentFocusCoins < puzzle.unlock_cost_coins}
                              >
                                {isProcessingUnlock ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : <Coins className="mr-1 h-4 w-4"/>}
                                {currentFocusCoins < puzzle.unlock_cost_coins ? `Need ${puzzle.unlock_cost_coins} Coins` : `Unlock with ${puzzle.unlock_cost_coins} Coins`}
                              </Button>
                            )}
                            {puzzle.is_password_unlockable && (
                               <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                      <Button size="sm" className="w-full glow-button" variant="outline" disabled={isProcessingUnlock}>
                                      <KeyRound className="mr-1 h-4 w-4"/> Unlock with Password
                                      </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                      <AlertDialogHeader>
                                      <AlertDialogTitle>Unlock {puzzle.name}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          Enter the password to unlock this puzzle. (Demo password: NEETPREP2025)
                                      </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <Input
                                          type="password"
                                          placeholder="Enter password"
                                          value={passwordInput}
                                          onChange={(e) => setPasswordInput(e.target.value)}
                                          className="input-glow"
                                      />
                                      <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setPasswordInput('')}>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleUnlockWithPassword(puzzle)} disabled={isProcessingUnlock || !passwordInput}>
                                          {isProcessingUnlock ? <Loader2 className="h-4 w-4 animate-spin"/> : "Unlock"}
                                      </AlertDialogAction>
                                      </AlertDialogFooter>
                                  </AlertDialogContent>
                              </AlertDialog>
                            )}
                            {!puzzle.unlock_cost_coins && !puzzle.is_password_unlockable && puzzle.locked && (
                               <Button size="sm" className="w-full" disabled>
                                  <Lock className="mr-1 h-4 w-4"/> Locked (Story Progression)
                              </Button>
                             )}
                          </div>
                        ) : (
                          <Button asChild size="sm" className="w-full glow-button mt-auto">
                            <Link href={`/dashboard/puzzles/play/${puzzle.id}`}>
                              Start Puzzle <ChevronRight className="ml-1 h-4 w-4"/>
                            </Link>
                          </Button>
                        )}
                    </CardContent>
                  </Card>
                ))}
                {categoryPuzzles.length === 0 && !isLoading && (
                  <p className="text-muted-foreground col-span-full text-center">No puzzles in this category yet. Stay tuned!</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <p className="text-center text-muted-foreground mt-8 text-sm">
        Note: Puzzles use local data for Level 1. AI integration for subsequent levels and DB persistence are planned.
      </p>
    </div>
  );
}
