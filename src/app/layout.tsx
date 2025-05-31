import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter, Space_Grotesk, Source_Code_Pro } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-source-code-pro',
  weight: ['400', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NEET Prep+ | Advanced AI Study Companion',
  description: 'Your ultimate AI-powered companion for cracking the NEET exam. Personalized study plans, AI assistance, comprehensive resources, and much more with a gaming-inspired interface.',
  // themeColor will be set dynamically based on light/dark mode preference
  // Initial theme preference could be set here or via a script if needed.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable, spaceGrotesk.variable, sourceCodePro.variable, "dark")} style={{colorScheme: 'dark'}} suppressHydrationWarning>
      <head />
      <body className="font-body antialiased min-h-screen flex flex-col bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
