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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
            <BookOpenCheck className="h-10 w-10" />
            <h1 className="text-4xl font-headline font-bold">NEET Prep+</h1>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
