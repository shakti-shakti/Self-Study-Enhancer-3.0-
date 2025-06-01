// src/app/dashboard/games/guess-the-number/page.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Hash, Target, Award, RotateCcw, Loader2, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import * as apiClient from '@/lib/apiClient';

const MAX_NUMBER = 100;
const MAX_ATTEMPTS = 7;

export default function GuessTheNumberPage() {
  const [targetNumber, setTargetNumber] = useState(Math.floor(Math.random() * MAX_NUMBER) + 1);
  const [guess, setGuess] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [feedback, setFeedback] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [highScore, setHighScore] = useState(0); // Conceptual high score (local state)
  const [isProcessing, startTransition] = useTransition();

  const { toast } = useToast();

  useEffect(() => {
    // Conceptual: load high score from localStorage or apiClient if implemented
    const storedHighScore = localStorage.getItem('guessTheNumberHighScore');
    if (storedHighScore) {
      setHighScore(parseInt(storedHighScore, 10));
    }
  }, []);

  const handleGuess = () => {
    if (gameOver || isProcessing) return;
    startTransition(() => {
      const numGuess = parseInt(guess);
      if (isNaN(numGuess) || numGuess < 1 || numGuess > MAX_NUMBER) {
        setFeedback(`Please enter a number between 1 and ${MAX_NUMBER}.`);
        return;
      }

      setAttemptsLeft(prev => prev - 1);
      setGuess('');

      if (numGuess === targetNumber) {
        setFeedback(`Correct! The number was ${targetNumber}. You guessed it in ${MAX_ATTEMPTS - attemptsLeft +1} attempts.`);
        setIsWon(true);
        setGameOver(true);
        const currentAttempts = MAX_ATTEMPTS - attemptsLeft + 1;
        // Lower attempts = better score. For simplicity, score = MAX_ATTEMPTS - attempts_taken + 1
        const currentScore = MAX_ATTEMPTS - currentAttempts + 1; 
        if (currentScore > highScore) {
          setHighScore(currentScore);
          localStorage.setItem('guessTheNumberHighScore', currentScore.toString());
          toast({title: "New High Score!", description: `You set a new high score of ${currentScore}!`});
        }
        // Conceptual: Award Focus Coins
        apiClient.updateUserFocusCoins(currentFocusCoins => (currentFocusCoins || 0) + 10); // Add 10 coins for winning
        toast({title: "You Won!", description: "You earned +10 Focus Coins (Demo)!", className: "bg-primary/20 text-primary-foreground"});
      } else if (attemptsLeft -1 === 0) {
        setFeedback(`Game Over! The number was ${targetNumber}. Better luck next time!`);
        setGameOver(true);
      } else if (numGuess < targetNumber) {
        setFeedback(`${numGuess} is too low. Try a higher number.`);
      } else {
        setFeedback(`${numGuess} is too high. Try a lower number.`);
      }
    });
  };

  const restartGame = () => {
    setTargetNumber(Math.floor(Math.random() * MAX_NUMBER) + 1);
    setGuess('');
    setAttemptsLeft(MAX_ATTEMPTS);
    setFeedback('');
    setGameOver(false);
    setIsWon(false);
  };

  return (
    <div className="space-y-8 flex flex-col items-center">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-2 flex items-center justify-center">
          <Hash className="mr-3 h-10 w-10 text-primary" /> Guess the Number
        </h1>
        <p className="text-lg text-muted-foreground">
          I'm thinking of a number between 1 and {MAX_NUMBER}. Can you guess it in {MAX_ATTEMPTS} tries?
        </p>
      </header>

      <Card className="w-full max-w-md interactive-card shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-headline glow-text-accent">
            {gameOver ? (isWon ? "You Won!" : "Game Over!") : "Make Your Guess"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="number"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder={`1-${MAX_NUMBER}`}
              disabled={gameOver || isProcessing}
              className="input-glow text-lg h-12 flex-1"
              onKeyPress={(e) => e.key === 'Enter' && !gameOver && handleGuess()}
            />
            <Button onClick={handleGuess} disabled={gameOver || isProcessing || !guess} className="glow-button h-12 text-lg">
              {isProcessing ? <Loader2 className="animate-spin"/> : <Target />} Guess
            </Button>
          </div>
          {feedback && (
            <Alert variant={isWon ? "default" : (gameOver ? "destructive" : "default")} className={isWon ? "bg-green-500/10 border-green-500/30" : (gameOver ? "bg-red-500/10 border-red-500/30" : "bg-blue-500/10 border-blue-500/30")}>
              {isWon ? <Award className="h-5 w-5 text-green-500"/> : (gameOver ? <RotateCcw className="h-5 w-5 text-red-500"/> : <Lightbulb className="h-5 w-5 text-blue-500"/>)}
              <AlertTitle className={isWon ? "text-green-600" : (gameOver ? "text-red-600" : "text-blue-600")}>
                {isWon ? "Congratulations!" : (gameOver ? "Try Again!" : "Hint:")}
              </AlertTitle>
              <AlertDescription>{feedback}</AlertDescription>
            </Alert>
          )}
          <p className="text-sm text-muted-foreground text-center">
            Attempts left: <span className="font-bold text-primary">{attemptsLeft}</span>
          </p>
          <p className="text-sm text-muted-foreground text-center">
            High Score (Lowest Attempts): {highScore > 0 ? `${MAX_ATTEMPTS - highScore + 1} attempts` : 'Not Set'}
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={restartGame} variant="outline" className="glow-button text-lg">
            <RotateCcw className="mr-2"/> Restart Game
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
