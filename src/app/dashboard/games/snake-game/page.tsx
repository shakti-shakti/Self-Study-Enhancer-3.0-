// src/app/dashboard/games/snake-game/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { MoveHorizontal, PlayCircle, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

const GRID_SIZE = 20; 
const INITIAL_SNAKE = [{ x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) }];
const INITIAL_DIRECTION = { x: 0, y: -1 }; 
const INITIAL_SPEED_MS = 200; 
const SPEED_INCREMENT = 10; 
const MIN_SPEED_MS = 80;

type Position = { x: number; y: number };
type Direction = Position;

export default function SnakeGamePage() {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>(getRandomFoodPosition(INITIAL_SNAKE));
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(INITIAL_SPEED_MS);
  const { toast } = useToast();
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const directionQueue = useRef<Direction[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedHighScore = localStorage.getItem('snakeGameHighScore');
      if (storedHighScore) setHighScore(parseInt(storedHighScore, 10));
    }
  }, []);

  const updateHighScoreAndReward = useCallback(async (currentScore: number) => {
    if (currentScore > highScore) {
      setHighScore(currentScore);
      if (typeof window !== 'undefined') {
        localStorage.setItem('snakeGameHighScore', currentScore.toString());
      }
      toast({
        title: "New High Score!",
        description: `You scored ${currentScore} in Snake! +25 XP & +10 Focus Coins (Conceptual)!`,
        className: "bg-primary/20 text-primary-foreground"
      });
      await apiClient.addUserXP(25);
      const currentCoins = await apiClient.fetchUserFocusCoins();
      await apiClient.updateUserFocusCoins(currentCoins + 10);
    }
  }, [highScore, toast]);

  function getRandomFoodPosition(currentSnake: Position[]): Position {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setFood(getRandomFoodPosition(INITIAL_SNAKE));
    setDirection(INITIAL_DIRECTION);
    directionQueue.current = [];
    setScore(0);
    setGameOver(false);
    setIsPlaying(false);
    setGameSpeed(INITIAL_SPEED_MS);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
  }, []);
  
  const startGame = () => {
    resetGame();
    setIsPlaying(true);
  };


  const moveSnake = useCallback(() => {
    if (gameOver || !isPlaying) return;

    let currentDirection = direction;
    if (directionQueue.current.length > 0) {
      currentDirection = directionQueue.current.shift()!;
      setDirection(currentDirection); 
    }

    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };
      head.x += currentDirection.x;
      head.y += currentDirection.y;

      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        updateHighScoreAndReward(score);
        setIsPlaying(false);
        return prevSnake;
      }

      for (let i = 1; i < newSnake.length; i++) {
        if (newSnake[i].x === head.x && newSnake[i].y === head.y) {
          setGameOver(true);
          updateHighScoreAndReward(score);
          setIsPlaying(false);
          return prevSnake;
        }
      }

      newSnake.unshift(head); 

      if (head.x === food.x && head.y === food.y) {
        setScore(s => s + 1);
        setFood(getRandomFoodPosition(newSnake));
        setGameSpeed(prevSpeed => Math.max(MIN_SPEED_MS, prevSpeed - SPEED_INCREMENT));
      } else {
        newSnake.pop(); 
      }
      return newSnake;
    });
  }, [direction, food, gameOver, isPlaying, score, updateHighScoreAndReward]);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      gameLoopRef.current = setInterval(moveSnake, gameSpeed);
      return () => {
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      };
    }
  }, [moveSnake, isPlaying, gameOver, gameSpeed]);

  const changeDirection = (newDirection: Direction) => {
    const lastDirection = directionQueue.current.length > 0 ? directionQueue.current[directionQueue.current.length - 1] : direction;
    if (
      (newDirection.x !== 0 && newDirection.x === -lastDirection.x) ||
      (newDirection.y !== 0 && newDirection.y === -lastDirection.y)
    ) {
      return; 
    }
    if(directionQueue.current.length < 2) { // Limit queued moves to 2
        directionQueue.current.push(newDirection);
    }
  };


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isPlaying) {
          if(event.key === ' ' || event.key === 'Enter') { // Start game with space/enter if idle/gameover
              startGame();
          }
          return;
      }
      switch (event.key) {
        case 'ArrowUp': case 'w': case 'W': changeDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': case 's': case 'S': changeDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': case 'a': case 'A': changeDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': case 'd': case 'D': changeDirection({ x: 1, y: 0 }); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, direction]); 

  return (
    <div className="flex flex-col items-center space-y-6">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-2 flex items-center justify-center">
          <MoveHorizontal className="mr-3 h-10 w-10 text-primary" /> Snake Game
        </h1>
        <p className="text-lg text-muted-foreground">
          Use arrow keys or on-screen buttons to control the snake. Eat food to grow!
        </p>
      </header>

      <Card className="w-full max-w-sm sm:max-w-md interactive-card shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-headline glow-text-accent">Score: {score}</CardTitle>
            <CardDescription>High Score: {highScore}</CardDescription>
          </div>
          {!isPlaying && (
             <Button onClick={startGame} className="glow-button">
                <PlayCircle className="mr-2"/> {gameOver ? 'Play Again' : 'Start Game'}
            </Button>
          )}
           {isPlaying && !gameOver && (
            <Button onClick={() => setIsPlaying(false)} variant="outline" className="glow-button">Pause</Button>
           )}
        </CardHeader>
        <CardContent className="p-2 sm:p-3 bg-muted/40 rounded-lg game-canvas">
          <div 
            className="grid relative aspect-square border-2 border-primary"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
              const x = i % GRID_SIZE;
              const y = Math.floor(i / GRID_SIZE);
              const isSnakeSegment = snake.some(seg => seg.x === x && seg.y === y);
              const isSnakeHead = snake.length > 0 && snake[0].x === x && snake[0].y === y;
              const isFood = food.x === x && food.y === y;
              return (
                <div
                  key={i}
                  className={cn(
                    "aspect-square border-[0.5px] border-border/20",
                    isSnakeHead ? "bg-green-600 rounded-sm" : 
                    isSnakeSegment ? "bg-green-400 rounded-sm" : 
                    isFood ? "bg-red-500 rounded-full" : 
                    "bg-card"
                  )}
                />
              );
            })}
             {gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                    <Trophy className="h-12 w-12 text-yellow-400 mb-2"/>
                    <p className="text-3xl font-bold text-white mb-2">Game Over!</p>
                    <p className="text-xl text-gray-300 mb-4">Final Score: {score}</p>
                     <Button onClick={startGame} className="glow-button">
                        <RotateCcw className="mr-2"/> Play Again
                    </Button>
                </div>
            )}
             {!isPlaying && !gameOver && score === 0 && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                    <p className="text-2xl font-bold text-white mb-4">Press Start</p>
                </div>
             )}
             {!isPlaying && !gameOver && score > 0 && ( 
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                    <p className="text-2xl font-bold text-white mb-4">Paused</p>
                    <Button onClick={() => setIsPlaying(true)} className="glow-button"><PlayCircle className="mr-2"/>Resume</Button>
                </div>
             )}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-3 gap-2 w-72 sm:w-96 mt-4">
        <div></div> 
        <Button variant="outline" onClick={() => changeDirection({ x: 0, y: -1 })} disabled={!isPlaying || direction.y === 1} className="glow-button aspect-square text-2xl p-0 h-20 sm:h-24"><ArrowUp className="w-12 h-12 sm:w-16 sm:h-16" /></Button>
        <div></div> 
        <Button variant="outline" onClick={() => changeDirection({ x: -1, y: 0 })} disabled={!isPlaying || direction.x === 1} className="glow-button aspect-square text-2xl p-0 h-20 sm:h-24"><ArrowLeft className="w-12 h-12 sm:w-16 sm:h-16" /></Button>
        <Button variant="outline" onClick={() => changeDirection({ x: 0, y: 1 })} disabled={!isPlaying || direction.y === -1} className="glow-button aspect-square text-2xl p-0 h-20 sm:h-24"><ArrowDown className="w-12 h-12 sm:w-16 sm:h-16" /></Button>
        <Button variant="outline" onClick={() => changeDirection({ x: 1, y: 0 })} disabled={!isPlaying || direction.x === -1} className="glow-button aspect-square text-2xl p-0 h-20 sm:h-24"><ArrowRight className="w-12 h-12 sm:w-16 sm:h-16" /></Button>
      </div>
    </div>
  );
}
