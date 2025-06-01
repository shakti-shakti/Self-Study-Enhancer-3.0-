// src/app/dashboard/games/element-match-memory/page.tsx
'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Atom, CheckCircle, RotateCcw, Loader2, Eye, EyeOff, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as apiClient from '@/lib/apiClient';

interface MemoryCardItem {
  id: number;
  type: 'symbol' | 'name';
  value: string; // Element symbol or name
  elementId: string; // Common ID to link symbol and name, e.g., "H"
  isFlipped: boolean;
  isMatched: boolean;
}

const elementPairs = [
  { symbol: 'H', name: 'Hydrogen' },
  { symbol: 'He', name: 'Helium' },
  { symbol: 'Li', name: 'Lithium' },
  { symbol: 'Be', name: 'Beryllium' },
  { symbol: 'O', name: 'Oxygen' },
  { symbol: 'N', name: 'Nitrogen' },
  // Add more for larger grid if desired, up to half of PAIRS_COUNT
];

const PAIRS_COUNT = 6; // Creates a 4x3 grid (PAIRS_COUNT * 2 cards)

const shuffleArray = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const generateCards = (): MemoryCardItem[] => {
  const selectedPairs = shuffleArray([...elementPairs]).slice(0, PAIRS_COUNT);
  const cards: MemoryCardItem[] = [];
  selectedPairs.forEach((pair, index) => {
    cards.push({ id: index * 2, type: 'symbol', value: pair.symbol, elementId: pair.symbol, isFlipped: false, isMatched: false });
    cards.push({ id: index * 2 + 1, type: 'name', value: pair.name, elementId: pair.symbol, isFlipped: false, isMatched: false });
  });
  return shuffleArray(cards);
};

export default function ElementMatchMemoryPage() {
  const [cards, setCards] = useState<MemoryCardItem[]>(generateCards());
  const [flippedCards, setFlippedCards] = useState<number[]>([]); // Stores indices of flipped cards
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isChecking, setIsChecking] = useState(false); // To prevent rapid clicks
  const [isProcessing, startTransition] = useTransition();

  const { toast } = useToast();

  useEffect(() => {
    if (matches === PAIRS_COUNT) {
      setGameOver(true);
      toast({ title: "Congratulations!", description: `You matched all pairs in ${moves} moves!`, className: "bg-primary/20 text-primary-foreground"});
      // Conceptual: Award Focus Coins
      apiClient.updateUserFocusCoins(currentCoins => (currentCoins || 0) + 20); // Add 20 coins for winning
      toast({title: "You Won!", description: "You earned +20 Focus Coins (Demo)!"});
    }
  }, [matches, moves, toast]);

  const handleCardClick = (index: number) => {
    if (isChecking || cards[index].isFlipped || cards[index].isMatched || flippedCards.length === 2) {
      return;
    }

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);
    setFlippedCards([...flippedCards, index]);
  };

  useEffect(() => {
    if (flippedCards.length === 2) {
      setIsChecking(true);
      setMoves(prev => prev + 1);
      const [firstIndex, secondIndex] = flippedCards;
      const card1 = cards[firstIndex];
      const card2 = cards[secondIndex];

      if (card1.elementId === card2.elementId) {
        // Match found
        setMatches(prev => prev + 1);
        const newCards = cards.map(card => 
          (card.id === card1.id || card.id === card2.id) ? { ...card, isMatched: true, isFlipped: true } : card
        );
        setCards(newCards);
        setFlippedCards([]);
        setIsChecking(false);
      } else {
        // No match, flip back after a delay
        setTimeout(() => {
          const newCards = cards.map(card => 
            (card.id === card1.id || card.id === card2.id) ? { ...card, isFlipped: false } : card
          );
          setCards(newCards);
          setFlippedCards([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  }, [flippedCards, cards]);

  const restartGame = () => {
    startTransition(() => {
      setCards(generateCards());
      setFlippedCards([]);
      setMatches(0);
      setMoves(0);
      setGameOver(false);
      setIsChecking(false);
    });
  };

  return (
    <div className="space-y-8 flex flex-col items-center">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-2 flex items-center justify-center">
          <Atom className="mr-3 h-10 w-10 text-primary" /> Element Match Memory
        </h1>
        <p className="text-lg text-muted-foreground">
          Match element symbols with their names. {PAIRS_COUNT} pairs to find!
        </p>
      </header>

      <Card className="w-full max-w-xl interactive-card shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-headline glow-text-accent">Moves: {moves}</CardTitle>
            <CardDescription>Pairs Found: {matches}/{PAIRS_COUNT}</CardDescription>
          </div>
          <Button onClick={restartGame} variant="outline" className="glow-button" disabled={isProcessing}>
            {isProcessing ? <Loader2 className="animate-spin"/> : <RotateCcw />} Restart
          </Button>
        </CardHeader>
        <CardContent>
          {gameOver ? (
            <div className="text-center py-10">
              <Trophy className="h-16 w-16 mx-auto text-primary mb-4"/>
              <h2 className="text-2xl font-semibold">All Pairs Matched!</h2>
              <p>You completed the game in {moves} moves.</p>
            </div>
          ) : (
            <div className={`grid grid-cols-4 gap-3 sm:gap-4 p-2 sm:p-4 rounded-lg bg-muted/30 aspect-[4/3]`}>
              {cards.map((card, index) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(index)}
                  disabled={card.isFlipped || card.isMatched || isChecking || gameOver}
                  className={`aspect-square rounded-md flex items-center justify-center text-lg sm:text-xl font-bold border-2 transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-primary
                    ${card.isFlipped || card.isMatched ? 'bg-card border-primary rotate-y-180' : 'bg-primary/70 border-primary text-primary-foreground hover:bg-primary'}
                    ${card.isMatched ? 'opacity-70 border-green-500 bg-green-500/20 text-green-400 cursor-default' : ''}
                  `}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className={`absolute w-full h-full flex items-center justify-center backface-hidden ${card.isFlipped || card.isMatched ? 'rotate-y-0' : 'rotate-y-180'}`}>
                    {card.isFlipped || card.isMatched ? card.value : <EyeOff className="h-6 w-6 sm:h-8 sm:w-8"/>}
                  </div>
                   <div className={`absolute w-full h-full flex items-center justify-center backface-hidden ${card.isFlipped || card.isMatched ? 'rotate-y-180' : 'rotate-y-0'}`}>
                    {card.isFlipped || card.isMatched ? card.value : <EyeOff className="h-6 w-6 sm:h-8 sm:w-8"/>}
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
