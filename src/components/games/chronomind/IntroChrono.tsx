
// src/components/games/chronomind/IntroChrono.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, PlayCircle } from 'lucide-react';

interface IntroChronoProps {
  onStartGame: () => void;
}

export default function IntroChrono({ onStartGame }: IntroChronoProps) {
  return (
    <Card className="w-full max-w-2xl text-center bg-black/70 border-accent/50 shadow-2xl shadow-accent/40 p-6 md:p-10 chronomind-puzzle-card">
      <CardHeader>
        <Zap className="h-20 w-20 mx-auto text-accent mb-6 animate-pulse" />
        <CardTitle className="text-5xl font-headline font-bold text-accent-foreground glow-text-accent">
          ChronoMind: The Quantum Rescue
        </CardTitle>
        <CardDescription className="text-xl text-muted-foreground mt-4">
          You awaken in a dim, futuristic lab. A synthesized voice echoes...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-2xl italic text-accent-foreground/90">
          “Welcome, Subject 17. Reality is decaying. To survive, unlock your mind.”
        </p>
        <p className="text-lg text-muted-foreground">
          You are trapped in a fractured universe where each room represents a domain of science. Solving NEET-conceptual puzzles is the only way to advance and restore reality.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={onStartGame} className="w-full text-xl py-6 glow-button bg-accent hover:bg-accent/90 text-accent-foreground">
          <PlayCircle className="mr-2 h-6 w-6" /> Begin the Escape
        </Button>
      </CardFooter>
    </Card>
  );
}

    