
// src/app/dashboard/games/layout.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'NEET Prep+ Games',
  description: 'Engaging games to boost your NEET preparation.',
};

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      <header className="sticky top-0 z-50 p-4 bg-background/80 backdrop-blur-md shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/dashboard/games" className="text-2xl font-headline font-bold text-primary glow-text-primary hover:opacity-80 transition-opacity">
            NEET Games Arcade
          </Link>
          <Button variant="outline" asChild className="glow-button">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-5 w-5" /> Back to Dashboard
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-8">
        {children}
      </main>
      <footer className="p-4 text-center text-sm text-muted-foreground border-t border-border/30">
        &copy; {new Date().getFullYear()} NEET Prep+ - Game On!
      </footer>
    </div>
  );
}
    
