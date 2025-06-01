// src/app/dashboard/games/tic-tac-toe/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Grid, Users, Bot, RotateCcw, X, Circle as CircleIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type Player = 'X' | 'O';
type SquareValue = Player | null;
type BoardState = SquareValue[];
type GameMode = ' PvP' | 'PvC'; // Player vs Player, Player vs Computer

const winningCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6],           // Diagonals
];

const initialBoard = () => Array(9).fill(null);

export default function TicTacToePage() {
  const [board, setBoard] = useState<BoardState>(initialBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'Draw' | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('PvP');
  const [isComputerTurn, setIsComputerTurn] = useState(false);

  const checkWinner = (currentBoard: BoardState): Player | 'Draw' | null => {
    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return currentBoard[a];
      }
    }
    if (currentBoard.every(square => square !== null)) {
      return 'Draw';
    }
    return null;
  };

  const computerMove = (currentBoard: BoardState): number => {
    // Basic AI:
    // 1. Try to win
    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (currentBoard[a] === 'O' && currentBoard[b] === 'O' && currentBoard[c] === null) return c;
      if (currentBoard[a] === 'O' && currentBoard[c] === 'O' && currentBoard[b] === null) return b;
      if (currentBoard[b] === 'O' && currentBoard[c] === 'O' && currentBoard[a] === null) return a;
    }
    // 2. Try to block player X from winning
    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (currentBoard[a] === 'X' && currentBoard[b] === 'X' && currentBoard[c] === null) return c;
      if (currentBoard[a] === 'X' && currentBoard[c] === 'X' && currentBoard[b] === null) return b;
      if (currentBoard[b] === 'X' && currentBoard[c] === 'X' && currentBoard[a] === null) return a;
    }
    // 3. Take center if available
    if (currentBoard[4] === null) return 4;
    // 4. Take a random available corner
    const corners = [0, 2, 6, 8].filter(i => currentBoard[i] === null);
    if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
    // 5. Take a random available side
    const sides = [1, 3, 5, 7].filter(i => currentBoard[i] === null);
    if (sides.length > 0) return sides[Math.floor(Math.random() * sides.length)];
    
    // Should not happen if game is not a draw yet
    const availableSquares = currentBoard.map((_, i) => i).filter(i => currentBoard[i] === null);
    return availableSquares[Math.floor(Math.random() * availableSquares.length)];
  };
  
  useEffect(() => {
    if (gameMode === 'PvC' && currentPlayer === 'O' && !winner && !isComputerTurn) {
      setIsComputerTurn(true);
      setTimeout(() => {
        const newBoard = [...board];
        const move = computerMove(newBoard);
        if (newBoard[move] === null) { // Ensure computer doesn't overwrite
          newBoard[move] = 'O';
          setBoard(newBoard);
          const gameWinner = checkWinner(newBoard);
          if (gameWinner) {
            setWinner(gameWinner);
          } else {
            setCurrentPlayer('X');
          }
        }
        setIsComputerTurn(false);
      }, 700); // Simulate thinking time
    }
  }, [currentPlayer, board, winner, gameMode, isComputerTurn]);


  const handleClick = (index: number) => {
    if (winner || board[index] || (gameMode === 'PvC' && currentPlayer === 'O')) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const restartGame = () => {
    setBoard(initialBoard());
    setCurrentPlayer('X');
    setWinner(null);
    setIsComputerTurn(false);
  };
  
  const handleModeChange = (mode: GameMode) => {
    setGameMode(mode);
    restartGame();
  }

  const renderSquare = (index: number) => {
    const value = board[index];
    return (
      <button
        key={index}
        className={cn(
          "flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 border-2 rounded-lg transition-colors duration-150",
          "text-4xl sm:text-5xl font-bold",
          value === 'X' ? "text-primary border-primary/70 bg-primary/10" : 
          value === 'O' ? "text-accent border-accent/70 bg-accent/10" :
          "text-muted-foreground border-border hover:bg-muted/50",
          winner || board[index] ? "cursor-not-allowed" : "cursor-pointer"
        )}
        onClick={() => handleClick(index)}
        disabled={winner !== null || board[index] !== null || (gameMode === 'PvC' && currentPlayer === 'O')}
      >
        {value === 'X' ? <X className="w-10 h-10 sm:w-12 sm:h-12" /> : 
         value === 'O' ? <CircleIcon className="w-10 h-10 sm:w-12 sm:h-12" /> : null}
      </button>
    );
  };

  let status;
  if (winner) {
    status = winner === 'Draw' ? 'It\'s a Draw!' : `Winner: ${winner}!`;
  } else {
    status = `Current Player: ${currentPlayer}`;
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-2 flex items-center justify-center">
          <Grid className="mr-3 h-10 w-10 text-primary" /> Tic Tac Toe
        </h1>
        <p className="text-lg text-muted-foreground">
          Classic X's and O's. Can you outsmart your opponent?
        </p>
      </header>

      <Card className="w-full max-w-md interactive-card shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-center glow-text-accent">{status}</CardTitle>
          <div className="flex justify-center items-center gap-4 mt-2">
             <Label htmlFor="gamemode">Mode:</Label>
             <Select value={gameMode} onValueChange={(value) => handleModeChange(value as GameMode)} disabled={winner !== null || (gameMode === 'PvC' && currentPlayer === 'O')}>
                <SelectTrigger id="gamemode" className="w-[180px] input-glow">
                    <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="PvP"><Users className="inline mr-2 h-4 w-4"/>Player vs Player</SelectItem>
                    <SelectItem value="PvC"><Bot className="inline mr-2 h-4 w-4"/>Player vs Computer</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center p-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {board.map((_, i) => renderSquare(i))}
          </div>
        </CardContent>
        <CardFooter className="flex-col items-center gap-4">
          {winner && (
            <p className={`text-xl font-semibold ${winner === 'X' ? 'text-primary' : winner === 'O' ? 'text-accent' : 'text-muted-foreground'}`}>
              Game Over!
            </p>
          )}
          <Button onClick={restartGame} variant="outline" className="w-full glow-button text-lg">
            <RotateCcw className="mr-2"/> Restart Game
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
