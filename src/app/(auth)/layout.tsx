import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpenCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Authentication - NEET Prep+',
  description: 'Login or Sign Up to NEET Prep+',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-secondary/30 to-primary/20 animate-gradient-flow bg-[length:200%_200%]">
      <div className="w-full max-w-md transform transition-all duration-500 ease-out">
        <div className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center gap-3 text-primary hover:text-primary/90 transition-colors duration-300">
            <BookOpenCheck className="h-12 w-12" />
            <h1 className="text-5xl font-headline font-bold glow-text-primary">NEET Prep+</h1>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
