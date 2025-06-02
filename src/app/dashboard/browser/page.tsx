
// src/app/dashboard/browser/page.tsx
'use client';

import React, { useState, useRef, useTransition, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Search, Home, Info, Youtube, BookOpen, ExternalLink, Loader2, Eye, ServerCrash } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { googleSearch, type GoogleSearchOutput, type SearchResultItem } from '@/ai/flows/google-search-flow';
import { useToast } from '@/hooks/use-toast';

const YOUTUBE_URL = "https://www.youtube.com";
const NCERT_BOOKS_URL = "https://ncert.nic.in/textbook.php";
const GOOGLE_HOME_URL = "https://www.google.com/webhp?igu=1"; // igu=1 attempts to bypass country-specific redirects

const isPotentiallyValidUrl = (string: string): boolean => {
  try {
    const s = string.trim();
    if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('//')) {
      new URL(s.startsWith('//') ? `https:${s}` : s); 
      return true;
    }
    if (s.includes('.') && !s.includes(' ') && !s.startsWith('/') && s.length > 3) {
       new URL(`https://${s}`); 
       return true;
    }
  } catch (_) {
    return false;
  }
  return false;
};

const convertToEmbedUrl = (url: string): string => {
    let newUrl = url;
    if (url.includes("youtube.com/watch?v=")) {
        const videoId = url.split("watch?v=")[1].split('&')[0];
        newUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    } else if (url.includes("youtu.be/")) {
        const videoId = url.split("youtu.be/")[1].split('?')[0];
        newUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    // Add more conversions if needed (e.g., Vimeo)
    return newUrl;
};


export default function InAppBrowserPage() {
  const [inputUrlOrQuery, setInputUrlOrQuery] = useState<string>("");
  const [currentDisplayUrl, setCurrentDisplayUrl] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const [isLoadingIframe, setIsLoadingIframe] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  const setSafeCurrentDisplayUrl = useCallback((url: string | null) => {
    if (url === null) {
      setCurrentDisplayUrl(null); 
      setIsLoadingIframe(false);
      return;
    }
    try {
      let fullUrl = url.trim();
      
      fullUrl = convertToEmbedUrl(fullUrl); // Use the converter
      
      if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
        if (fullUrl.startsWith('//')) {
             fullUrl = `https:${fullUrl}`;
        } else {
            fullUrl = `https://${fullUrl}`;
        }
      }
      
      new URL(fullUrl); 
      setCurrentDisplayUrl(fullUrl);
      setIsLoadingIframe(true);
    } catch (e) {
      console.error("Invalid URL for iframe:", url, e);
      setCurrentDisplayUrl("/iframe-error.html"); 
      setIsLoadingIframe(false);
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: `The address "${url}" is not a valid URL to load.`,
      });
    }
  }, [toast]);

  const initiateLoadUrl = useCallback((url: string) => {
    setInputUrlOrQuery(url); 
    setSearchResults([]);    
    setSafeCurrentDisplayUrl(url); 
  }, [setSafeCurrentDisplayUrl]);


  const handleNavigate = async () => {
    const trimmedInput = inputUrlOrQuery.trim();
    if (!trimmedInput) {
      toast({ variant: 'destructive', title: "Input Empty", description: "Please enter a URL or search query." });
      return;
    }

    if (isPotentiallyValidUrl(trimmedInput)) {
      initiateLoadUrl(trimmedInput);
    } else {
      setSafeCurrentDisplayUrl(null); 
      startSearchTransition(async () => {
        try {
          // Modify query to bias towards YouTube results
          const queryForGoogle = `${trimmedInput} youtube`;
          const result: GoogleSearchOutput = await googleSearch({ query: queryForGoogle, numResults: 7 });
          if (result.error) {
            toast({ variant: 'destructive', title: "Search Error", description: result.error });
            setSafeCurrentDisplayUrl("/iframe-error.html"); 
          } else if (result.items && result.items.length > 0) {
            const youtubeResults = result.items.filter(item => item.link.includes("youtube.com/watch") || item.link.includes("youtu.be/"));
            if (youtubeResults.length > 0) {
                 setSearchResults(youtubeResults);
            } else {
                 toast({ title: "No YouTube Videos Found", description: `Your search for "${trimmedInput}" did not return direct YouTube video links. Please try a more specific query.` });
                 setSearchResults([]); 
            }
          } else {
            toast({ title: "No Results", description: `Your search for "${trimmedInput}" returned no results.` });
            setSearchResults([]); 
          }
        } catch (e: any) {
          toast({ variant: 'destructive', title: "Search Request Failed", description: e.message || "Could not connect to search service." });
          setSafeCurrentDisplayUrl("/iframe-error.html"); 
        }
      });
    }
  };
  
  const goHome = () => { initiateLoadUrl(GOOGLE_HOME_URL); }
  const goToYouTube = () => { initiateLoadUrl(YOUTUBE_URL); }
  const goToNcert = () => { initiateLoadUrl(NCERT_BOOKS_URL); }

  useEffect(() => {
    goHome(); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleIframeLoad = () => setIsLoadingIframe(false);
  const handleIframeError = (e: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
    setIsLoadingIframe(false);
    console.warn("Iframe loading error event triggered for:", currentDisplayUrl, e);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] space-y-6 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Globe className="mr-4 h-10 w-10" /> Web Explorer
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Enter a URL to view in-app, or search the web for YouTube videos. External sites may prevent embedding.
        </p>
      </header>

      <Card className="flex-1 flex flex-col interactive-card shadow-xl min-h-0">
        <CardHeader className="border-b p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={goHome} title="Home (Google)"><Home className="h-5 w-5"/></Button>
            <Input
              type="text"
              value={inputUrlOrQuery}
              onChange={(e) => setInputUrlOrQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleNavigate()}
              placeholder="Search YouTube or enter URL (e.g., wikipedia.org)"
              className="flex-1 h-10 input-glow"
            />
            <Button onClick={handleNavigate} className="glow-button" disabled={isSearching || isLoadingIframe}>
                {(isSearching || isLoadingIframe) ? <Loader2 className="animate-spin h-5 w-5"/> : <Search className="mr-1 sm:mr-2 h-5 w-5"/>}
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
        <CardContent className="flex-1 p-0 relative overflow-hidden">
          {searchResults.length > 0 && (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-10 p-4 overflow-y-auto space-y-4">
              <h2 className="text-xl font-semibold glow-text-accent">Search Results for "{inputUrlOrQuery.split(' ').slice(0,5).join(' ')}{inputUrlOrQuery.length > 30 ? '...' : ''}":</h2>
              {searchResults.map((result, index) => (
                <Card key={index} className="bg-card/70 border-border/50 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-primary hover:underline">
                       <button onClick={() => initiateLoadUrl(result.link)} className="text-left flex items-center w-full">
                        {result.title}
                      </button>
                    </CardTitle>
                    <CardDescription className="text-xs text-green-600 dark:text-green-400 truncate">{result.displayLink || result.link}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{result.snippet}</p>
                  </CardContent>
                   <CardFooter className="pb-3 pt-0">
                     <Button variant="default" size="sm" onClick={() => initiateLoadUrl(result.link)} className="glow-button">
                           <Eye className="mr-1.5 h-4 w-4"/> View Video
                     </Button>
                  </CardFooter>
                </Card>
              ))}
               <Button variant="outline" onClick={() => setSearchResults([])} className="mt-4 glow-button">Clear Search Results</Button>
            </div>
          )}

          <div className={`w-full h-full transition-opacity duration-300 ${searchResults.length > 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {currentDisplayUrl ? (
              <>
                {isLoadingIframe && (
                  <div className="absolute inset-0 flex flex-col justify-center items-center bg-background/80 z-10">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Loading {inputUrlOrQuery}...</p>
                  </div>
                )}
                <iframe
                  ref={iframeRef}
                  key={currentDisplayUrl} // Force re-render on URL change
                  src={currentDisplayUrl} 
                  title="In-app browser content"
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation" 
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  allow="autoplay; encrypted-media; picture-in-picture"
                />
              </>
            ) : (
              isSearching ? ( 
                 <div className="flex flex-col justify-center items-center h-full text-center p-8">
                  <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
                  <p className="text-xl text-muted-foreground">Searching for "{inputUrlOrQuery}"...</p>
                </div>
              ) : ( 
                <div className="flex flex-col justify-center items-center h-full text-center p-8">
                  <Globe className="h-24 w-24 text-muted-foreground/30 mb-6" />
                  <p className="text-2xl text-muted-foreground">Enter a URL or search query above.</p>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
       <Alert variant="default" className="mt-4 bg-muted/30 border-primary/30">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="font-semibold text-primary">Web Explorer Usage</AlertTitle>
        <AlertDescription>
            Direct URLs and quick links attempt to load in this window. Search results will prioritize YouTube. Some websites may prevent in-app embedding and show a "refused to connect" error or a blank page within the frame.
        </AlertDescription>
      </Alert>
    </div>
  );
}
    
