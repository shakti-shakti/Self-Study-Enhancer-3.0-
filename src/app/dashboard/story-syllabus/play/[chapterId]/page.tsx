
// src/app/dashboard/story-syllabus/play/[chapterId]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollText, ChevronLeft, Loader2, AlertTriangle, Puzzle } from 'lucide-react';
import { initialSyllabusRealms, type Chapter as StoryChapterType } from '@/lib/story-data'; // Use a distinct name for the type
import puzzleDatabase from '@/lib/puzzle-data'; // Import puzzle database to find related puzzles

interface ChapterDisplayData {
  id: string;
  name: string;
  quest: string;
  story_summary?: string;
  realmName?: string;
  subject?: string;
  firstPuzzleId?: string; // ID of a conceptually linked first puzzle
  firstPuzzleName?: string;
}

export default function StoryChapterPlayPage() {
  const params = useParams();
  const router = useRouter();
  const chapterId = typeof params.chapterId === 'string' ? params.chapterId : null;

  const [chapterDisplayData, setChapterDisplayData] = useState<ChapterDisplayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (chapterId) {
      setIsLoading(true);
      let foundChapter: ChapterDisplayData | null = null;
      for (const realm of initialSyllabusRealms) {
        const chapter = realm.chapters.find(ch => ch.id === chapterId);
        if (chapter) {
          // Conceptual link: Find first puzzle matching chapter name/subject for demo
          let firstPuzzleId: string | undefined = undefined;
          let firstPuzzleName: string | undefined = undefined;
          
          const potentialPuzzles = Object.values(puzzleDatabase).filter(p => 
            (p.subject && p.subject.toLowerCase() === realm.subject.toLowerCase()) ||
            (p.name.toLowerCase().includes(chapter.name.toLowerCase().split(" ")[0])) // Match first word of chapter name
          );

          if (potentialPuzzles.length > 0) {
            firstPuzzleId = potentialPuzzles[0].id;
            firstPuzzleName = potentialPuzzles[0].name;
          }

          foundChapter = {
            id: chapter.id,
            name: chapter.name,
            quest: chapter.quest,
            story_summary: chapter.story_summary,
            realmName: realm.name,
            subject: realm.subject,
            firstPuzzleId,
            firstPuzzleName,
          };
          break;
        }
      }
      setChapterDisplayData(foundChapter);
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

  if (!chapterDisplayData) {
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
            {chapterDisplayData.name}
          </CardTitle>
          {chapterDisplayData.realmName && (
            <CardDescription className="text-md text-muted-foreground">
              From the realm of "{chapterDisplayData.realmName}" ({chapterDisplayData.subject})
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-accent mb-2">Your Quest:</h2>
            <p className="text-lg text-foreground italic p-4 bg-muted/30 rounded-md border border-border/30">
              {chapterDisplayData.quest}
            </p>
          </div>
          {chapterDisplayData.story_summary && (
            <div>
              <h2 className="text-xl font-semibold text-accent mb-2">Chapter Introduction:</h2>
              <div className="prose dark:prose-invert max-w-none p-4 bg-background/20 rounded-md border border-border/20 whitespace-pre-line">
                <p>{chapterDisplayData.story_summary}</p>
              </div>
            </div>
          )}
          <div className="mt-6 p-4 border-t border-border/30 text-center">
            {chapterDisplayData.firstPuzzleId ? (
                <Button 
                    onClick={() => router.push(`/dashboard/puzzles/play/${chapterDisplayData.firstPuzzleId}`)} 
                    className="glow-button text-lg py-3"
                >
                    <Puzzle className="mr-2 h-5 w-5"/> Begin First Challenge: {chapterDisplayData.firstPuzzleName || 'Puzzle'}
                </Button>
            ) : (
                <p className="text-muted-foreground">
                    This chapter's interactive elements are under development. Explore related puzzles in the Puzzle Dashboard or check back soon!
                </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground mx-auto">More story content and puzzles will be added progressively.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
