// src/app/dashboard/games/page.tsx
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Brain, Atom, Dna, Puzzle, Zap, FlaskConical, Leaf, PawPrint, PlayCircle, Bird, 
  AlignCenter, HelpCircle, Hash, BrainCircuit, Rocket, Grid, MousePointerClick, MoveHorizontal 
} from 'lucide-react'; 
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
  {
    id: 'flappy-brain',
    title: 'Flappy Brain',
    description: 'Navigate the brainy bird through obstacles. A simple, fun reflex game. How high can you score?',
    genre: 'Arcade Reflex Game',
    icon: <Bird className="h-12 w-12 text-secondary" />,
    imageUrl: 'https://placehold.co/600x400/7B59E0/FFFFFF.png?text=Flappy+Brain',
    dataAiHint: 'bird game simple'
  },
  {
    id: 'guess-the-number',
    title: 'Guess the Number',
    description: 'A classic number guessing game. The AI thinks of a number, and you try to guess it with hints. Simple but good for logical thinking.',
    genre: 'Logic / Number Game',
    icon: <Hash className="h-12 w-12 text-green-500" />,
    imageUrl: 'https://placehold.co/600x400/4CAF50/FFFFFF.png?text=Guess+It!',
    dataAiHint: 'number question mark',
    isConceptual: false,
  },
  {
    id: 'science-trivia-challenge',
    title: 'Science Trivia Challenge',
    description: 'Test your general science knowledge with rapid-fire trivia questions across Physics, Chemistry, and Biology. Fast-paced and fun!',
    genre: 'Trivia / Quiz',
    icon: <BrainCircuit className="h-12 w-12 text-blue-500" />,
    imageUrl: 'https://placehold.co/600x400/2196F3/FFFFFF.png?text=Trivia!',
    dataAiHint: 'quiz brain lightbulb',
    isConceptual: false,
  },
  {
    id: 'element-match-memory',
    title: 'Element Match Memory',
    description: 'A memory game where you match chemical elements to their symbols or properties. Improves recall and association.',
    genre: 'Memory / Educational',
    icon: <Atom className="h-12 w-12 text-red-500" />,
    imageUrl: 'https://placehold.co/600x400/F44336/FFFFFF.png?text=Element+Match',
    dataAiHint: 'chemistry memory cards',
    isConceptual: false,
  },
  // New external games
  {
    id: 'dino-run',
    title: 'Dino Run',
    description: 'Classic offline T-Rex runner game. Jump over obstacles and survive!',
    genre: 'Arcade / Endless Runner',
    icon: <Rocket className="h-12 w-12 text-purple-400" />,
    imageUrl: 'https://placehold.co/600x400/7C4DFF/FFFFFF.png?text=Dino+Run',
    dataAiHint: 'dinosaur pixel game',
    externalGamePath: '/games/dino/index.html',
    isConceptual: false,
  },
  {
    id: 'memory-match-external', // Changed ID to avoid conflict if an internal one is ever made
    title: 'Memory Match Challenge',
    description: 'Test your memory! Flip cards and find matching pairs. Great for brain training.',
    genre: 'Puzzle / Memory Game',
    icon: <Brain className="h-12 w-12 text-cyan-400" />,
    imageUrl: 'https://placehold.co/600x400/4DD0E1/FFFFFF.png?text=Memory+Match',
    dataAiHint: 'memory cards brain',
    externalGamePath: '/games/memory/index.html',
    isConceptual: false,
  },
  {
    id: '2048-puzzle-external',
    title: '2048 Puzzle Challenge',
    description: 'Slide tiles and combine matching numbers to reach the 2048 tile. A challenging number puzzle.',
    genre: 'Puzzle / Number Game',
    icon: <Hash className="h-12 w-12 text-orange-400" />,
    imageUrl: 'https://placehold.co/600x400/FFB74D/FFFFFF.png?text=2048',
    dataAiHint: 'number puzzle tiles',
    externalGamePath: '/games/2048/index.html',
    isConceptual: false,
  },
  {
    id: 'whack-a-mole',
    title: 'Whack-a-Mole',
    description: 'Test your reaction time! Whack the moles as they pop up. Classic arcade fun.',
    genre: 'Arcade / Reaction Game',
    icon: <MousePointerClick className="h-12 w-12 text-lime-500" />,
    imageUrl: 'https://placehold.co/600x400/AED581/FFFFFF.png?text=Whack-a-Mole',
    dataAiHint: 'mole game hammer',
    externalGamePath: '/games/mole/index.html',
    isConceptual: false,
  },
  {
    id: 'tic-tac-toe',
    title: 'Tic Tac Toe',
    description: "Classic X's and O's. Play against a friend or the conceptual AI.",
    genre: 'Strategy / Board Game',
    icon: <Grid className="h-12 w-12 text-pink-400" />,
    imageUrl: 'https://placehold.co/600x400/BA68C8/FFFFFF.png?text=X+O',
    dataAiHint: 'tic tac toe game',
    externalGamePath: '/games/tictactoe/index.html',
    isConceptual: false,
  },
  {
    id: 'snake-game',
    title: 'Snake Game',
    description: "Classic Snake game. Grow your snake by eating food, but don't hit the walls or yourself!",
    genre: 'Arcade / Classic',
    icon: <MoveHorizontal className="h-12 w-12 text-green-600" />,
    imageUrl: 'https://placehold.co/600x400/81C784/FFFFFF.png?text=Snake',
    dataAiHint: 'snake game classic',
    externalGamePath: '/games/snake/index.html',
    isConceptual: false,
  }
];

export default function GamesHubPage() {
  return (
    <div className="space-y-12">
      <header className="text-center">
        <h1 className="text-5xl font-headline font-bold glow-text-primary mb-4 flex items-center justify-center">
          <Bird className="mr-2 h-10 w-10" />Games Arcade
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Sharpen your mind and test your NEET knowledge with these engaging mini-games!
        </p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {games.map((game) => (
          <Card key={game.id} className="interactive-card overflow-hidden shadow-2xl shadow-primary/20 hover:shadow-accent/30 transform transition-all duration-300 hover:scale-105 group">
            <div className="relative h-56 w-full">
              <Image 
                src={game.imageUrl} 
                alt={game.title} 
                fill 
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
                style={{ objectFit: "cover" }} 
                className="transition-transform duration-500 group-hover:scale-110"
                data-ai-hint={game.dataAiHint || 'game banner'}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
              <div className="absolute bottom-4 left-4">
                {/* Displaying game.icon here if needed, or remove if title is enough */}
                <h2 className="text-3xl font-headline font-bold text-white glow-text-primary">{game.title}</h2>
                <p className="text-sm text-primary-foreground/80">{game.genre}</p>
              </div>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center text-primary mb-2">
                 {/* Optional: Render icon before description if desired */}
                 {/* {game.icon} */}
                 {/* <span className="ml-2 text-sm font-semibold">{game.genre}</span> */}
              </div>
              <CardDescription className="text-base text-muted-foreground min-h-[60px]">{game.description}</CardDescription>
              
              {(game as any).externalGamePath ? (
                <Button asChild className="w-full glow-button text-lg py-3">
                  <a href={(game as any).externalGamePath} target="_blank" rel="noopener noreferrer">
                    <PlayCircle className="mr-2" /> Play Game
                  </a>
                </Button>
              ) : game.isConceptual ? (
                <Button className="w-full text-lg py-3" variant="outline" disabled>
                  <PlayCircle className="mr-2" /> Play Game (Conceptual)
                </Button>
              ) : (
                <Button asChild className="w-full glow-button text-lg py-3">
                  <Link href={`/dashboard/games/${game.id}`}>
                    <PlayCircle className="mr-2" /> Play Game
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
