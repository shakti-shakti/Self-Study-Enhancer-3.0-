// src/app/dashboard/games/memory-match/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Brain, CheckCircle, RotateCcw, Eye, EyeOff, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import * as apiClient from '@/lib/apiClient';

interface MemoryCardItem {
  id: number;
  value: string; 
  uniqueId: string; 
  isFlipped: boolean;
  isMatched: boolean;
  content?: React.ReactNode; 
}

const cardValues = [
  {val: "⚛️", id: "atom"}, {val: "🔬", id: "microscope"}, {val: "🧬", id: "dna"}, 
  {val: "🧪", id: "testtube"}, {val: "🧲", id: "magnet"}, {val: "💡", id: "lightbulb"},
  {val: "📚", id: "books"}, {val: "🧠", id: "brain"}
]; 

const PAIRS_COUNT = 8;

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const generateCards = (): MemoryCardItem[] => {
  const selectedPairs = shuffleArray([...cardValues]).slice(0, PAIRS_COUNT);
  let cards: MemoryCardItem[] = [];
  selectedPairs.forEach((pair, index) => {
    cards.push({ id: index * 2, value: pair.val, uniqueId: pair.id, isFlipped: false, isMatched: false, content: <span className="text-4xl sm:text-5xl">{pair.val}</span> });
    cards.push({ id: index * 2 + 1, value: pair.val, uniqueId: pair.id, isFlipped: false, isMatched: false, content: <span className="text-4xl sm:text-5xl">{pair.val}</span> });
  });
  return shuffleArray(cards);
};

export default function MemoryMatchPage() {
  const [cards, setCards] = useState<MemoryCardItem[]>(generateCards());
  const [flippedCardIndices, setFlippedCardIndices] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [bestMoves, setBestMoves] = useState<number | null>(null);

  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBestMoves = localStorage.getItem('memoryMatchBestMoves');
      if (storedBestMoves) {
        setBestMoves(parseInt(storedBestMoves, 10));
      }
    }
  }, []);

  useEffect(() => {
    const checkGameCompletion = async () => {
      if (matches === PAIRS_COUNT) {
        setGameOver(true);
        let rewardMessage = "";
        if (bestMoves === null || moves < bestMoves) {
          setBestMoves(moves);
          localStorage.setItem('memoryMatchBestMoves', moves.toString());
          rewardMessage = ` New best: ${moves} moves! +25 XP & +10 Focus Coins (Conceptual)!`;
          await apiClient.addUserXP(25);
          const currentCoins = await apiClient.fetchUserFocusCoins();
          await apiClient.updateUserFocusCoins(currentCoins + 10);
        }
        toast({ 
          title: "Congratulations!", 
          description: `You matched all pairs in ${moves} moves!${rewardMessage}`, 
          className: "bg-primary/20 text-primary-foreground"
        });
      }
    };
    checkGameCompletion();
  }, [matches, moves, toast, bestMoves]);

  useEffect(() => { 
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCardClick = (index: number) => {
    if (isChecking || cards[index].isFlipped || cards[index].isMatched || flippedCardIndices.length === 2) {
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current); 

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);
    
    const newFlippedIndices = [...flippedCardIndices, index];
    setFlippedCardIndices(newFlippedIndices);

    if (newFlippedIndices.length === 2) {
      setIsChecking(true);
      setMoves(prev => prev + 1);
      const [firstIndex, secondIndex] = newFlippedIndices;
      const card1 = cards[firstIndex];
      const card2 = cards[secondIndex];

      if (card1.uniqueId === card2.uniqueId) {
        setMatches(prev => prev + 1);
        const updatedCards = cards.map(card => 
          (card.uniqueId === card1.uniqueId) ? { ...card, isMatched: true, isFlipped: true } : card
        );
        setCards(updatedCards);
        setFlippedCardIndices([]);
        setIsChecking(false);
      } else {
        timeoutRef.current = setTimeout(() => {
          const resetCards = cards.map(card => 
            (card.id === card1.id || card.id === card2.id) ? { ...card, isFlipped: false } : card
          );
          setCards(resetCards);
          setFlippedCardIndices([]);
          setIsChecking(false);
        }, 1200);
      }
    }
  };

  const restartGame = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCards(generateCards());
    setFlippedCardIndices([]);
    setMatches(0);
    setMoves(0);
    setGameOver(false);
    setIsChecking(false);
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-2 flex items-center justify-center">
          <Brain className="mr-3 h-10 w-10 text-primary" /> Memory Match Challenge
        </h1>
        <p className="text-lg text-muted-foreground">
          Flip cards and find all {PAIRS_COUNT} matching pairs!
        </p>
      </header>

      <Card className="w-full max-w-lg interactive-card shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-xl font-headline glow-text-accent">Moves: {moves}</CardTitle>
            <CardDescription>Pairs Found: {matches}/{PAIRS_COUNT} | Best: {bestMoves === null ? 'N/A' : `${bestMoves} moves`}</CardDescription>
          </div>
          <Button onClick={restartGame} variant="outline" className="glow-button">
            <RotateCcw /> Restart
          </Button>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          {gameOver ? (
            <div className="text-center py-10">
              <Trophy className="h-16 w-16 mx-auto text-primary mb-4"/>
              <h2 className="text-2xl font-semibold">All Pairs Matched!</h2>
              <p>You completed the game in {moves} moves.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:gap-3 aspect-square">
              {cards.map((card, index) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(index)}
                  disabled={card.isMatched || isChecking && flippedCardIndices.includes(index)}
                  className={cn(
                    "aspect-square rounded-md flex items-center justify-center text-3xl sm:text-4xl font-bold border-2 transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-primary",
                    card.isFlipped || card.isMatched ? 'bg-card border-primary rotate-y-180' : 'bg-primary/70 border-primary text-primary-foreground hover:bg-primary',
                    card.isMatched ? 'opacity-60 border-green-500 bg-green-500/20 cursor-default' : 'cursor-pointer',
                    {'pointer-events-none': isChecking && !flippedCardIndices.includes(index) && !card.isMatched}
                  )}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className={cn("absolute w-full h-full flex items-center justify-center backface-hidden", card.isFlipped || card.isMatched ? 'rotate-y-0' : 'rotate-y-180')}>
                    {card.content}
                  </div>
                  <div className={cn("absolute w-full h-full flex items-center justify-center backface-hidden", card.isFlipped || card.isMatched ? 'rotate-y-180' : 'rotate-y-0')}>
                    <EyeOff className="h-8 w-8 sm:h-10 sm:w-10"/>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
        {gameOver && (
             <CardFooter className="justify-center">
                 <Button onClick={restartGame} className="glow-button text-lg mt-4">
                    <RotateCcw className="mr-2"/> Play Again
                </Button>
            </CardFooter>
        )}
      </Card>
      <style jsx global>{`
        .rotate-y-180 { transform: rotateY(180deg); }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
      `}</style>
    </div>
  );
}
