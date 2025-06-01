// src/app/dashboard/puzzles/play/[puzzleId]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, Puzzle as PuzzleIcon, CheckCircle, XCircle, Lightbulb, ChevronLeft } from 'lucide-react';
import * as apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface PuzzleData {
  id: string;
  name: string;
  description: string;
  type: 'anagram' | 'missing_symbol' | 'sequence_solver' | 'knights_knaves' | 'alternative_uses' | 'vector_voyage' | 'missing_vowels' | 'placeholder_input' | 'placeholder';
  data?: any; 
  solution?: any;
  xpAward?: number;
}

const puzzleDatabase: Record<string, PuzzleData> = {
  word_001: {
    id: 'word_001', name: 'Anagram Hunt (Science)',
    description: 'Unscramble these NEET-related terms.', type: 'anagram',
    data: { words: [ { scrambled: 'HPOYSCIT', category: 'Physics' }, { scrambled: 'GEBYOOLI', category: 'Biology' }, { scrambled: 'HRTYSMICE', category: 'Chemistry' } ] },
    solution: { HPOYSCIT: 'PHYSICS', GEBYOOLI: 'BIOLOGY', HRTYSMICE: 'CHEMISTRY' },
    xpAward: 15,
  },
  logic_004: {
    id: 'logic_004', name: 'The Missing Symbol',
    description: 'Find the logical operator that completes the equation: 10 ? 2 = 5', type: 'missing_symbol',
    data: { equationParts: ['10', '2', '5'], operators: ['+', '-', '*', '/'] },
    solution: '/',
    xpAward: 10,
  },
  math_001: {
    id: 'math_001', name: 'The Sequence Solver',
    description: 'Find the next number in this sequence: 1, 1, 2, 3, 5, 8, ?', type: 'sequence_solver',
    data: { sequence: '1, 1, 2, 3, 5, 8', displaySequence: '1, 1, 2, 3, 5, 8, ?' },
    solution: '13',
    xpAward: 10,
  },
  logic_002: {
    id: 'logic_002', name: 'Knights and Knaves',
    description: 'Two islanders, A and B, stand before you. A says, "At least one of us is a Knave." B says nothing. Determine who is a Knight (always tells truth) and who is a Knave (always lies).', type: 'knights_knaves',
    data: { characters: ['A', 'B'], statements: { A: "At least one of us is a Knave."} },
    solution: { A: 'Knight', B: 'Knave' }, // If A is Knight, statement is true. One is knave (B). If A is Knave, statement is false meaning both are Knights (contradiction).
    xpAward: 25,
  },
  creative_001: {
    id: 'creative_001', name: 'Alternative Uses',
    description: 'List as many alternative uses for a common paperclip as you can in 2 minutes (conceptual time limit).', type: 'alternative_uses',
    data: { item: 'a common paperclip' },
    solution: null, // Subjective
    xpAward: 10, // Conceptual award for participation
  },
  conceptual_phy_001: {
    id: 'conceptual_phy_001', name: 'Vector Voyage',
    description: 'A ship sails 3km East, then 4km North. What is its displacement (magnitude and direction)?', type: 'vector_voyage',
    data: {},
    solution: { magnitude: 5, direction: 53.13, directionUnit: 'degrees North of East' }, // Approx 53.13
    xpAward: 15,
  },
  word_004: {
    id: 'word_004', name: 'Missing Vowels (Chemistry)',
    description: 'Fill in the missing vowels for these common chemical compound names.', type: 'missing_vowels',
    data: { words: [ { gapped: 'S_LF_R_C _C_D', category: 'Acid' }, { gapped: 'P_T_SS__M P_RM_NG_N_T_', category: 'Salt' }, { gapped: '_TH_N_L', category: 'Alcohol' } ] },
    solution: { 'S_LF_R_C _C_D': 'SULPHURIC ACID', 'P_T_SS__M P_RM_NG_N_T_': 'POTASSIUM PERMANGANATE', '_TH_N_L': 'ETHANOL' },
    xpAward: 15,
  },
  visual_001: {
    id: 'visual_001', name: 'Spot the Difference',
    description: 'Placeholder images are shown. Imagine finding differences. How many differences are there if there are 3? (Conceptual)', type: 'placeholder_input',
    data: { image1: 'https://placehold.co/400x300/E0E0E0/666666.png?text=Image+A', image2: 'https://placehold.co/400x300/DCDCDC/555555.png?text=Image+B+(Spot+3+Diff)', prompt: "Enter the number of differences you find (Hint: it's 3 for this demo)." },
    solution: '3',
    xpAward: 10,
  },
  logic_001: { id: 'logic_001', name: 'The Bridge Crossing Riddle', description: 'Four people need to cross a bridge at night with one flashlight. Minimum time? Submit your strategy and time.', type: 'placeholder_input', data:{prompt:"Enter your strategy and minimum time."}, solution:"Conceptual", xpAward: 20 },
  logic_003: { id: 'logic_003', name: "Einstein's Riddle (Zebra Puzzle)", description: 'Who owns the zebra? Submit your detailed solution.', type: 'placeholder_input',data:{prompt:"Who owns the zebra and what is their house color, pet, drink, and cigarette brand?"}, solution:"Conceptual", xpAward: 50 },
  logic_005: { id: 'logic_005', name: 'River Crossing Puzzle', description: 'Get the farmer, wolf, goat, and cabbage across the river safely. Describe the steps.', type: 'placeholder_input',data:{prompt:"Describe the sequence of crossings."}, solution:"Conceptual", xpAward: 30 },
  math_002: { id: 'math_002', name: 'Diophantine Dilemma', description: 'Find integer solutions (x,y) for 3x + 5y = 47. Submit one solution.', type: 'placeholder_input',data:{prompt:"Enter an integer (x,y) solution."}, solution:"Conceptual", xpAward: 40 },
  math_003: { id: 'math_003', name: 'The Tower of Hanoi', description: 'What is the minimum number of moves for 5 disks?', type: 'placeholder_input',data:{prompt:"Minimum moves for 5 disks?"}, solution:"31", xpAward: 20 },
  math_004: { id: 'math_004', name: 'Probability Paradox', description: 'Explain the Monty Hall problem: should you switch doors?', type: 'placeholder_input',data:{prompt:"Explain your reasoning for switching or not."}, solution:"Conceptual", xpAward: 25 },
  math_005: { id: 'math_005', name: 'Cryptarithmetic Challenge', description: 'Solve SEND + MORE = MONEY. What digits do S,E,N,D,M,O,R,Y represent?', type: 'placeholder_input',data:{prompt:"Enter the digit for each letter."}, solution:"Conceptual", xpAward: 35 },
  creative_002: { id: 'creative_002', name: 'Story Spark', description: 'Write a short story (max 100 words) using Dragon, Coffee, Starlight.', type: 'placeholder_input',data:{prompt:"Write your short story."}, solution:"Conceptual", xpAward: 15 },
  creative_003: { id: 'creative_003', name: 'Rebus Rally', description: 'What does "MAN BOARD" represent if MAN is standing on the word BOARD? (Conceptual)', type: 'placeholder_input',data:{prompt:"Interpret the rebus."}, solution:"MAN OVERBOARD", xpAward: 10 },
  creative_004: { id: 'creative_004', name: 'Concept Mashup', description: 'Combine "photosynthesis" and "quantum entanglement" into a novel invention idea.', type: 'placeholder_input',data:{prompt:"Describe your invention."}, solution:"Conceptual", xpAward: 30 },
  creative_005: { id: 'creative_005', name: 'Unusual Invention Design', description: 'Design an invention to automatically sort mismatched socks.', type: 'placeholder_input',data:{prompt:"Describe your sock-sorting invention."}, solution:"Conceptual", xpAward: 20 },
  conceptual_chem_001: { id: 'conceptual_chem_001', name: 'Balancing Act', description: 'Balance: CH4 + O2 -> CO2 + H2O. Enter coefficients (e.g., 1,2,1,2).', type: 'placeholder_input',data:{prompt:"Enter coefficients for CH4, O2, CO2, H2O."}, solution:"1,2,1,2", xpAward: 20 },
  conceptual_bio_001: { id: 'conceptual_bio_001', name: 'Genetic Code Cracker', description: 'DNA: TACGGATTCACT. mRNA sequence? (Conceptual)', type: 'placeholder_input',data:{prompt:"Enter the mRNA sequence."}, solution:"AUGCCUAAGUGA", xpAward: 25 },
  conceptual_phy_002: { id: 'conceptual_phy_002', name: 'Energy Transformation', description: 'Describe main energy transformations in a hydroelectric dam.', type: 'placeholder_input',data:{prompt:"List energy transformations."}, solution:"Conceptual", xpAward: 20 },
  conceptual_chem_002: { id: 'conceptual_chem_002', name: 'Ideal Gas Law Scenario', description: 'If pressure of an ideal gas is doubled at constant temperature, what happens to volume?', type: 'placeholder_input',data:{prompt:"What happens to the volume?"}, solution:"HALVED", xpAward: 30 },
  visual_002: { id: 'visual_002', name: 'Optical Illusion Analysis', description: 'Explain the Müller-Lyer illusion (lines with arrowheads).', type: 'placeholder_input',data:{prompt:"Explain the illusion."}, solution:"Conceptual", xpAward: 20 },
  visual_003: { id: 'visual_003', name: 'Pattern Recognition', description: 'Square, Circle, Triangle, Square, Circle, ?', type: 'placeholder_input',data:{prompt:"What's the next shape?"}, solution:"TRIANGLE", xpAward: 15 },
  visual_004: { id: 'visual_004', name: 'Hidden Object Hunt', description: 'Imagine a cluttered room image. List 3 hidden objects. (Conceptual)', type: 'placeholder_input',data:{prompt:"Name 3 objects you conceptually 'find'."}, solution:"Conceptual", xpAward: 10 },
  word_002: { id: 'word_002', name: 'Crossword Challenge (Bio)', description: 'Clue: Green pigment in plants. (11 letters)', type: 'placeholder_input',data:{prompt:"Enter the 11-letter word."}, solution:"CHLOROPHYLL", xpAward: 20 },
  word_003: { id: 'word_003', name: 'Scientific Term Origin', description: 'What is the Greek origin of "Biology"? (Logos + ?)', type: 'placeholder_input',data:{prompt:"What does 'Bios' mean?"}, solution:"LIFE", xpAward: 25 },
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
  const [genericInput, setGenericInput] = useState('');
  const [knightsKnavesAnswers, setKnightsKnavesAnswers] = useState<Record<string, string>>({});


  useEffect(() => {
    if (puzzleId) {
      const puzzleData = puzzleDatabase[puzzleId];
      if (puzzleData) {
        setCurrentPuzzle(puzzleData);
        const initialUserAnswers: Record<string, string> = {};
        if (puzzleData.type === 'anagram' && puzzleData.data?.words) {
          puzzleData.data.words.forEach((word: { scrambled: string }) => {
            initialUserAnswers[word.scrambled] = '';
          });
        } else if (puzzleData.type === 'missing_vowels' && puzzleData.data?.words) {
           puzzleData.data.words.forEach((word: { gapped: string }) => {
            initialUserAnswers[word.gapped] = '';
          });
        }
        setUserAnswers(initialUserAnswers);

        if (puzzleData.type === 'knights_knaves' && puzzleData.data?.characters) {
            const initialKKAnswers: Record<string,string> = {};
            puzzleData.data.characters.forEach((char: string) => {
                initialKKAnswers[char] = ''; // default to empty, user must select
            });
            setKnightsKnavesAnswers(initialKKAnswers);
        }
      }
    }
    setIsLoading(false);
  }, [puzzleId]);

  const handleInputChange = (key: string, value: string) => {
    setUserAnswers(prev => ({ ...prev, [key]: value.toUpperCase() }));
    setFeedback(prev => ({ ...prev, [key]: 'neutral' }));
  };
  
  const handleGenericInputChange = (value: string) => {
    setGenericInput(value);
    setFeedback({ general: 'neutral' });
  };

  const handleKnightsKnavesChange = (character: string, value: string) => {
    setKnightsKnavesAnswers(prev => ({...prev, [character]: value}));
    setFeedback(prev => ({...prev, [character]: 'neutral'}));
  };

  const checkAnswers = () => {
    if (!currentPuzzle || !currentPuzzle.solution) return;
    let allCorrect = true;
    const newFeedback: Record<string, 'correct' | 'incorrect' | 'neutral'> = {};

    switch (currentPuzzle.type) {
      case 'anagram':
      case 'missing_vowels':
        (currentPuzzle.data.words as Array<{scrambled?: string, gapped?: string}>).forEach((wordObj) => {
          const key = wordObj.scrambled || wordObj.gapped!;
          const userAnswer = userAnswers[key]?.trim().toUpperCase();
          const correctAnswer = (currentPuzzle.solution as Record<string, string>)[key];
          if (userAnswer === correctAnswer) {
            newFeedback[key] = 'correct';
          } else {
            newFeedback[key] = 'incorrect';
            allCorrect = false;
          }
        });
        break;
      
      case 'sequence_solver':
        if (genericInput.trim() === currentPuzzle.solution) {
          newFeedback.general = 'correct';
        } else {
          newFeedback.general = 'incorrect';
          allCorrect = false;
        }
        break;

      case 'knights_knaves':
        (currentPuzzle.data.characters as string[]).forEach(char => {
            if (knightsKnavesAnswers[char] === (currentPuzzle.solution as Record<string,string>)[char]) {
                newFeedback[char] = 'correct';
            } else {
                newFeedback[char] = 'incorrect';
                allCorrect = false;
            }
        });
        break;
      
      case 'vector_voyage':
        const mag = parseFloat(userAnswers['magnitude']);
        const dir = parseFloat(userAnswers['direction']);
        const solMag = currentPuzzle.solution.magnitude;
        const solDir = currentPuzzle.solution.direction;
        if (Math.abs(mag - solMag) < 0.1 && Math.abs(dir - solDir) < 2) { // Allow tolerance
            newFeedback.general = 'correct';
        } else {
            newFeedback.general = 'incorrect';
            allCorrect = false;
        }
        break;
      
      case 'placeholder_input': // For puzzles like Spot the Difference, Tower of Hanoi, etc. where solution is a simple string
        if (genericInput.trim().toUpperCase() === (currentPuzzle.solution as string)?.toUpperCase()) {
          newFeedback.general = 'correct';
        } else if (currentPuzzle.solution === "Conceptual") {
          // For truly conceptual puzzles, mark as "correct" for submission
          newFeedback.general = 'correct'; 
          allCorrect = true; // Override to true for conceptual
           toast({ title: "Submission Logged!", description: "Your conceptual solution has been noted.", className:"bg-blue-500/10 text-blue-300" });
        }
        else {
          newFeedback.general = 'incorrect';
          allCorrect = false;
        }
        break;

      default:
        allCorrect = false; // Should not happen for implemented types
    }

    setFeedback(newFeedback);
    if (allCorrect) {
      setIsCompleted(true);
      let successMessage = `Great job! You earned ${currentPuzzle.xpAward || 0} XP (Conceptual).`;
      if (currentPuzzle.solution === "Conceptual") {
        successMessage = `Solution submitted for ${currentPuzzle.name}. Well done! You earned ${currentPuzzle.xpAward || 0} XP (Conceptual).`;
      }
      toast({ title: `${currentPuzzle.name} Solved!`, description: successMessage, className: "bg-primary/10 text-primary-foreground" });
      if (currentPuzzle.xpAward) apiClient.addUserXP(currentPuzzle.xpAward);
    } else {
      toast({ variant: "destructive", title: "Some Incorrect Answers", description: "Check your answers and try again." });
    }
  };

  const checkMissingSymbolAnswer = (selectedOperator: string) => {
    if (!currentPuzzle || currentPuzzle.type !== 'missing_symbol' || !currentPuzzle.solution) return;
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
        <p className="text-muted-foreground">Could not load the puzzle. It might be an invalid ID.</p>
        <Button onClick={() => router.push('/dashboard/puzzles')} className="mt-4">Back to Puzzles</Button>
      </div>
    );
  }
  
  const renderPuzzleContent = () => {
    switch (currentPuzzle.type) {
      case 'anagram':
      case 'missing_vowels':
        return (
          <div className="space-y-4">
            {(currentPuzzle.data.words as Array<{scrambled?: string, gapped?: string, category?:string}>).map((wordObj, index) => {
              const key = wordObj.scrambled || wordObj.gapped!;
              return (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <Label htmlFor={`answer-${key}`} className="font-mono text-sm sm:text-lg w-full sm:w-48 text-left sm:text-right text-muted-foreground">
                    {key.replace(/_/g, ' ')} {wordObj.category ? `(${wordObj.category})` : ''}:
                  </Label>
                  <Input
                    id={`answer-${key}`}
                    type="text"
                    value={userAnswers[key] || ''}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    className={`input-glow flex-1 ${
                      feedback[key] === 'correct' ? 'border-green-500 focus:border-green-600' : 
                      feedback[key] === 'incorrect' ? 'border-red-500 focus:border-red-600' : ''
                    }`}
                    maxLength={key.length + 5} // Allow some leeway for spaces in answers
                  />
                  {feedback[key] === 'correct' && <CheckCircle className="text-green-500" />}
                  {feedback[key] === 'incorrect' && <XCircle className="text-red-500" />}
                </div>
              );
            })}
            <Button onClick={checkAnswers} className="w-full mt-6 glow-button">Check Answers</Button>
          </div>
        );
      case 'missing_symbol':
        return (
          <div className="space-y-6 text-center">
            <p className="text-4xl font-mono font-bold text-foreground tracking-wider">
              {currentPuzzle.data.equationParts[0]} 
              <span className="text-primary mx-2 text-5xl">?</span> 
              {currentPuzzle.data.equationParts[1]} = {currentPuzzle.data.equationParts[2]}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(currentPuzzle.data.operators as string[]).map((op: string) => (
                <Button key={op} variant="outline" className="text-2xl font-mono h-14 glow-button" onClick={() => checkMissingSymbolAnswer(op)}>
                  {op}
                </Button>
              ))}
            </div>
            {feedback.general === 'correct' && <Alert variant="default" className="bg-green-500/10 border-green-500/30 text-green-400"><CheckCircle className="h-5 w-5"/>Correct Operator!</Alert>}
            {feedback.general === 'incorrect' && <Alert variant="destructive"><XCircle className="h-5 w-5"/>Incorrect. Try another operator.</Alert>}
          </div>
        );
      case 'sequence_solver':
        return (
            <div className="space-y-4 text-center">
                <p className="text-2xl font-mono text-foreground">{currentPuzzle.data.displaySequence}</p>
                <Input type="text" value={genericInput} onChange={(e) => handleGenericInputChange(e.target.value)} placeholder="Your answer" className="input-glow max-w-xs mx-auto"/>
                <Button onClick={checkAnswers} className="glow-button">Check Sequence</Button>
                {feedback.general === 'correct' && <Alert variant="default" className="bg-green-500/10 border-green-500/30 text-green-400"><CheckCircle className="h-5 w-5"/>Correct!</Alert>}
                {feedback.general === 'incorrect' && <Alert variant="destructive"><XCircle className="h-5 w-5"/>Not quite. Try again!</Alert>}
            </div>
        );
       case 'knights_knaves':
        return (
            <div className="space-y-4">
                {(currentPuzzle.data.characters as string[]).map(char => (
                    <div key={char} className="space-y-2">
                        <p className="font-semibold">Character {char}{currentPuzzle.data.statements[char] ? `: "${currentPuzzle.data.statements[char]}"` : ' (says nothing)'}</p>
                        <RadioGroup onValueChange={(value) => handleKnightsKnavesChange(char, value)} value={knightsKnavesAnswers[char]} className="flex gap-4">
                            <FormItem className="flex items-center space-x-2">
                                <RadioGroupItem value="Knight" id={`${char}-knight`} />
                                <Label htmlFor={`${char}-knight`}>Knight</Label>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                                <RadioGroupItem value="Knave" id={`${char}-knave`} />
                                <Label htmlFor={`${char}-knave`}>Knave</Label>
                            </FormItem>
                        </RadioGroup>
                        {feedback[char] === 'correct' && <CheckCircle className="text-green-500 inline-block ml-2" />}
                        {feedback[char] === 'incorrect' && <XCircle className="text-red-500 inline-block ml-2" />}
                    </div>
                ))}
                <Button onClick={checkAnswers} className="w-full mt-6 glow-button">Check Classifications</Button>
            </div>
        );
      case 'alternative_uses':
        return (
            <div className="space-y-4">
                <p className="text-lg">List alternative uses for: <span className="font-semibold text-accent">{currentPuzzle.data.item}</span></p>
                <Textarea value={genericInput} onChange={(e) => handleGenericInputChange(e.target.value)} placeholder="Enter as many uses as you can think of..." rows={6} className="input-glow"/>
                <Button onClick={() => { setIsCompleted(true); toast({title:"Ideas Submitted!", description: "Great thinking!"}); if(currentPuzzle.xpAward) apiClient.addUserXP(currentPuzzle.xpAward); }} className="glow-button">Submit Ideas</Button>
            </div>
        );
      case 'vector_voyage':
        return (
            <div className="space-y-4">
                <p className="text-lg mb-1">Problem: A ship sails 3km East, then 4km North.</p>
                <p className="text-lg mb-3">What is its displacement (magnitude and direction relative to East)?</p>
                <div className="grid grid-cols-2 gap-4">
                    <Input type="number" value={userAnswers['magnitude'] || ''} onChange={(e)=>handleInputChange('magnitude', e.target.value)} placeholder="Magnitude (km)" className="input-glow"/>
                    <Input type="number" value={userAnswers['direction'] || ''} onChange={(e)=>handleInputChange('direction', e.target.value)} placeholder="Direction (° N of E)" className="input-glow"/>
                </div>
                <Button onClick={checkAnswers} className="w-full glow-button">Check Displacement</Button>
                {feedback.general === 'correct' && <Alert variant="default" className="bg-green-500/10 border-green-500/30 text-green-400"><CheckCircle className="h-5 w-5"/>Correct! Displacement is 5km at approx 53.13° N of E.</Alert>}
                {feedback.general === 'incorrect' && <Alert variant="destructive"><XCircle className="h-5 w-5"/>Not quite. Remember Pythagorean theorem and trigonometry (tan inverse).</Alert>}
            </div>
        );
       case 'placeholder_input': // For puzzles like Spot the Difference, Tower of Hanoi, complex logic etc.
        return (
            <div className="space-y-4 text-center">
                 {currentPuzzle.id === 'visual_001' && currentPuzzle.data?.image1 && (
                    <div className="flex gap-2 justify-center mb-4">
                        <img src={currentPuzzle.data.image1} alt="Visual Puzzle Image 1" className="rounded-md border max-w-[45%] shadow-md" data-ai-hint="abstract pattern" />
                        <img src={currentPuzzle.data.image2} alt="Visual Puzzle Image 2" className="rounded-md border max-w-[45%] shadow-md" data-ai-hint="abstract pattern variation" />
                    </div>
                )}
                <p className="text-muted-foreground">{currentPuzzle.data?.prompt || "Enter your solution below:"}</p>
                <Textarea value={genericInput} onChange={(e) => handleGenericInputChange(e.target.value)} placeholder="Your conceptual solution..." rows={currentPuzzle.id === 'visual_001' ? 1 : 4} className="input-glow"/>
                <Button onClick={checkAnswers} className="glow-button">Submit Conceptual Solution</Button>
                {feedback.general === 'correct' && <Alert variant="default" className="bg-green-500/10 border-green-500/30 text-green-400"><CheckCircle className="h-5 w-5"/>Solution submitted conceptually!</Alert>}
                {feedback.general === 'incorrect' && <Alert variant="destructive"><XCircle className="h-5 w-5"/>Conceptual check failed (if applicable) or try again.</Alert>}
            </div>
        );

      default: // Placeholder for other puzzles
        return (
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Under Construction!</AlertTitle>
            <AlertDescription>
              Gameplay for "{currentPuzzle.name}" is still being developed. Check back soon!
            </AlertDescription>
          </Alert>
        );
    }
  };


  return (
    <div className="space-y-6">
       <Button variant="outline" onClick={() => router.push('/dashboard/puzzles')} className="mb-6 glow-button">
        <ChevronLeft className="mr-2" /> Back to Puzzle Dashboard
      </Button>
      <Card className="w-full max-w-2xl mx-auto interactive-card shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-headline glow-text-primary text-center">{currentPuzzle.name}</CardTitle>
          <CardDescription className="text-center text-muted-foreground text-sm md:text-base">{currentPuzzle.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {isCompleted ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h2 className="text-2xl font-semibold text-green-400">Puzzle Solved!</h2>
              <p className="text-muted-foreground mt-2">You've successfully completed {currentPuzzle.name}.</p>
              {currentPuzzle.xpAward && <p className="text-lg text-accent mt-1">+ {currentPuzzle.xpAward} XP Earned (Conceptual)!</p>}
               <Button onClick={() => router.push('/dashboard/puzzles')} className="mt-6 glow-button">
                Back to Puzzles <ChevronLeft className="ml-2 order-first group-hover:-translate-x-1 transition-transform" />
              </Button>
            </div>
          ) : (
            renderPuzzleContent()
          )}
        </CardContent>
      </Card>
    </div>
  );
}

