
// src/app/dashboard/games/page.tsx
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Atom, Dna, Puzzle, Zap, FlaskConical, Leaf, PawPrint, PlayCircle } from 'lucide-react';
import Image from 'next/image';

const games = [
  {
    id: 'chronomind',
    title: 'ChronoMind: The Quantum Rescue',
    description: 'Escape a collapsing multiverse by solving ultra-logical NEET-based challenges. A sci-fi puzzle escape with a mysterious storyline.',
    genre: 'Sci-fi Puzzle Escape + NEET Prep',
    icon: <Zap className="h-12 w-12 text-accent" />,
    imageUrl: 'https://placehold.co/600x400/2d004f/c0ffee.png?text=ChronoMind', 
    dataAiHint: 'sci-fi futuristic'
  },
  {
    id: 'neet-lab-escape',
    title: 'The NEET Lab Escape',
    description: 'Escape a locked NEET preparation lab by solving hidden, sequential puzzles in each subject room. A classic escape room quiz thriller.',
    genre: 'Classic Escape Room + Quiz Thriller',
    icon: <FlaskConical className="h-12 w-12 text-primary" />,
    imageUrl: 'https://placehold.co/600x400/003d2d/aaffdd.png?text=Lab+Escape', 
    dataAiHint: 'science lab escape'
  },
];

export default function GamesHubPage() {
  return (
    <div className="space-y-12">
      <header className="text-center">
        <h1 className="text-5xl font-headline font-bold glow-text-primary mb-4">
          Games Arcade
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Sharpen your mind and test your NEET knowledge with these engaging mini-games!
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {games.map((game) => (
          <Card key={game.id} className="interactive-card overflow-hidden shadow-2xl shadow-primary/20 hover:shadow-accent/30 transform transition-all duration-300 hover:scale-105 group">
            <div className="relative h-56 w-full">
              <Image 
                src={game.imageUrl} 
                alt={game.title} 
                layout="fill" 
                objectFit="cover" 
                className="transition-transform duration-500 group-hover:scale-110"
                data-ai-hint={game.dataAiHint || 'game banner'}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
              <div className="absolute bottom-4 left-4">
                <h2 className="text-3xl font-headline font-bold text-white glow-text-primary">{game.title}</h2>
                <p className="text-sm text-primary-foreground/80">{game.genre}</p>
              </div>
            </div>
            <CardContent className="p-6 space-y-4">
              <CardDescription className="text-base text-muted-foreground min-h-[60px]">{game.description}</CardDescription>
              <Button asChild className="w-full glow-button text-lg py-3">
                <Link href={`/dashboard/games/${game.id}`}>
                  <PlayCircle className="mr-2" /> Play Game
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
    
