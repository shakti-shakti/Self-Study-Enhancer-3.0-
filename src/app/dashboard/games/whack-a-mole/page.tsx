// src/app/dashboard/games/whack-a-mole/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { MousePointerClick, PlayCircle, RotateCcw, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

const GRID_SIZE = 3; 
const GAME_DURATION_SECONDS = 30;
const MOLE_UP_TIME_MS_BASE = 900; 
const MOLE_SPAWN_INTERVAL_MS_BASE = 1000; 

export default function WhackAMolePage() {
  const [moles, setMoles] = useState<boolean[]>(Array(GRID_SIZE * GRID_SIZE).fill(false));
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const { toast } = useToast();

  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const moleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const moleTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map()); // Store timers by index

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedHighScore = localStorage.getItem('whackAMoleHighScore');
      if (storedHighScore) setHighScore(parseInt(storedHighScore, 10));
    }
  }, []);

  const updateHighScoreAndReward = useCallback(async (currentScore: number) => {
    if (currentScore > highScore) {
      setHighScore(currentScore);
      if (typeof window !== 'undefined') {
        localStorage.setItem('whackAMoleHighScore', currentScore.toString());
      }
      toast({
        title: "New High Score in Whack-a-Mole!",
        description: `You whacked ${currentScore} moles! +25 XP & +10 Focus Coins (Conceptual)!`,
        className: "bg-primary/20 text-primary-foreground"
      });
      await apiClient.addUserXP(25);
      const currentCoins = await apiClient.fetchUserFocusCoins();
      await apiClient.updateUserFocusCoins(currentCoins + 10);
    }
  }, [highScore, toast]);

  const clearAllMoleTimers = useCallback(() => {
    moleTimersRef.current.forEach(clearTimeout);
    moleTimersRef.current.clear();
  }, []);

  const clearSpecificMoleTimer = useCallback((index: number) => {
    if (moleTimersRef.current.has(index)) {
        clearTimeout(moleTimersRef.current.get(index)!);
        moleTimersRef.current.delete(index);
    }
  }, []);

  const clearGameTimers = useCallback(() => {
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    if (moleIntervalRef.current) clearInterval(moleIntervalRef.current);
    clearAllMoleTimers();
  }, [clearAllMoleTimers]);

  const startGame = () => {
    clearGameTimers();
    setScore(0);
    setTimeLeft(GAME_DURATION_SECONDS);
    setMoles(Array(GRID_SIZE * GRID_SIZE).fill(false));
    setIsPlaying(true);
    setGameOver(false);

    gameIntervalRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          endGame();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    moleIntervalRef.current = setInterval(spawnMole, MOLE_SPAWN_INTERVAL_MS_BASE - (score * 5)); // Speed up spawn slightly with score
  };

  const endGame = useCallback(() => {
    clearGameTimers();
    setIsPlaying(false);
    setGameOver(true);
    updateHighScoreAndReward(score);
  }, [clearGameTimers, score, updateHighScoreAndReward]);

  const spawnMole = () => {
    if (!isPlaying || gameOver) return;
    const availableHoles = moles.map((isUp, index) => !isUp ? index : -1).filter(index => index !== -1);
    if (availableHoles.length === 0) return;

    const randomIndex = availableHoles[Math.floor(Math.random() * availableHoles.length)];
    
    setMoles(prevMoles => {
      const newMoles = [...prevMoles];
      newMoles[randomIndex] = true;
      return newMoles;
    });
    
    clearSpecificMoleTimer(randomIndex); // Clear existing timer if any for this hole (shouldn't happen often)
    const moleDuration = Math.max(300, MOLE_UP_TIME_MS_BASE - (score * 10)); // Moles stay up for less time as score increases

    const moleTimer = setTimeout(() => {
      setMoles(prevMoles => {
        const newMoles = [...prevMoles];
        newMoles[randomIndex] = false;
        return newMoles;
      });
      moleTimersRef.current.delete(randomIndex);
    }, moleDuration);
    moleTimersRef.current.set(randomIndex, moleTimer);
  };

  const whackMole = (index: number) => {
    if (!isPlaying || !moles[index] || gameOver) return;

    setScore(prevScore => prevScore + 1);
    setMoles(prevMoles => {
      const newMoles = [...prevMoles];
      newMoles[index] = false;
      return newMoles;
    });
    clearSpecificMoleTimer(index); // Mole whacked, clear its hide timer
  };
  
  useEffect(() => {
    return () => clearGameTimers(); 
  }, [clearGameTimers]);


  return (
    <div className="flex flex-col items-center space-y-6">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-2 flex items-center justify-center">
          <MousePointerClick className="mr-3 h-10 w-10 text-primary" /> Whack-a-Mole
        </h1>
        <p className="text-lg text-muted-foreground">
          Test your reflexes! Whack the moles as they pop up.
        </p>
      </header>

      <Card className="w-full max-w-sm interactive-card shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-xl font-headline glow-text-accent">Score: {score}</CardTitle>
            <CardDescription>Time Left: {timeLeft}s | High Score: {highScore}</CardDescription>
          </div>
          {!isPlaying && !gameOver && (
            <Button onClick={startGame} className="glow-button">
              <PlayCircle className="mr-2"/> Start Game
            </Button>
          )}
          {(isPlaying || gameOver) && (
            <Button onClick={startGame} variant="outline" className="glow-button">
              <RotateCcw className="mr-2"/> Restart
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-4">
          {gameOver ? (
            <div className="text-center py-10">
              <Trophy className="h-16 w-16 mx-auto text-primary mb-4"/>
              <h2 className="text-2xl font-semibold">Game Over!</h2>
              <p>Your final score: {score}</p>
            </div>
          ) : (
            <div className={`grid grid-cols-${GRID_SIZE} gap-2 sm:gap-3 aspect-square bg-muted/30 p-2 rounded-lg`}>
              {moles.map((isUp, index) => (
                <button
                  key={index}
                  onClick={() => whackMole(index)}
                  disabled={!isPlaying}
                  className={cn(
                    "aspect-square rounded-md flex items-center justify-center border-2 border-border transition-all duration-100",
                    "focus:outline-none focus:ring-2 focus:ring-primary",
                    isUp ? "bg-primary/70 hover:bg-primary shadow-lg transform scale-105" : "bg-card hover:bg-muted",
                    !isPlaying && "cursor-not-allowed"
                  )}
                  aria-label={isUp ? "Mole up" : "Empty hole"}
                >
                  {isUp && <span className="text-3xl sm:text-4xl" role="img" aria-label="mole emoji">🐹</span>}
                </button>
              ))}
            </div>
          )}
        </CardContent>
        {gameOver && (
             <CardFooter className="justify-center">
                 <Button onClick={startGame} className="glow-button text-lg mt-4">
                    <RotateCcw className="mr-2"/> Play Again
                </Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
