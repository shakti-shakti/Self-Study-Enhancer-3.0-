
// src/app/dashboard/browser/page.tsx
'use client';

import { useState, useRef, useTransition, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Search, Home, Info, Youtube, BookOpen, ExternalLink, Loader2, ServerCrash } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { googleSearch, type GoogleSearchOutput, type SearchResultItem } from '@/ai/flows/google-search-flow';
import { useToast } from '@/hooks/use-toast';

const YOUTUBE_URL = "https://www.youtube.com";
const NCERT_BOOKS_URL = "https://ncert.nic.in/textbook.php";
const GOOGLE_HOME_URL = "https://www.google.com"; // General Google homepage

// Helper to check if a string is a valid URL
const isValidHttpUrl = (string: string): boolean => {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
};

export default function InAppBrowserPage() {
  const [inputUrlOrQuery, setInputUrlOrQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const { toast } = useToast();

  const openUrlInNewTab = (url: string) => {
    if (typeof window !== "undefined") {
      window.open(url, '_blank', 'noopener noreferrer');
    }
  };

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      toast({ variant: 'destructive', title: "Search Empty", description: "Please enter a search term." });
      setSearchResults([]);
      return;
    }

    setSearchResults([]);
    startSearchTransition(async () => {
      try {
        const result: GoogleSearchOutput = await googleSearch({ query: query, numResults: 7 });
        if (result.error) {
          toast({ variant: 'destructive', title: "Search Error", description: result.error });
        } else if (result.items && result.items.length > 0) {
          setSearchResults(result.items);
        } else {
          toast({ title: "No Results", description: `Your search for "${query}" returned no results from the API.` });
        }
      } catch (e: any) {
        toast({ variant: 'destructive', title: "Search Request Failed", description: e.message || "Could not connect to search service." });
      }
    });
  }, [toast]);

  const handleNavigate = async () => {
    const trimmedInput = inputUrlOrQuery.trim();
    if (!trimmedInput) {
        toast({ variant: 'destructive', title: "Input Empty", description: "Please enter a URL or search query." });
        return;
    }

    if (isValidHttpUrl(trimmedInput) || trimmedInput.startsWith("www.")) {
        const urlToOpen = trimmedInput.startsWith("www.") ? `https://${trimmedInput}` : trimmedInput;
        openUrlInNewTab(urlToOpen);
        setSearchResults([]); // Clear search results if a direct URL is opened
    } else {
        handleSearch(trimmedInput);
    }
  };
  
  const goHome = () => { openUrlInNewTab(GOOGLE_HOME_URL); setInputUrlOrQuery(GOOGLE_HOME_URL); setSearchResults([]); }
  const goToYouTube = () => { openUrlInNewTab(YOUTUBE_URL); setInputUrlOrQuery(YOUTUBE_URL); setSearchResults([]); }
  const goToNcert = () => { openUrlInNewTab(NCERT_BOOKS_URL); setInputUrlOrQuery(NCERT_BOOKS_URL); setSearchResults([]); }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] space-y-6 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Globe className="mr-4 h-10 w-10" /> Web Search & Launcher
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Search the web or launch your favorite sites. Links will open in a new browser tab.
        </p>
      </header>

      <Card className="flex-1 flex flex-col interactive-card shadow-xl min-h-0">
        <CardHeader className="border-b p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={goHome} title="Home (Google Search)"><Home className="h-5 w-5"/></Button>
            <Input
              type="text"
              value={inputUrlOrQuery}
              onChange={(e) => setInputUrlOrQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleNavigate()}
              placeholder="Search the web or enter URL..."
              className="flex-1 h-10 input-glow"
            />
            <Button onClick={handleNavigate} className="glow-button" disabled={isSearching}>
                {isSearching ? <Loader2 className="animate-spin h-5 w-5"/> : <Search className="mr-1 sm:mr-2 h-5 w-5"/>}
                <span className="hidden sm:inline">Go</span>
            </Button>
          </div>
          <div className="flex gap-2 justify-center sm:justify-start">
            <Button variant="outline" size="sm" onClick={goToYouTube} className="glow-button border-red-500/50 text-red-600 hover:bg-red-500/10 hover:text-red-700">
                <Youtube className="mr-1.5 h-4 w-4"/> YouTube
            </Button>
             <Button variant="outline" size="sm" onClick={goToNcert} className="glow-button border-green-500/50 text-green-600 hover:bg-green-500/10 hover:text-green-700">
                <BookOpen className="mr-1.5 h-4 w-4"/> NCERT Site
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-4 overflow-auto relative">
          {isSearching && searchResults.length === 0 && (
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-background/80 z-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Searching the web...</p>
            </div>
          )}
          {!isSearching && searchResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold glow-text-accent">Search Results for "{inputUrlOrQuery}":</h2>
              {searchResults.map((result, index) => (
                <Card key={index} className="bg-card/70 border-border/50 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-primary hover:underline">
                      <button onClick={() => openUrlInNewTab(result.link)} className="text-left w-full flex items-center">
                        {result.title} <ExternalLink className="inline h-4 w-4 ml-1 opacity-70 shrink-0"/>
                      </button>
                    </CardTitle>
                    <CardDescription className="text-xs text-green-600 dark:text-green-400 truncate">{result.displayLink || result.link}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{result.snippet}</p>
                  </CardContent>
                  <CardFooter className="pb-3 pt-0">
                     <Button variant="default" size="sm" onClick={() => openUrlInNewTab(result.link)} className="glow-button">
                           <ExternalLink className="mr-1.5 h-4 w-4"/> Open Link in New Tab
                     </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
           {!isSearching && searchResults.length === 0 && (
             <div className="flex flex-col justify-center items-center h-full text-center p-8">
                <ServerCrash className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-xl text-muted-foreground">Enter a search query or URL above.</p>
                <p className="text-sm text-muted-foreground">Search results will appear here. URLs and quick links open in a new tab.</p>
            </div>
          )}
        </CardContent>
      </Card>
       <Alert variant="default" className="mt-4 bg-muted/30 border-primary/30">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="font-semibold text-primary">Web Launcher Note</AlertTitle>
        <AlertDescription>
            This page uses Google Custom Search API for search queries. All links (search results, quick links, or direct URLs) will open in a new browser tab for the best experience.
        </AlertDescription>
      </Alert>
    </div>
  );
}
    
