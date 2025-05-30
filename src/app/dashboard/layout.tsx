import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpenCheck, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logout } from '@/app/auth/actions';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Dashboard - NEET Prep+',
  description: 'Your NEET Prep+ Dashboard',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
            <BookOpenCheck className="h-7 w-7" />
            <span className="text-2xl font-headline font-bold glow-text-primary">NEET Prep+</span>
          </Link>
          <div className="flex items-center gap-4">
             <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.email}
            </span>
            <form action={logout}>
              <Button variant="outline" size="sm" className="font-medium border-primary text-primary hover:bg-primary/10 hover:text-primary glow-button">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-8">{children}</main>
      <footer className="py-6 text-center text-muted-foreground text-sm border-t border-border/50">
        NEET Prep+ &copy; {new Date().getFullYear()} - Fueling Your Success.
      </footer>
    </div>
  );
}
