// src/app/dashboard/games/whack-a-mole/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { MousePointerClick, PlayCircle, RotateCcw, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const GRID_SIZE = 3; // 3x3 grid
const GAME_DURATION_SECONDS = 30;
const MOLE_UP_TIME_MS = 900; // How long a mole stays up
const MOLE_SPAWN_INTERVAL_MS = 1000; // How often a new mole tries to spawn

export default function WhackAMolePage() {
  const [moles, setMoles] = useState<boolean[]>(Array(GRID_SIZE * GRID_SIZE).fill(false));
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const moleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const moleTimersRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = useCallback(() => {
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    if (moleIntervalRef.current) clearInterval(moleIntervalRef.current);
    moleTimersRef.current.forEach(clearTimeout);
    moleTimersRef.current = [];
  }, []);

  const startGame = () => {
    clearAllTimers();
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

    moleIntervalRef.current = setInterval(spawnMole, MOLE_SPAWN_INTERVAL_MS);
  };

  const endGame = useCallback(() => {
    clearAllTimers();
    setIsPlaying(false);
    setGameOver(true);
  }, [clearAllTimers]);

  const spawnMole = () => {
    if (!isPlaying) return;
    const availableHoles = moles.map((isUp, index) => !isUp ? index : -1).filter(index => index !== -1);
    if (availableHoles.length === 0) return;

    const randomIndex = availableHoles[Math.floor(Math.random() * availableHoles.length)];
    
    setMoles(prevMoles => {
      const newMoles = [...prevMoles];
      newMoles[randomIndex] = true;
      return newMoles;
    });

    const moleTimer = setTimeout(() => {
      setMoles(prevMoles => {
        const newMoles = [...prevMoles];
        newMoles[randomIndex] = false;
        return newMoles;
      });
    }, MOLE_UP_TIME_MS);
    moleTimersRef.current.push(moleTimer);
  };

  const whackMole = (index: number) => {
    if (!isPlaying || !moles[index]) return;

    setScore(prevScore => prevScore + 1);
    setMoles(prevMoles => {
      const newMoles = [...prevMoles];
      newMoles[index] = false;
      return newMoles;
    });
    // Find and clear the specific timer for this mole to prevent it from hiding itself again
    // This part is tricky without tracking specific mole timers, simplified for now.
  };
  
  useEffect(() => {
    return () => clearAllTimers(); // Cleanup on component unmount
  }, [clearAllTimers]);


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
            <CardDescription>Time Left: {timeLeft}s</CardDescription>
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
