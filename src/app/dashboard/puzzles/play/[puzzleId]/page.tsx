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
import puzzleDatabase from '@/lib/puzzle-data';

interface PuzzleData {
  id: string;
  name: string;
  description: string;
  type: 'anagram' | 'missing_symbol' | 'sequence_solver' | 'knights_knaves' | 'alternative_uses' | 'vector_voyage' | 'missing_vowels' | 'placeholder_input' | 'placeholder';
  data?: any; 
  solution?: any;
  xpAward?: number;
}



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
      //const puzzleData = puzzleDatabase[puzzleId];
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

