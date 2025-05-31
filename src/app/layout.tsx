import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter, Space_Grotesk, Source_Code_Pro } from 'next/font/google';
import { cn } from '@/lib/utils';
import ThemeProvider from '@/components/ui/theme-provider'; // Added ThemeProvider

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Note: initialTheme will be passed from DashboardLayout to ThemeProvider
  // For non-dashboard routes, it will default or use localStorage.
  // The className="dark" and style={{colorScheme: 'dark'}} might be removed or adjusted by ThemeProvider.
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={cn(inter.variable, spaceGrotesk.variable, sourceCodePro.variable, "font-body antialiased min-h-screen flex flex-col bg-background text-foreground")}>
        <ThemeProvider> {/* ThemeProvider wraps children */}
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

    