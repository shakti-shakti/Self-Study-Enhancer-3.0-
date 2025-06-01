// src/app/dashboard/puzzles/play/[puzzleId]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Puzzle as PuzzleIcon, CheckCircle, XCircle, Lightbulb, ChevronLeft } from 'lucide-react';
import * as apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface PuzzleData {
  id: string;
  name: string;
  description: string;
  type: 'anagram' | 'missing_symbol' | 'placeholder';
  data?: any; // Puzzle-specific data (e.g., words for anagram, equation for missing_symbol)
  solution?: any; // Solution for the puzzle
  xpAward?: number;
}

// Hardcoded puzzle data for client-side demo
// In a real app, this might come from a DB or a more structured JSON/CMS
const puzzleDatabase: Record<string, PuzzleData> = {
  word_001: {
    id: 'word_001',
    name: 'Anagram Hunt (Science)',
    description: 'Unscramble these NEET-related terms: HPOYSCIT, GEBYOOLI, HRTYSMICE.',
    type: 'anagram',
    data: {
      words: [
        { scrambled: 'HPOYSCIT', category: 'Physics' },
        { scrambled: 'GEBYOOLI', category: 'Biology' },
        { scrambled: 'HRTYSMICE', category: 'Chemistry' },
      ],
    },
    solution: {
      HPOYSCIT: 'PHYSICS',
      GEBYOOLI: 'BIOLOGY',
      HRTYSMICE: 'CHEMISTRY',
    },
    xpAward: 15,
  },
  logic_004: {
    id: 'logic_004',
    name: 'The Missing Symbol',
    description: 'Find the logical operator that completes the sequence: 10 ? 2 = 5',
    type: 'missing_symbol',
    data: {
      equationParts: ['10', '2', '5'], // [operand1, operand2, result]
      operators: ['+', '-', '*', '/'],
    },
    solution: '/',
    xpAward: 10,
  },
  // Add placeholders for all other puzzles from initialPuzzles in puzzles/page.tsx
  logic_001: { id: 'logic_001', name: 'The Bridge Crossing Riddle', description: 'Solve the classic bridge riddle.', type: 'placeholder', xpAward: 20 },
  logic_002: { id: 'logic_002', name: 'Knights and Knaves', description: 'Identify the knights and knaves.', type: 'placeholder', xpAward: 25 },
  logic_003: { id: 'logic_003', name: "Einstein's Riddle (Zebra Puzzle)", description: 'Who owns the zebra?', type: 'placeholder', xpAward: 50 },
  logic_005: { id: 'logic_005', name: 'River Crossing Puzzle', description: 'Safely cross the river.', type: 'placeholder', xpAward: 30 },
  math_001: { id: 'math_001', name: 'The Sequence Solver', description: 'Find the next number in the sequence.', type: 'placeholder', xpAward: 10 },
  math_002: { id: 'math_002', name: 'Diophantine Dilemma', description: 'Solve the Diophantine equation.', type: 'placeholder', xpAward: 40 },
  math_003: { id: 'math_003', name: 'The Tower of Hanoi', description: 'Solve the Tower of Hanoi.', type: 'placeholder', xpAward: 20 },
  math_004: { id: 'math_004', name: 'Probability Paradox', description: 'Explain the Monty Hall problem.', type: 'placeholder', xpAward: 25 },
  math_005: { id: 'math_005', name: 'Cryptarithmetic Challenge', description: 'Solve the letter-digit puzzle.', type: 'placeholder', xpAward: 35 },
  creative_001: { id: 'creative_001', name: 'Alternative Uses', description: 'List uses for a brick.', type: 'placeholder', xpAward: 10 },
  creative_002: { id: 'creative_002', name: 'Story Spark', description: 'Write a short story.', type: 'placeholder', xpAward: 15 },
  creative_003: { id: 'creative_003', name: 'Rebus Rally', description: 'Solve rebus puzzles.', type: 'placeholder', xpAward: 10 },
  creative_004: { id: 'creative_004', name: 'Concept Mashup', description: 'Invent something new.', type: 'placeholder', xpAward: 30 },
  creative_005: { id: 'creative_005', name: 'Unusual Invention Design', description: 'Design an unusual invention.', type: 'placeholder', xpAward: 20 },
  conceptual_phy_001: { id: 'conceptual_phy_001', name: 'Vector Voyage', description: 'Calculate displacement.', type: 'placeholder', xpAward: 15 },
  conceptual_chem_001: { id: 'conceptual_chem_001', name: 'Balancing Act', description: 'Balance the chemical equation.', type: 'placeholder', xpAward: 20 },
  conceptual_bio_001: { id: 'conceptual_bio_001', name: 'Genetic Code Cracker', description: 'Determine the amino acid sequence.', type: 'placeholder', xpAward: 25 },
  conceptual_phy_002: { id: 'conceptual_phy_002', name: 'Energy Transformation', description: 'Describe energy changes.', type: 'placeholder', xpAward: 20 },
  conceptual_chem_002: { id: 'conceptual_chem_002', name: 'Ideal Gas Law Scenario', description: 'Explain gas law effects.', type: 'placeholder', xpAward: 30 },
  visual_001: { id: 'visual_001', name: 'Spot the Difference', description: 'Find differences in images.', type: 'placeholder', xpAward: 10 },
  visual_002: { id: 'visual_002', name: 'Optical Illusion Analysis', description: 'Explain an optical illusion.', type: 'placeholder', xpAward: 20 },
  visual_003: { id: 'visual_003', name: 'Pattern Recognition', description: 'Find the next shape.', type: 'placeholder', xpAward: 15 },
  visual_004: { id: 'visual_004', name: 'Hidden Object Hunt', description: 'Find hidden objects.', type: 'placeholder', xpAward: 10 },
  word_002: { id: 'word_002', name: 'Crossword Challenge (Bio)', description: 'Solve a biology crossword.', type: 'placeholder', xpAward: 20 },
  word_003: { id: 'word_003', name: 'Scientific Term Origin', description: 'Guess term etymology.', type: 'placeholder', xpAward: 25 },
  word_004: { id: 'word_004', name: 'Missing Vowels (Chemistry)', description: 'Fill in missing vowels.', type: 'placeholder', xpAward: 10 },
};

export default function PuzzlePlayPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const puzzleId = typeof params.puzzleId === 'string' ? params.puzzleId : null;

  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, 'correct' | 'incorrect' | 'neutral'>>({});

  useEffect(() => {
    if (puzzleId) {
      const puzzleData = puzzleDatabase[puzzleId];
      if (puzzleData) {
        setCurrentPuzzle(puzzleData);
        if (puzzleData.type === 'anagram' && puzzleData.data?.words) {
          const initialAnswers: Record<string, string> = {};
          puzzleData.data.words.forEach((word: { scrambled: string }) => {
            initialAnswers[word.scrambled] = '';
          });
          setUserAnswers(initialAnswers);
        }
      }
    }
    setIsLoading(false);
  }, [puzzleId]);

  const handleInputChange = (key: string, value: string) => {
    setUserAnswers(prev => ({ ...prev, [key]: value.toUpperCase() }));
    setFeedback(prev => ({ ...prev, [key]: 'neutral' }));
  };

  const checkAnagramAnswers = () => {
    if (!currentPuzzle || currentPuzzle.type !== 'anagram' || !currentPuzzle.data?.words || !currentPuzzle.solution) {
      return;
    }
    let allCorrect = true;
    const newFeedback: Record<string, 'correct' | 'incorrect' | 'neutral'> = {};
    currentPuzzle.data.words.forEach((wordObj: { scrambled: string }) => {
      const userAnswer = userAnswers[wordObj.scrambled];
      const correctAnswer = currentPuzzle.solution[wordObj.scrambled];
      if (userAnswer === correctAnswer) {
        newFeedback[wordObj.scrambled] = 'correct';
      } else {
        newFeedback[wordObj.scrambled] = 'incorrect';
        allCorrect = false;
      }
    });
    setFeedback(newFeedback);
    if (allCorrect) {
      setIsCompleted(true);
      toast({ title: "Anagrams Solved!", description: `Great job! You earned ${currentPuzzle.xpAward || 0} XP (Conceptual).`, className: "bg-primary/10 text-primary-foreground" });
      if (currentPuzzle.xpAward) apiClient.addUserXP(currentPuzzle.xpAward);
    } else {
      toast({ variant: "destructive", title: "Some Incorrect", description: "Check your answers and try again." });
    }
  };

  const checkMissingSymbolAnswer = (selectedOperator: string) => {
    if (!currentPuzzle || currentPuzzle.type !== 'missing_symbol' || !currentPuzzle.data?.equationParts || !currentPuzzle.solution) {
      return;
    }
    if (selectedOperator === currentPuzzle.solution) {
      setIsCompleted(true);
      setFeedback({ general: 'correct' });
      toast({ title: "Symbol Found!", description: `Correct! You earned ${currentPuzzle.xpAward || 0} XP (Conceptual).`, className: "bg-primary/10 text-primary-foreground" });
      if (currentPuzzle.xpAward) apiClient.addUserXP(currentPuzzle.xpAward);
    } else {
      setFeedback({ general: 'incorrect' });
      toast({ variant: "destructive", title: "Incorrect Symbol", description: "That's not the right operator. Try again!" });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-15rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (!currentPuzzle) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Puzzle Not Found</h1>
        <p className="text-muted-foreground">Could not load the puzzle. It might be an invalid ID or not yet implemented.</p>
        <Button onClick={() => router.push('/dashboard/puzzles')} className="mt-4">Back to Puzzles</Button>
      </div>
    );
  }

  if (currentPuzzle.type === 'placeholder') {
    return (
      <Card className="w-full max-w-lg mx-auto text-center interactive-card">
        <CardHeader>
          <PuzzleIcon className="h-12 w-12 mx-auto text-primary mb-3" />
          <CardTitle className="text-2xl font-headline glow-text-primary">{currentPuzzle.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{currentPuzzle.description}</p>
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Under Construction!</AlertTitle>
            <AlertDescription>
              The gameplay for this puzzle is still being developed. Check back soon!
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={() => router.push('/dashboard/puzzles')} className="w-full glow-button">
            <ChevronLeft className="mr-2" /> Back to Puzzle Dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
       <Button variant="outline" onClick={() => router.push('/dashboard/puzzles')} className="mb-6 glow-button">
        <ChevronLeft className="mr-2" /> Back to Puzzle Dashboard
      </Button>
      <Card className="w-full max-w-xl mx-auto interactive-card shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline glow-text-primary text-center">{currentPuzzle.name}</CardTitle>
          <CardDescription className="text-center text-muted-foreground">{currentPuzzle.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {isCompleted ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h2 className="text-2xl font-semibold text-green-400">Puzzle Solved!</h2>
              <p className="text-muted-foreground mt-2">You've successfully completed {currentPuzzle.name}.</p>
              {currentPuzzle.xpAward && <p className="text-lg text-accent mt-1">+ {currentPuzzle.xpAward} XP Earned (Conceptual)!</p>}
            </div>
          ) : (
            <>
              {currentPuzzle.type === 'anagram' && currentPuzzle.data?.words && (
                <div className="space-y-4">
                  {currentPuzzle.data.words.map((wordObj: { scrambled: string; category: string }, index: number) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="font-mono text-lg w-32 text-right text-muted-foreground">{wordObj.scrambled}:</span>
                      <Input
                        type="text"
                        value={userAnswers[wordObj.scrambled] || ''}
                        onChange={(e) => handleInputChange(wordObj.scrambled, e.target.value)}
                        className={`input-glow flex-1 ${
                          feedback[wordObj.scrambled] === 'correct' ? 'border-green-500 focus:border-green-600' : 
                          feedback[wordObj.scrambled] === 'incorrect' ? 'border-red-500 focus:border-red-600' : ''
                        }`}
                        maxLength={wordObj.scrambled.length}
                      />
                      {feedback[wordObj.scrambled] === 'correct' && <CheckCircle className="text-green-500" />}
                      {feedback[wordObj.scrambled] === 'incorrect' && <XCircle className="text-red-500" />}
                    </div>
                  ))}
                  <Button onClick={checkAnagramAnswers} className="w-full mt-6 glow-button">Check Answers</Button>
                </div>
              )}

              {currentPuzzle.type === 'missing_symbol' && currentPuzzle.data?.equationParts && (
                <div className="space-y-6 text-center">
                  <p className="text-4xl font-mono font-bold text-foreground tracking-wider">
                    {currentPuzzle.data.equationParts[0]} 
                    <span className="text-primary mx-2 text-5xl">?</span> 
                    {currentPuzzle.data.equationParts[1]} = {currentPuzzle.data.equationParts[2]}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {currentPuzzle.data.operators.map((op: string) => (
                      <Button
                        key={op}
                        variant="outline"
                        className="text-2xl font-mono h-14 glow-button"
                        onClick={() => checkMissingSymbolAnswer(op)}
                      >
                        {op}
                      </Button>
                    ))}
                  </div>
                   {feedback.general === 'correct' && 
                    <Alert variant="default" className="bg-green-500/10 border-green-500/30 text-green-400"><CheckCircle className="h-5 w-5"/>Correct Operator!</Alert>
                  }
                  {feedback.general === 'incorrect' && 
                    <Alert variant="destructive"><XCircle className="h-5 w-5"/>Incorrect. Try another operator.</Alert>
                  }
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter>
          {/* Could add hints or reset button here later if needed */}
        </CardFooter>
      </Card>
    </div>
  );
}
