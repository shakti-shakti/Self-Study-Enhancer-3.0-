// src/app/dashboard/page.tsx
// VERY SIMPLIFIED VERSION FOR TESTING

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
      <Card className="w-full max-w-lg p-8 interactive-card shadow-2xl shadow-primary/20">
        <CardHeader>
          <CardTitle className="text-5xl font-headline font-bold glow-text-primary mb-4">
            Test Dashboard
          </CardTitle>
          <CardDescription className="text-xl text-muted-foreground">
            This is a minimal dashboard page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg mb-6">
            If you see this page and it stays after logging in, the basic redirection to the /dashboard route is working.
          </p>
          <p className="text-sm text-muted-foreground">
            The next step would be to investigate the middleware or the original complex dashboard page&apos;s components and data fetching.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
