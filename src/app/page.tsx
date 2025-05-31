import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, BookOpenCheck, LogIn } from 'lucide-react';

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-background via-secondary/20 to-primary/10 text-center animate-gradient-flow bg-[length:200%_200%]">
      <BookOpenCheck className="w-24 h-24 text-primary mb-6 glow-text-primary" />
      <h1 className="text-5xl md:text-6xl font-headline font-bold text-foreground mb-4 glow-text-primary">
        Welcome to NEET Prep+
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10">
        Your ultimate companion for cracking the NEET exam. Personalized study plans, AI assistance, comprehensive resources, and much more.
      </p>

      {user ? (
        <div className="space-y-4">
          <p className="text-lg text-foreground">You are logged in as {user.email}.</p>
          <Button asChild size="lg" className="font-semibold text-lg py-3 px-6 glow-button">
            <Link href="/dashboard">
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="font-semibold text-lg py-3 px-6 glow-button">
            <Link href="/login">
              <LogIn className="mr-2 h-5 w-5" /> Login
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="font-semibold text-lg py-3 px-6 glow-button border-primary text-primary hover:bg-primary/10 hover:text-primary">
            <Link href="/signup">
              Sign Up Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      )}

      <footer className="absolute bottom-8 text-muted-foreground text-sm">
        &copy; {new Date().getFullYear()} NEET Prep+. All rights reserved.
      </footer>
    </main>
  );
}
