
// src/app/dashboard/puzzles/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Puzzle, Brain, Calculator, Palette, ChevronRight, Lock, Coins, KeyRound, Eye, MessageSquare, Lightbulb, FlaskConical, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as apiClient from '@/lib/apiClient'; // Using the placeholder API client

interface PuzzleItem {
  id: string;
  name: string;
  level_hint?: string;
  category: string;
  description: string;
  locked: boolean; // Will be dynamically determined
  unlock_cost_coins?: number | null;
  is_password_unlockable?: boolean | null;
}

const initialPuzzles: PuzzleItem[] = [
  // Logic Puzzles
  { id: 'logic_001', name: 'The Bridge Crossing Riddle', level_hint: "Intermediate", category: 'Logic Puzzles', description: 'Four people need to cross a bridge at night with one flashlight. Can you figure out the fastest way?', locked: false },
  { id: 'logic_002', name: 'Knights and Knaves', level_hint: "Intermediate", category: 'Logic Puzzles', description: 'On an island of knights (always tell truth) and knaves (always lie), determine who is who based on their statements.', locked: true, unlock_cost_coins: 50 },
  { id: 'logic_003', name: 'Einstein\'s Riddle (Zebra Puzzle)', level_hint: "Expert", category: 'Logic Puzzles', description: 'A classic logic grid puzzle attributed to Einstein. Who owns the zebra?', locked: true, unlock_cost_coins: 100, is_password_unlockable: true },
  { id: 'logic_004', name: 'The Missing Symbol', level_hint: "Beginner", category: 'Logic Puzzles', description: 'Find the logical operator that completes the sequence: A ? B = C.', locked: false },
  { id: 'logic_005', name: 'River Crossing Puzzle', level_hint: "Intermediate", category: 'Logic Puzzles', description: 'Get the farmer, wolf, goat, and cabbage across the river safely.', locked: true, unlock_cost_coins: 60, is_password_unlockable: true },

  // Mathematical Challenges
  { id: 'math_001', name: 'The Sequence Solver', level_hint: "Beginner", category: 'Mathematical Challenges', description: 'Find the next number in this perplexing sequence: 1, 1, 2, 3, 5, 8, ?', locked: false },
  { id: 'math_002', name: 'Diophantine Dilemma', level_hint: "Expert", category: 'Mathematical Challenges', description: 'Find integer solutions to a classic Diophantine equation.', locked: true, unlock_cost_coins: 75, is_password_unlockable: true },
  { id: 'math_003', name: 'The Tower of Hanoi', level_hint: "Intermediate", category: 'Mathematical Challenges', description: 'Move the stack of disks to another peg with minimal moves.', locked: false },
  { id: 'math_004', name: 'Probability Paradox', level_hint: "Intermediate", category: 'Mathematical Challenges', description: 'Solve the Monty Hall problem conceptually.', locked: true, unlock_cost_coins: 60 },
  { id: 'math_005', name: 'Cryptarithmetic Challenge', level_hint: "Expert", category: 'Mathematical Challenges', description: 'Solve a puzzle where letters represent digits (e.g., SEND + MORE = MONEY).', locked: true, unlock_cost_coins: 90 },
  
  // Creative Conundrums
  { id: 'creative_001', name: 'Alternative Uses', level_hint: "Beginner", category: 'Creative Conundrums', description: 'List as many alternative uses for a common brick as you can in 2 minutes.', locked: false },
  { id: 'creative_002', name: 'Story Spark', level_hint: "Intermediate", category: 'Creative Conundrums', description: 'Write a compelling short story (max 100 words) based on three random words: Dragon, Coffee, Starlight.', locked: true, unlock_cost_coins: 30 },
  { id: 'creative_003', name: 'Rebus Rally', level_hint: "Beginner", category: 'Creative Conundrums', description: 'Decipher picture-based word puzzles.', locked: false},
  { id: 'creative_004', name: 'Concept Mashup', level_hint: "Expert", category: 'Creative Conundrums', description: 'Combine two unrelated scientific concepts into a novel invention idea.', locked: true, unlock_cost_coins: 50, is_password_unlockable: true },
  { id: 'creative_005', name: 'Unusual Invention Design', level_hint: "Intermediate", category: 'Creative Conundrums', description: 'Design an invention to solve a very specific, unusual problem.', locked: true, unlock_cost_coins: 40 },

  // Conceptual Puzzles (NEET-related)
  { id: 'conceptual_phy_001', name: 'Vector Voyage', level_hint: "Beginner", category: 'Conceptual Puzzles (NEET Focus)', description: 'A ship sails 3km East, then 4km North. What is its displacement? (Solve conceptually)', locked: false },
  { id: 'conceptual_chem_001', name: 'Balancing Act', level_hint: "Intermediate", category: 'Conceptual Puzzles (NEET Focus)', description: 'Conceptually balance the chemical equation: CH4 + O2 -> CO2 + H2O.', locked: true, unlock_cost_coins: 40, is_password_unlockable: true },
  { id: 'conceptual_bio_001', name: 'Genetic Code Cracker', level_hint: "Intermediate", category: 'Conceptual Puzzles (NEET Focus)', description: 'Given a DNA sequence, determine the mRNA and corresponding amino acid sequence using a conceptual codon chart.', locked: false},
  { id: 'conceptual_phy_002', name: 'Energy Transformation', level_hint: "Intermediate", category: 'Conceptual Puzzles (NEET Focus)', description: 'Describe the energy transformations in a hydroelectric dam from water reservoir to electricity.', locked: true, unlock_cost_coins: 65},
  { id: 'conceptual_chem_002', name: 'Ideal Gas Law Scenario', level_hint: "Expert", category: 'Conceptual Puzzles (NEET Focus)', description: 'Explain how changing pressure affects volume and temperature for an ideal gas, given certain conditions.', locked: true, unlock_cost_coins: 70, is_password_unlockable: true },

  // Visual Puzzles
  { id: 'visual_001', name: 'Spot the Difference', level_hint: "Beginner", category: 'Visual Puzzles', description: 'Find all the differences between two seemingly identical images.', locked: false },
  { id: 'visual_002', name: 'Optical Illusion Analysis', level_hint: "Intermediate", category: 'Visual Puzzles', description: 'Explain the principles behind a famous optical illusion.', locked: true, unlock_cost_coins: 60 },
  { id: 'visual_003', name: 'Pattern Recognition', level_hint: "Intermediate", category: 'Visual Puzzles', description: 'Identify the next shape in a complex visual sequence.', locked: false },
  { id: 'visual_004', name: 'Hidden Object Hunt', level_hint: "Beginner", category: 'Visual Puzzles', description: 'Find a list of hidden objects within a cluttered image.', locked: true, unlock_cost_coins: 35 },

  // Word Puzzles
  { id: 'word_001', name: 'Anagram Hunt (Science)', level_hint: "Beginner", category: 'Word Puzzles', description: 'Unscramble these NEET-related terms: HPOYSCIT, GEBYOOLI, HRTYSMICE.', locked: false },
  { id: 'word_002', name: 'Crossword Challenge (Bio)', level_hint: "Intermediate", category: 'Word Puzzles', description: 'Complete a mini-crossword with biological clues.', locked: true, unlock_cost_coins: 45, is_password_unlockable: true },
  { id: 'word_003', name: 'Scientific Term Origin', level_hint: "Expert", category: 'Word Puzzles', description: 'Guess the etymology of a complex scientific term.', locked: true, unlock_cost_coins: 55 },
  { id: 'word_004', name: 'Missing Vowels (Chemistry)', level_hint: "Beginner", category: 'Word Puzzles', description: 'Fill in the missing vowels for common chemical compound names (e.g., S_LF_R_C _C_D).', locked: false },
];

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
  const [puzzles, setPuzzles] = useState<PuzzleItem[]>(initialPuzzles);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [isProcessingUnlock, setIsProcessingUnlock] = useState(false);
  const [currentFocusCoins, setCurrentFocusCoins] = useState(0);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      // TODO: Replace with actual backend calls
      const unlockedIds = await apiClient.fetchUnlockedContentIds();
      const coins = await apiClient.fetchUserFocusCoins();
      setCurrentFocusCoins(coins);
      
      setPuzzles(prevPuzzles => 
        prevPuzzles.map(puzzle => ({
          ...puzzle,
          locked: puzzle.unlock_cost_coins || puzzle.is_password_unlockable ? !unlockedIds.includes(puzzle.id) : false,
        }))
      );
      setIsLoading(false);
    };
    loadInitialData();
  }, []);

  const refreshPuzzleStatus = async () => {
    setIsLoading(true);
    const unlockedIds = await apiClient.fetchUnlockedContentIds();
    const coins = await apiClient.fetchUserFocusCoins();
    setCurrentFocusCoins(coins);
    setPuzzles(prevPuzzles => 
      prevPuzzles.map(puzzle => ({
        ...puzzle,
        locked: puzzle.unlock_cost_coins || puzzle.is_password_unlockable ? !unlockedIds.includes(puzzle.id) : false,
      }))
    );
    setIsLoading(false);
  };

  const handleUnlockWithCoins = async (puzzle: PuzzleItem) => {
    if (!puzzle.unlock_cost_coins) return;
    setIsProcessingUnlock(true);
    // TODO: Replace with actual backend call
    const result = await apiClient.unlockContentWithCoins(puzzle.id, puzzle.unlock_cost_coins);
    if (result.success) {
      toast({ title: "Unlock Successful!", description: `${puzzle.name} unlocked. ${result.message}`, className: 'bg-primary/10 border-primary text-primary-foreground' });
      if (result.newCoinBalance !== undefined) setCurrentFocusCoins(result.newCoinBalance);
      await refreshPuzzleStatus();
    } else {
      toast({ variant: 'destructive', title: 'Unlock Failed', description: result.message || "Could not unlock with coins." });
    }
    setIsProcessingUnlock(false);
  };

  const handleUnlockWithPassword = async (puzzle: PuzzleItem) => {
    setIsProcessingUnlock(true);
    // TODO: Replace with actual backend call
    const result = await apiClient.unlockContentWithPassword(puzzle.id, passwordInput);
    if (result.success) {
      toast({ title: "Unlock Successful!", description: `${puzzle.name} unlocked. ${result.message}`, className: 'bg-accent/10 border-accent text-accent-foreground' });
      await refreshPuzzleStatus();
    } else {
      toast({ variant: 'destructive', title: 'Unlock Failed', description: result.message || "Incorrect password." });
    }
    setPasswordInput('');
    setIsProcessingUnlock(false);
  };
  
  const startPuzzle = (puzzleName: string) => {
    alert(`Starting puzzle: ${puzzleName}\n\n(Full puzzle gameplay to be implemented for each unique puzzle type)`);
    // TODO: Navigate to specific puzzle component or modal
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-10 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Puzzle className="mr-4 h-10 w-10" /> Puzzle Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Challenge your mind with a variety of puzzles. Your Focus Coins: {currentFocusCoins} 🪙
        </p>
      </header>

      <div className="space-y-12">
        {puzzleCategories.map(category => (
          <section key={category.id}>
            <div className="flex items-center mb-4 border-b border-border/30 pb-3">
              {category.icon}
              <h2 className="text-2xl md:text-3xl font-headline font-semibold ml-3 glow-text-accent">{category.name}</h2>
            </div>
            <p className="text-muted-foreground mb-6 ml-11 -mt-3">{category.description}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {puzzles.filter(p => p.category === category.name).map(puzzle => (
                <Card key={puzzle.id} className={`interactive-card shadow-lg flex flex-col justify-between ${puzzle.locked ? 'opacity-75 bg-muted/30' : 'bg-card'}`}>
                  <CardHeader>
                    <CardTitle className={`text-xl font-semibold ${puzzle.locked ? 'text-muted-foreground' : 'glow-text-primary'}`}>{puzzle.name}</CardTitle>
                    {puzzle.level_hint && <p className="text-xs text-muted-foreground mt-1">Difficulty: {puzzle.level_hint}</p>}
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
                                disabled={isProcessingUnlock}
                            >
                              {isProcessingUnlock ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : <Coins className="mr-1 h-4 w-4"/>} Unlock with {puzzle.unlock_cost_coins} Coins
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
                          {!puzzle.unlock_cost_coins && !puzzle.is_password_unlockable && (
                             <Button size="sm" className="w-full" disabled>
                                <Lock className="mr-1 h-4 w-4"/> Locked (Progression)
                            </Button>
                           )}
                        </div>
                      ) : (
                        <Button 
                            size="sm" 
                            className="w-full glow-button mt-auto" 
                            onClick={() => startPuzzle(puzzle.name)}
                        >
                          Start Puzzle <ChevronRight className="ml-1 h-4 w-4"/>
                        </Button>
                      )}
                  </CardContent>
                </Card>
              ))}
              {puzzles.filter(p => p.category === category.name).length === 0 && (
                <p className="text-muted-foreground col-span-full text-center">No puzzles in this category yet. Stay tuned!</p>
              )}
            </div>
          </section>
        ))}
      </div>
      <p className="text-center text-muted-foreground mt-8 text-sm">
        Note: Puzzle content, coin system, and unlocking logic are simulated on the client-side for demo. Full backend integration is required.
      </p>
    </div>
  );
}

    