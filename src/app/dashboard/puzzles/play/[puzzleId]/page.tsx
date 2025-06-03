
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
import { Loader2, Puzzle as PuzzleIcon, CheckCircle, XCircle, Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';
import * as apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import puzzleDatabase, { type PuzzleData } from '@/lib/puzzle-data';

export default function PuzzlePlayPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const puzzleId = typeof params.puzzleId === 'string' ? params.puzzleId : null;

  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLevel1Completed, setIsLevel1Completed] = useState(false);
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
        if (puzzleData.base_definition.type === 'anagram' && puzzleData.base_definition.original_data?.words) {
          puzzleData.base_definition.original_data.words.forEach((word: { scrambled: string }) => {
            initialUserAnswers[word.scrambled] = '';
          });
        } else if (puzzleData.base_definition.type === 'missing_vowels' && puzzleData.base_definition.original_data?.words) {
           puzzleData.base_definition.original_data.words.forEach((word: { gapped: string }) => {
            initialUserAnswers[word.gapped] = '';
          });
        }
        setUserAnswers(initialUserAnswers);

        if (puzzleData.base_definition.type === 'knights_knaves' && puzzleData.base_definition.original_data?.characters) {
            const initialKKAnswers: Record<string,string> = {};
            puzzleData.base_definition.original_data.characters.forEach((char: string) => {
                initialKKAnswers[char] = '';
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

    switch (currentPuzzle.base_definition.type) {
      case 'anagram':
      case 'missing_vowels':
        (currentPuzzle.base_definition.original_data.words as Array<{scrambled?: string, gapped?: string}>).forEach((wordObj) => {
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
        (currentPuzzle.base_definition.original_data.characters as string[]).forEach(char => {
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
        const solMag = (currentPuzzle.solution as {magnitude: number, direction: number}).magnitude;
        const solDir = (currentPuzzle.solution as {magnitude: number, direction: number}).direction;
        if (Math.abs(mag - solMag) < 0.1 && Math.abs(dir - solDir) < 2) {
            newFeedback.general = 'correct';
        } else {
            newFeedback.general = 'incorrect';
            allCorrect = false;
        }
        break;
      
      case 'placeholder_input':
        if (currentPuzzle.solution === "Conceptual") {
            newFeedback.general = 'correct';
            allCorrect = true;
        } else if (genericInput.trim().toUpperCase() === (currentPuzzle.solution as string)?.toUpperCase()) {
          newFeedback.general = 'correct';
        } else {
          newFeedback.general = 'incorrect';
          allCorrect = false;
        }
        break;

      default:
        allCorrect = false;
    }

    setFeedback(newFeedback);
    if (allCorrect) {
      setIsLevel1Completed(true);
      let successMessage = `Level 1 Complete! You earned ${currentPuzzle.xpAward || 0} XP.`;
      if(currentPuzzle.solution === "Conceptual") {
        successMessage = `Solution submitted for ${currentPuzzle.name}. Well done! You earned ${currentPuzzle.xpAward || 0} XP.`;
      }
      toast({ title: `${currentPuzzle.name} - Level 1 Solved!`, description: successMessage, className: "bg-primary/10 text-primary-foreground" });
      if (currentPuzzle.xpAward) apiClient.addUserXP(currentPuzzle.xpAward);
    } else {
      toast({ variant: "destructive", title: "Some Incorrect Answers", description: "Check your answers and try again." });
    }
  };

  const checkMissingSymbolAnswer = (selectedOperator: string) => {
    if (!currentPuzzle || currentPuzzle.base_definition.type !== 'missing_symbol' || !currentPuzzle.solution) return;
    if (selectedOperator === currentPuzzle.solution) {
      setIsLevel1Completed(true);
      setFeedback({ general: 'correct' });
      toast({ title: "Symbol Found!", description: `Correct! You earned ${currentPuzzle.xpAward || 0} XP.`, className: "bg-primary/10 text-primary-foreground" });
      if (currentPuzzle.xpAward) apiClient.addUserXP(currentPuzzle.xpAward);
    } else {
      setFeedback({ general: 'incorrect' });
      toast({ variant: "destructive", title: "Incorrect Symbol", description: "That's not the right operator. Try again!" });
    }
  };

  const handleTryNextLevel = () => {
    // This is conceptual for now, as AI level generation is not yet implemented
    toast({
      title: "Next Level (Conceptual)",
      description: "AI-generated Level 2 content would load here. For now, you can replay Level 1 or choose another puzzle.",
    });
    // In a full implementation:
    // setCurrentLevel(prev => prev + 1);
    // fetchPuzzleForLevel(puzzleId, currentLevel + 1);
    // setIsLevel1Completed(false); // Reset for the new level
    // setUserAnswers({}); setFeedback({}); setGenericInput(''); // etc.
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
  
  const puzzleDisplayData = currentPuzzle.base_definition.original_data;

  const renderPuzzleContent = () => {
    switch (currentPuzzle.base_definition.type) {
      case 'anagram':
      case 'missing_vowels':
        return (
          <div className="space-y-4">
            {(puzzleDisplayData.words as Array<{scrambled?: string, gapped?: string, category?:string}>).map((wordObj, index) => {
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
                    maxLength={key.length + 5}
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
              {puzzleDisplayData.equationParts[0]} 
              <span className="text-primary mx-2 text-5xl">?</span> 
              {puzzleDisplayData.equationParts[1]} = {puzzleDisplayData.equationParts[2]}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(puzzleDisplayData.operators as string[]).map((op: string) => (
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
                <p className="text-2xl font-mono text-foreground">{puzzleDisplayData.displaySequence}</p>
                <Input type="text" value={genericInput} onChange={(e) => handleGenericInputChange(e.target.value)} placeholder="Your answer" className="input-glow max-w-xs mx-auto"/>
                <Button onClick={checkAnswers} className="glow-button">Check Sequence</Button>
                {feedback.general === 'correct' && <Alert variant="default" className="bg-green-500/10 border-green-500/30 text-green-400"><CheckCircle className="h-5 w-5"/>Correct!</Alert>}
                {feedback.general === 'incorrect' && <Alert variant="destructive"><XCircle className="h-5 w-5"/>Not quite. Try again!</Alert>}
            </div>
        );
       case 'knights_knaves':
        return (
            <div className="space-y-4">
                {(puzzleDisplayData.characters as string[]).map(char => (
                    <div key={char} className="space-y-2">
                        <p className="font-semibold">Character {char}{puzzleDisplayData.statements[char] ? `: "${puzzleDisplayData.statements[char]}"` : ' (says nothing)'}</p>
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
                <p className="text-lg">List alternative uses for: <span className="font-semibold text-accent">{puzzleDisplayData.item}</span></p>
                <Textarea value={genericInput} onChange={(e) => handleGenericInputChange(e.target.value)} placeholder="Enter as many uses as you can think of..." rows={6} className="input-glow"/>
                <Button onClick={() => { setIsLevel1Completed(true); toast({title:"Ideas Submitted!", description: "Great thinking!"}); if(currentPuzzle.xpAward) apiClient.addUserXP(currentPuzzle.xpAward); }} className="glow-button">Submit Ideas</Button>
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
       case 'placeholder_input':
        return (
            <div className="space-y-4 text-center">
                 {currentPuzzle.id === 'visual_001' && puzzleDisplayData?.image1 && (
                    <div className="flex gap-2 justify-center mb-4">
                        <img src={puzzleDisplayData.image1} alt="Visual Puzzle Image 1" className="rounded-md border max-w-[45%] shadow-md" data-ai-hint="abstract pattern"/>
                        <img src={puzzleDisplayData.image2} alt="Visual Puzzle Image 2" className="rounded-md border max-w-[45%] shadow-md" data-ai-hint="abstract pattern variation"/>
                    </div>
                )}
                <p className="text-muted-foreground">{puzzleDisplayData?.prompt || "Enter your solution below:"}</p>
                <Textarea value={genericInput} onChange={(e) => handleGenericInputChange(e.target.value)} placeholder="Your conceptual solution..." rows={currentPuzzle.id === 'visual_001' ? 1 : 4} className="input-glow"/>
                <Button onClick={checkAnswers} className="glow-button">Submit Solution</Button>
                {feedback.general === 'correct' && <Alert variant="default" className="bg-green-500/10 border-green-500/30 text-green-400"><CheckCircle className="h-5 w-5"/>Solution submitted!</Alert>}
                {feedback.general === 'incorrect' && <Alert variant="destructive"><XCircle className="h-5 w-5"/>Not the expected answer for Level 1. Try again or check the prompt.</Alert>}
            </div>
        );
      default:
        return (
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Puzzle Type Not Implemented!</AlertTitle>
            <AlertDescription>
              Gameplay for "{currentPuzzle.name}" (type: {currentPuzzle.base_definition.type}) is still being developed for Level 1 static display.
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
           <p className="text-center text-accent font-semibold">Level: 1 / {currentPuzzle.max_level}</p>
        </CardHeader>
        <CardContent>
          {isLevel1Completed ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h2 className="text-2xl font-semibold text-green-400">Level 1 Complete!</h2>
              <p className="text-muted-foreground mt-2">
                You've successfully completed the first level of {currentPuzzle.name}.
              </p>
              {currentPuzzle.xpAward && <p className="text-lg text-accent mt-1">+ {currentPuzzle.xpAward} XP Earned!</p>}
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                 <Button onClick={() => router.push('/dashboard/puzzles')} className="glow-button">
                    <ChevronLeft className="mr-2 h-5 w-5" /> Back to Puzzles
                </Button>
                <Button onClick={handleTryNextLevel} className="glow-button" variant="outline">
                    Try Next Level (Conceptual) <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">AI-generated levels beyond Level 1 are coming soon.</p>
            </div>
          ) : (
            renderPuzzleContent()
          )}
        </CardContent>
      </Card>
    </div>
  );
}
