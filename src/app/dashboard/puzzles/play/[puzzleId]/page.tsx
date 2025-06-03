
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
import { Loader2, Puzzle as PuzzleIcon, CheckCircle, XCircle, Lightbulb, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import * as apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import puzzleDatabase, { type PuzzleData } from '@/lib/puzzle-data';
import type { GeneratedPuzzleLevelContent, PuzzleSubmissionResponse } from '@/lib/database.types';

export default function PuzzlePlayPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const puzzleId = typeof params.puzzleId === 'string' ? params.puzzleId : null;

  const [currentStaticPuzzle, setCurrentStaticPuzzle] = useState<PuzzleData | null>(null);
  const [currentDynamicPuzzleContent, setCurrentDynamicPuzzleContent] = useState<GeneratedPuzzleLevelContent | null>(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [maxLevel, setMaxLevel] = useState(1);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLevelCompleted, setIsLevelCompleted] = useState(false);
  
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [genericInput, setGenericInput] = useState('');
  const [feedback, setFeedback] = useState<Record<string, 'correct' | 'incorrect' | 'neutral'>>({});
  const [dynamicContentError, setDynamicContentError] = useState<string | null>(null); // Added for dynamic content loading errors


  useEffect(() => {
    async function loadPuzzle() {
      if (puzzleId) {
        setIsLoading(true);
        setDynamicContentError(null); // Reset error on new puzzle load
        const staticPuzzleData = puzzleDatabase[puzzleId];
        if (staticPuzzleData) {
          setCurrentStaticPuzzle(staticPuzzleData);
          setMaxLevel(staticPuzzleData.max_level);
          setCurrentLevel(1); 
          resetInputsForPuzzle(staticPuzzleData);
          setIsLevelCompleted(false);
        } else {
          toast({ variant: "destructive", title: "Puzzle Not Found", description: "This puzzle ID is invalid." });
          router.push('/dashboard/puzzles');
        }
      }
      setIsLoading(false);
    }
    loadPuzzle();
  }, [puzzleId, router, toast]);

  const resetInputsForPuzzle = (puzzle: PuzzleData | null) => {
    const initialUserAnswers: Record<string, string> = {};
    if (puzzle && puzzle.base_definition.type === 'anagram' && puzzle.base_definition.original_data?.words) {
      puzzle.base_definition.original_data.words.forEach((word: { scrambled: string }) => {
        initialUserAnswers[word.scrambled] = '';
      });
    } else if (puzzle && puzzle.base_definition.type === 'missing_vowels' && puzzle.base_definition.original_data?.words) {
       puzzle.base_definition.original_data.words.forEach((word: { gapped: string }) => {
        initialUserAnswers[word.gapped] = '';
      });
    }
    setUserAnswers(initialUserAnswers);
    setGenericInput('');
    setFeedback({});
  };
  

  const handleInputChange = (key: string, value: string) => {
    setUserAnswers(prev => ({ ...prev, [key]: value.toUpperCase() }));
    setFeedback(prev => ({ ...prev, [key]: 'neutral' }));
  };
  
  const handleGenericInputChange = (value: string) => {
    setGenericInput(value);
    setFeedback({ general: 'neutral' });
  };


  const checkLevel1Answer = () => {
    if (!currentStaticPuzzle || !currentStaticPuzzle.solution) return;
    let allCorrect = true;
    const newFeedback: Record<string, 'correct' | 'incorrect' | 'neutral'> = {};
    const puzzleType = currentStaticPuzzle.base_definition.type;

    if (puzzleType === 'anagram' || puzzleType === 'missing_vowels') {
      (currentStaticPuzzle.base_definition.original_data.words as Array<{scrambled?: string, gapped?: string}>).forEach((wordObj) => {
        const key = wordObj.scrambled || wordObj.gapped!;
        const userAnswer = userAnswers[key]?.trim().toUpperCase();
        const correctAnswer = (currentStaticPuzzle.solution as Record<string, string>)[key];
        if (userAnswer === correctAnswer) newFeedback[key] = 'correct';
        else { newFeedback[key] = 'incorrect'; allCorrect = false; }
      });
    } else if (puzzleType === 'sequence_solver' || puzzleType === 'placeholder_input' || puzzleType === 'vector_voyage' || puzzleType === 'missing_symbol' || puzzleType === 'knights_knaves' || puzzleType === 'alternative_uses') {
        if(puzzleType === 'missing_symbol'){
             return; 
        }

        let isL1Correct = false;
        if (puzzleType === 'vector_voyage' && typeof currentStaticPuzzle.solution === 'object' && currentStaticPuzzle.solution !== null) {
            const mag = parseFloat(userAnswers['magnitude']);
            const dir = parseFloat(userAnswers['direction']);
            const solMag = (currentStaticPuzzle.solution as {magnitude: number, direction: number}).magnitude;
            const solDir = (currentStaticPuzzle.solution as {magnitude: number, direction: number}).direction;
            if (Math.abs(mag - solMag) < 0.1 && Math.abs(dir - solDir) < 2) isL1Correct = true;
        } else if (puzzleType === 'knights_knaves') {
            isL1Correct = true; 
             (currentStaticPuzzle.base_definition.original_data.characters as string[]).forEach((char:string) => {
                if (userAnswers[char] !== (currentStaticPuzzle.solution as Record<string,string>)[char]) isL1Correct = false;
             });
        }
        else if (genericInput.trim().toUpperCase() === (currentStaticPuzzle.solution as string)?.toUpperCase() || currentStaticPuzzle.solution === "Conceptual" || puzzleType === 'alternative_uses') {
          isL1Correct = true;
        }

        if (isL1Correct) newFeedback.general = 'correct';
        else { newFeedback.general = 'incorrect'; allCorrect = false; }
    } else {
      allCorrect = false; 
    }

    setFeedback(newFeedback);
    if (allCorrect) {
      setIsLevelCompleted(true);
      toast({ title: `${currentStaticPuzzle.name} - Level 1 Solved!`, description: `You earned ${currentStaticPuzzle.xpAward || 0} XP.`, className: "bg-primary/10 text-primary-foreground" });
      if (currentStaticPuzzle.xpAward) apiClient.addUserXP(currentStaticPuzzle.xpAward);
    } else {
      toast({ variant: "destructive", title: "Some Incorrect Answers", description: "Check your answers and try again." });
    }
  };
  
  const checkMissingSymbolAnswer = (selectedOperator: string) => {
    if (!currentStaticPuzzle || currentStaticPuzzle.base_definition.type !== 'missing_symbol' || !currentStaticPuzzle.solution) return;
    if (selectedOperator === currentStaticPuzzle.solution) {
      setIsLevelCompleted(true);
      setFeedback({ general: 'correct' });
      toast({ title: "Symbol Found!", description: `Correct! You earned ${currentStaticPuzzle.xpAward || 0} XP.`, className: "bg-primary/10 text-primary-foreground" });
      if (currentStaticPuzzle.xpAward) apiClient.addUserXP(currentStaticPuzzle.xpAward);
    } else {
      setFeedback({ general: 'incorrect' });
      toast({ variant: "destructive", title: "Incorrect Symbol", description: "That's not the right operator. Try again!" });
    }
  };


  const handleSubmitDynamicSolution = async () => {
    if (!puzzleId || !currentDynamicPuzzleContent || currentLevel <= 1) return;
    setIsSubmitting(true);
    setDynamicContentError(null); 
    try {
      const response = await apiClient.submitPuzzleSolution(puzzleId, currentLevel, genericInput);
      if (response.correct) {
        toast({ title: `Level ${currentLevel} Solved!`, description: response.message || `Correct! You earned ${response.newXP || 0} XP.`, className: "bg-primary/10 text-primary-foreground" });
        if(response.newXP) await apiClient.addUserXP(response.newXP); 
        
        if (response.puzzleCompleted || currentLevel >= maxLevel) {
          setIsLevelCompleted(true); 
          setCurrentDynamicPuzzleContent(null); 
        } else if (response.newLevel && response.newLevel > currentLevel) {
          setCurrentLevel(response.newLevel);
          fetchDynamicPuzzleContent(response.newLevel);
          setIsLevelCompleted(false); 
        } else { 
          setIsLevelCompleted(true);
        }
      } else {
        toast({ variant: "destructive", title: `Level ${currentLevel} Attempt Incorrect`, description: response.message || "Try again!" });
      }
    } catch (error: any) {
      const errorMessage = error.message || "An unknown error occurred while submitting solution.";
      setDynamicContentError(errorMessage + " Ensure Edge Functions are deployed or try again.");
      toast({ variant: "destructive", title: "Error Submitting Solution", description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const fetchDynamicPuzzleContent = useCallback(async (levelToFetch: number) => {
    if (!puzzleId || levelToFetch <= 1) return; 
    setIsLoading(true);
    setCurrentDynamicPuzzleContent(null);
    setDynamicContentError(null);
    setGenericInput('');
    try {
      const dynamicContent = await apiClient.fetchPuzzleForLevel(puzzleId, levelToFetch);
      setCurrentDynamicPuzzleContent(dynamicContent);
      setIsLevelCompleted(false);
    } catch (error: any) {
      const errorMessage = error.message || "An unknown error occurred while fetching puzzle data.";
      setDynamicContentError(errorMessage); // Set the error message to display in UI
      toast({ variant: "destructive", title: `Error Loading Level ${levelToFetch}`, description: errorMessage + ". Try reloading or go back." });
    } finally {
      setIsLoading(false);
    }
  }, [puzzleId, toast]);


  const handleTryNextLevel = () => {
    if (currentLevel < maxLevel) {
      const nextLevel = currentLevel + 1;
      setCurrentLevel(nextLevel);
      setIsLevelCompleted(false);
      setDynamicContentError(null); 
      if (nextLevel > 1) { 
        fetchDynamicPuzzleContent(nextLevel);
      } else { 
        resetInputsForPuzzle(currentStaticPuzzle); 
      }
    } else {
      toast({title: "Puzzle Mastered!", description: "You've completed all available levels for this puzzle!"});
    }
  };


  if (isLoading && !currentStaticPuzzle) { // Adjusted loading condition
    return <div className="flex justify-center items-center min-h-[calc(100vh-15rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }
  
  if (!currentStaticPuzzle) { // Handles case where puzzleId is invalid after loading
    return (
         <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] text-center p-4">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-2xl font-semibold text-destructive-foreground mb-2">Puzzle Data Missing</h1>
            <p className="text-muted-foreground mb-4">Could not load the details for this puzzle. It might be an invalid link.</p>
            <Button onClick={() => router.push('/dashboard/puzzles')} className="glow-button">
              <ChevronLeft className="mr-2 h-5 w-5" /> Back to Puzzles
            </Button>
        </div>
    );
  }
  
  const puzzleDisplayData = currentStaticPuzzle.base_definition.original_data;

  const renderPuzzleContent = () => {
    if (currentLevel === 1 && currentStaticPuzzle) {
        switch (currentStaticPuzzle.base_definition.type) {
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
                            id={`answer-${key}`} type="text" value={userAnswers[key] || ''}
                            onChange={(e) => handleInputChange(key, e.target.value)}
                            className={`input-glow flex-1 ${ feedback[key] === 'correct' ? 'border-green-500 focus:border-green-600' : feedback[key] === 'incorrect' ? 'border-red-500 focus:border-red-600' : '' }`}
                            maxLength={key.length + 5} disabled={isLevelCompleted}
                        />
                        {feedback[key] === 'correct' && <CheckCircle className="text-green-500" />}
                        {feedback[key] === 'incorrect' && <XCircle className="text-red-500" />}
                        </div>
                    );
                    })}
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
                        <Button key={op} variant="outline" className="text-2xl font-mono h-14 glow-button" onClick={() => checkMissingSymbolAnswer(op)} disabled={isLevelCompleted}>
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
                        <Input type="text" value={genericInput} onChange={(e) => handleGenericInputChange(e.target.value)} placeholder="Your answer" className="input-glow max-w-xs mx-auto" disabled={isLevelCompleted}/>
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
                                <RadioGroup onValueChange={(value) => handleInputChange(char, value)} value={userAnswers[char]} className="flex gap-4" disabled={isLevelCompleted}>
                                    <FormItem className="flex items-center space-x-2"> <RadioGroupItem value="Knight" id={`${char}-knight`} /> <Label htmlFor={`${char}-knight`}>Knight</Label> </FormItem>
                                    <FormItem className="flex items-center space-x-2"> <RadioGroupItem value="Knave" id={`${char}-knave`} /> <Label htmlFor={`${char}-knave`}>Knave</Label> </FormItem>
                                </RadioGroup>
                                {feedback[char] === 'correct' && <CheckCircle className="text-green-500 inline-block ml-2" />}
                                {feedback[char] === 'incorrect' && <XCircle className="text-red-500 inline-block ml-2" />}
                            </div>
                        ))}
                    </div>
                );
            case 'alternative_uses':
                return (
                    <div className="space-y-4">
                        <p className="text-lg">List alternative uses for: <span className="font-semibold text-accent">{puzzleDisplayData.item}</span></p>
                        <Textarea value={genericInput} onChange={(e) => handleGenericInputChange(e.target.value)} placeholder="Enter as many uses as you can think of..." rows={6} className="input-glow" disabled={isLevelCompleted}/>
                    </div>
                );
            case 'vector_voyage':
                return (
                    <div className="space-y-4">
                        <p className="text-lg mb-1">Problem: A ship sails 3km East, then 4km North.</p>
                        <p className="text-lg mb-3">What is its displacement (magnitude and direction relative to East)?</p>
                        <div className="grid grid-cols-2 gap-4">
                            <Input type="number" value={userAnswers['magnitude'] || ''} onChange={(e)=>handleInputChange('magnitude', e.target.value)} placeholder="Magnitude (km)" className="input-glow" disabled={isLevelCompleted}/>
                            <Input type="number" value={userAnswers['direction'] || ''} onChange={(e)=>handleInputChange('direction', e.target.value)} placeholder="Direction (° N of E)" className="input-glow" disabled={isLevelCompleted}/>
                        </div>
                        {feedback.general === 'correct' && <Alert variant="default" className="bg-green-500/10 border-green-500/30 text-green-400"><CheckCircle className="h-5 w-5"/>Correct! Displacement is 5km at approx 53.13° N of E.</Alert>}
                        {feedback.general === 'incorrect' && <Alert variant="destructive"><XCircle className="h-5 w-5"/>Not quite. Remember Pythagorean theorem and trigonometry (tan inverse).</Alert>}
                    </div>
                );
            case 'placeholder_input':
                return (
                    <div className="space-y-4 text-center">
                        {currentStaticPuzzle.id === 'visual_001' && puzzleDisplayData?.image1 && (
                            <div className="flex gap-2 justify-center mb-4">
                                <img src={puzzleDisplayData.image1} alt="Visual Puzzle Image 1" className="rounded-md border max-w-[45%] shadow-md" data-ai-hint="abstract pattern"/>
                                <img src={puzzleDisplayData.image2} alt="Visual Puzzle Image 2" className="rounded-md border max-w-[45%] shadow-md" data-ai-hint="abstract pattern variation"/>
                            </div>
                        )}
                        <p className="text-muted-foreground">{puzzleDisplayData?.prompt || "Enter your solution below:"}</p>
                        <Textarea value={genericInput} onChange={(e) => handleGenericInputChange(e.target.value)} placeholder="Your conceptual solution..." rows={currentStaticPuzzle.id === 'visual_001' ? 1 : 4} className="input-glow" disabled={isLevelCompleted}/>
                        {feedback.general === 'correct' && <Alert variant="default" className="bg-green-500/10 border-green-500/30 text-green-400"><CheckCircle className="h-5 w-5"/>Solution submitted!</Alert>}
                        {feedback.general === 'incorrect' && <Alert variant="destructive"><XCircle className="h-5 w-5"/>Not the expected answer for Level 1. Try again.</Alert>}
                    </div>
                );
            default:
                return <Alert><Lightbulb className="h-4 w-4" /><AlertTitle>Puzzle Type Not Fully Implemented!</AlertTitle><AlertDescription>Gameplay for Level 1 of "{currentStaticPuzzle.name}" (type: {currentStaticPuzzle.base_definition.type}) needs specific UI.</AlertDescription></Alert>;
        }
    }
    
    if (currentLevel > 1) {
        if (isLoading) {
            return <div className="flex justify-center items-center py-10"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
        }
        if (dynamicContentError) {
            return (
                <Alert variant="destructive" className="my-4">
                    <AlertTriangle className="h-5 w-5" />
                    <AlertTitle>Error Loading Level {currentLevel}</AlertTitle>
                    <AlertDescription className="space-y-2">
                        <p>{dynamicContentError}</p>
                        <div className="flex gap-2">
                            <Button onClick={() => fetchDynamicPuzzleContent(currentLevel)} variant="outline" size="sm" className="border-destructive text-destructive hover:bg-destructive/10">
                                Retry Loading
                            </Button>
                            <Button onClick={() => router.push('/dashboard/puzzles')} variant="outline" size="sm">
                                Back to Puzzles
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            );
        }
        if (currentDynamicPuzzleContent) {
            return (
                <div className="space-y-4">
                    <p className="text-lg whitespace-pre-wrap">{currentDynamicPuzzleContent.question}</p>
                    {currentDynamicPuzzleContent.inputType === 'textarea' && 
                        <Textarea value={genericInput} onChange={(e) => setGenericInput(e.target.value)} placeholder="Your answer..." rows={5} className="input-glow" disabled={isLevelCompleted || isSubmitting}/>
                    }
                    {/* TODO: Add other input types based on currentDynamicPuzzleContent.inputType if needed */}
                    {currentDynamicPuzzleContent.hint && <p className="text-sm text-muted-foreground italic">Hint: {currentDynamicPuzzleContent.hint}</p>}
                </div>
            );
        }
        return <p className="text-muted-foreground text-center py-10">Could not display puzzle content for Level {currentLevel}. Please try refreshing or contact support.</p>;
    }
    return null; // Should not be reached if logic is correct
  };


  return (
    <div className="space-y-6">
       <Button variant="outline" onClick={() => router.push('/dashboard/puzzles')} className="mb-6 glow-button">
        <ChevronLeft className="mr-2" /> Back to Puzzle Dashboard
      </Button>
      <Card className="w-full max-w-2xl mx-auto interactive-card shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-headline glow-text-primary text-center">{currentStaticPuzzle.name}</CardTitle>
          <CardDescription className="text-center text-muted-foreground text-sm md:text-base">{currentStaticPuzzle.description}</CardDescription>
           <p className="text-center text-accent font-semibold">Level: {currentLevel} / {maxLevel}</p>
        </CardHeader>
        <CardContent className="min-h-[200px]">
          {isLevelCompleted ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h2 className="text-2xl font-semibold text-green-400">Level {currentLevel} Complete!</h2>
              <p className="text-muted-foreground mt-2">
                You've successfully completed level {currentLevel} of {currentStaticPuzzle.name}.
              </p>
              {currentLevel < maxLevel ? (
                  <Button onClick={handleTryNextLevel} className="glow-button mt-6 text-lg py-3">
                      Proceed to Level {currentLevel + 1} <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
              ) : (
                <p className="text-lg text-primary mt-4 font-semibold">Congratulations! You've mastered this puzzle!</p>
              )}
            </div>
          ) : (
            renderPuzzleContent()
          )}
        </CardContent>
        {!isLevelCompleted && (
             <CardFooter className="flex justify-end">
                {currentLevel === 1 && currentStaticPuzzle.base_definition.type !== 'missing_symbol' && (
                    <Button onClick={checkLevel1Answer} className="glow-button" disabled={isSubmitting}>Check Level 1 Answers</Button>
                )}
                {currentLevel > 1 && currentDynamicPuzzleContent && !dynamicContentError && (
                    <Button onClick={handleSubmitDynamicSolution} className="glow-button" disabled={isSubmitting || isLoading}>
                        {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : null} Submit Level {currentLevel} Solution
                    </Button>
                )}
            </CardFooter>
        )}
      </Card>
    </div>
  );
}

