
// src/app/dashboard/story-syllabus/play/[chapterId]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollText, ChevronLeft, Loader2, AlertTriangle } from 'lucide-react';
import { initialSyllabusRealms } from '@/app/dashboard/story-syllabus/page'; // Import the data

interface ChapterData {
  id: string;
  name: string;
  quest: string;
  story_summary?: string;
  realmName?: string;
  subject?: string;
}

export default function StoryChapterPlayPage() {
  const params = useParams();
  const router = useRouter();
  const chapterId = typeof params.chapterId === 'string' ? params.chapterId : null;

  const [chapterData, setChapterData] = useState<ChapterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (chapterId) {
      setIsLoading(true);
      let foundChapter: ChapterData | null = null;
      for (const realm of initialSyllabusRealms) {
        const chapter = realm.chapters.find(ch => ch.id === chapterId);
        if (chapter) {
          foundChapter = {
            id: chapter.id,
            name: chapter.name,
            quest: chapter.quest,
            story_summary: chapter.story_summary,
            realmName: realm.name,
            subject: realm.subject,
          };
          break;
        }
      }
      setChapterData(foundChapter);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [chapterId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-8">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Loading Chapter Quest...</p>
      </div>
    );
  }

  if (!chapterData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-8">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold text-destructive-foreground mb-2">Chapter Not Found</h1>
        <p className="text-lg text-muted-foreground mb-6">
          The requested story chapter could not be loaded. It might be an invalid link or the chapter data is missing.
        </p>
        <Button onClick={() => router.push('/dashboard/story-syllabus')} className="glow-button">
          <ChevronLeft className="mr-2 h-5 w-5" /> Back to Syllabus Map
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 md:pb-0">
      <Button variant="outline" onClick={() => router.push('/dashboard/story-syllabus')} className="mb-6 glow-button">
        <ChevronLeft className="mr-2 h-5 w-5" /> Back to Syllabus Map
      </Button>

      <Card className="w-full max-w-3xl mx-auto interactive-card shadow-xl shadow-primary/10">
        <CardHeader className="text-center">
          <ScrollText className="mx-auto h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-3xl md:text-4xl font-headline font-bold glow-text-primary">
            {chapterData.name}
          </CardTitle>
          {chapterData.realmName && (
            <CardDescription className="text-md text-muted-foreground">
              From the realm of "{chapterData.realmName}" ({chapterData.subject})
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-accent mb-2">Your Quest:</h2>
            <p className="text-lg text-foreground italic p-4 bg-muted/30 rounded-md border border-border/30">
              {chapterData.quest}
            </p>
          </div>
          {chapterData.story_summary && (
            <div>
              <h2 className="text-xl font-semibold text-accent mb-2">Chapter Introduction:</h2>
              <div className="prose dark:prose-invert max-w-none p-4 bg-background/20 rounded-md border border-border/20 whitespace-pre-line">
                <p>{chapterData.story_summary}</p>
              </div>
            </div>
          )}
          <div className="mt-6 p-4 border-t border-border/30 text-center">
            <p className="text-muted-foreground">
              This is the narrative setup for your quest. Interactive gameplay elements for this chapter will be implemented here.
            </p>
            {/* Placeholder for future interactive elements */}
            <Button className="mt-4 glow-button" disabled>
                Engage with Chapter (Coming Soon)
            </Button>
          </div>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground mx-auto">More story content and puzzles will be added progressively.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
