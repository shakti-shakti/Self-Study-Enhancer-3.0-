
// src/app/dashboard/puzzles/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Puzzle, Brain, Calculator, Palette, ChevronRight, Lock, Coins, KeyRound, Eye, MessageSquare, Lightbulb, FlaskConical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PuzzleItem {
  id: string;
  name: string;
  level_hint?: string; // e.g., "Beginner", "Intermediate", "Expert"
  category: string;
  description: string;
  locked: boolean;
  unlock_cost_coins?: number | null;
  unlock_by_password_possible?: boolean | null;
}

const puzzles: PuzzleItem[] = [
  // Logic Puzzles
  { id: 'logic_001', name: 'The Bridge Crossing Riddle', level_hint: "Intermediate", category: 'Logic Puzzles', description: 'Four people need to cross a bridge at night with one flashlight. Can you figure out the fastest way?', locked: false },
  { id: 'logic_002', name: 'Knights and Knaves', level_hint: "Intermediate", category: 'Logic Puzzles', description: 'On an island of knights (always tell truth) and knaves (always lie), determine who is who based on their statements.', locked: true, unlock_cost_coins: 50 },
  { id: 'logic_003', name: 'Einstein\'s Riddle (Zebra Puzzle)', level_hint: "Expert", category: 'Logic Puzzles', description: 'A classic logic grid puzzle attributed to Einstein. Who owns the zebra?', locked: true, unlock_cost_coins: 100, unlock_by_password_possible: true },
  { id: 'logic_004', name: 'The Missing Symbol', level_hint: "Beginner", category: 'Logic Puzzles', description: 'Find the logical operator that completes the sequence: A ? B = C.', locked: false },
  // Mathematical Challenges
  { id: 'math_001', name: 'The Sequence Solver', level_hint: "Beginner", category: 'Mathematical Challenges', description: 'Find the next number in this perplexing sequence: 1, 1, 2, 3, 5, 8, ?', locked: false },
  { id: 'math_002', name: 'Diophantine Dilemma', level_hint: "Expert", category: 'Mathematical Challenges', description: 'Find integer solutions to a classic Diophantine equation.', locked: true, unlock_cost_coins: 75, unlock_by_password_possible: true },
  { id: 'math_003', name: 'The Tower of Hanoi', level_hint: "Intermediate", category: 'Mathematical Challenges', description: 'Move the stack of disks to another peg with minimal moves.', locked: false },
  { id: 'math_004', name: 'Probability Paradox', level_hint: "Intermediate", category: 'Mathematical Challenges', description: 'Solve the Monty Hall problem conceptually.', locked: true, unlock_cost_coins: 60 },
  // Creative Conundrums
  { id: 'creative_001', name: 'Alternative Uses', level_hint: "Beginner", category: 'Creative Conundrums', description: 'List as many alternative uses for a common brick as you can in 2 minutes.', locked: false },
  { id: 'creative_002', name: 'Story Spark', level_hint: "Intermediate", category: 'Creative Conundrums', description: 'Write a compelling short story (max 100 words) based on three random words: Dragon, Coffee, Starlight.', locked: true, unlock_cost_coins: 30 },
  { id: 'creative_003', name: 'Rebus Rally', level_hint: "Beginner", category: 'Creative Conundrums', description: 'Decipher picture-based word puzzles.', locked: false},
  { id: 'creative_004', name: 'Concept Mashup', level_hint: "Expert", category: 'Creative Conundrums', description: 'Combine two unrelated scientific concepts into a novel invention idea.', locked: true, unlock_cost_coins: 50, unlock_by_password_possible: true },
  // Conceptual Puzzles (NEET-related)
  { id: 'conceptual_phy_001', name: 'Vector Voyage', level_hint: "Beginner", category: 'Conceptual Puzzles (NEET Focus)', description: 'A ship sails 3km East, then 4km North. What is its displacement? (Solve conceptually)', locked: false },
  { id: 'conceptual_chem_001', name: 'Balancing Act', level_hint: "Intermediate", category: 'Conceptual Puzzles (NEET Focus)', description: 'Conceptually balance the chemical equation: CH4 + O2 -> CO2 + H2O.', locked: true, unlock_cost_coins: 40, unlock_by_password_possible: true },
  { id: 'conceptual_bio_001', name: 'Genetic Code Cracker', level_hint: "Intermediate", category: 'Conceptual Puzzles (NEET Focus)', description: 'Given a DNA sequence, determine the mRNA and corresponding amino acid sequence using a conceptual codon chart.', locked: false},
  { id: 'conceptual_phy_002', name: 'Energy Transformation', level_hint: "Intermediate", category: 'Conceptual Puzzles (NEET Focus)', description: 'Describe the energy transformations in a hydroelectric dam from water reservoir to electricity.', locked: true, unlock_cost_coins: 65},
  // Visual Puzzles
  { id: 'visual_001', name: 'Spot the Difference', level_hint: "Beginner", category: 'Visual Puzzles', description: 'Find all the differences between two seemingly identical images.', locked: false },
  { id: 'visual_002', name: 'Optical Illusion Analysis', level_hint: "Intermediate", category: 'Visual Puzzles', description: 'Explain the principles behind a famous optical illusion.', locked: true, unlock_cost_coins: 60 },
  { id: 'visual_003', name: 'Pattern Recognition', level_hint: "Intermediate", category: 'Visual Puzzles', description: 'Identify the next shape in a complex visual sequence.', locked: false },
  // Word Puzzles
  { id: 'word_001', name: 'Anagram Hunt (Science)', level_hint: "Beginner", category: 'Word Puzzles', description: 'Unscramble these NEET-related terms: HPOYSCIT, GEBYOOLI, HRTYSMICE.', locked: false },
  { id: 'word_002', name: 'Crossword Challenge (Bio)', level_hint: "Intermediate", category: 'Word Puzzles', description: 'Complete a mini-crossword with biological clues.', locked: true, unlock_cost_coins: 45, unlock_by_password_possible: true },
  { id: 'word_003', name: 'Scientific Term Origin', level_hint: "Expert", category: 'Word Puzzles', description: 'Guess the etymology of a complex scientific term.', locked: true, unlock_cost_coins: 55 },
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

  const handleUnlockWithCoins = (puzzleName: string, cost: number) => {
    toast({
      title: "Conceptual Unlock (Demo)",
      description: `Attempted to unlock "${puzzleName}" with ${cost} coins. (This is a demo - no coins deducted)`,
      className: 'bg-primary/10 border-primary text-primary-foreground'
    });
  };

  const handleUnlockWithPassword = (puzzleName: string) => {
     toast({
      title: "Conceptual Unlock (Demo)",
      description: `Attempted to unlock "${puzzleName}" with a password. (Password: "PUZZLEMASTER" - This is a demo)`,
      className: 'bg-accent/10 border-accent text-accent-foreground'
    });
  };
  
  const startPuzzle = (puzzleName: string) => {
    alert(`Starting puzzle: ${puzzleName}\n\n(Full puzzle gameplay to be implemented for each unique puzzle type)`);
  };

  return (
    <div className="space-y-10 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Puzzle className="mr-4 h-10 w-10" /> Puzzle Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Challenge your mind with a variety of puzzles. Some may require Focus Coins or a special password to unlock!
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
                                onClick={() => handleUnlockWithCoins(puzzle.name, puzzle.unlock_cost_coins!)}
                            >
                              <Coins className="mr-1 h-4 w-4"/> Unlock with {puzzle.unlock_cost_coins} Coins (Demo)
                            </Button>
                          )}
                          {puzzle.unlock_by_password_possible && (
                             <Button 
                                size="sm" 
                                className="w-full glow-button" 
                                variant="outline"
                                onClick={() => handleUnlockWithPassword(puzzle.name)}
                            >
                              <KeyRound className="mr-1 h-4 w-4"/> Unlock with Password (Demo)
                            </Button>
                          )}
                          {!puzzle.unlock_cost_coins && !puzzle.unlock_by_password_possible && (
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
        Note: Puzzle content, coin system, and unlocking logic are conceptual and require full implementation.
      </p>
    </div>
  );
}
