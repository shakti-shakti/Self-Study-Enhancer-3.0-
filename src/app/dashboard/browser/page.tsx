
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
const GOOGLE_HOME_URL = "https://www.google.com/webhp?igu=1";

export default function InAppBrowserPage() {
  const [currentDisplayUrl, setCurrentDisplayUrlInternal] = useState<string | null>(null); 
  const [inputUrlOrQuery, setInputUrlOrQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  const setSafeCurrentDisplayUrl = useCallback((url: string | null) => {
    if (url === null) {
      setCurrentDisplayUrlInternal(null);
      return;
    }
    try {
      if (url.startsWith("javascript:")) { // Basic check for javascript: URLs
        throw new Error("Javascript URLs are not allowed.");
      }
      // Check if it's a relative path (like /iframe-error.html) or a full http/https URL
      if (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://')) {
         // For full URLs, try to construct to validate. For relative, assume it's fine for our internal error page.
         if (url.startsWith('http')) new URL(url);
         setCurrentDisplayUrlInternal(url);
      } else {
        throw new Error("Attempted to load potentially unsafe or malformed URL schema.");
      }
    } catch (e: any) {
      console.error("Error setting display URL:", url, e.message);
      setCurrentDisplayUrlInternal("/iframe-error.html"); 
      toast({ variant: 'destructive', title: "Invalid URL or Load Error", description: `Could not display: ${url}. It might be an invalid URL or the content disallows embedding.` });
    }
  }, [toast]);
  
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      toast({ variant: 'destructive', title: "Search Empty", description: "Please enter a search term." });
      setSearchResults([]);
      setSafeCurrentDisplayUrl(null); // Hide iframe if search is empty
      return;
    }

    setSafeCurrentDisplayUrl(null); // Hide iframe while searching
    setSearchResults([]); 
    startSearchTransition(async () => {
      try {
        const result: GoogleSearchOutput = await googleSearch({ query: query, numResults: 7 });
        if (result.error) {
          toast({ variant: 'destructive', title: "Search Error", description: result.error });
        } else if (result.items && result.items.length > 0) {
          setSearchResults(result.items);
        } else {
          toast({ title: "No Results", description: "Your search returned no results from the API." });
        }
      } catch (e: any) {
        toast({ variant: 'destructive', title: "Search Request Failed", description: e.message || "Could not connect to search service." });
      }
    });
  }, [toast, setSafeCurrentDisplayUrl /* Removed googleSearch from deps as it's stable */]);

  const handleNavigate = async () => {
    // All inputs from the main bar will now trigger a search
    handleSearch(inputUrlOrQuery);
  };
  
  const loadUrlInIframe = (url: string, updateInputBar: boolean = true) => {
    setSearchResults([]); 
    setSafeCurrentDisplayUrl(url);
    if (updateInputBar) {
        setInputUrlOrQuery(url); 
    }
  };
  
  const goHome = () => { setInputUrlOrQuery(GOOGLE_HOME_URL); loadUrlInIframe(GOOGLE_HOME_URL); }
  const goToYouTube = () => { setInputUrlOrQuery(YOUTUBE_URL); loadUrlInIframe(YOUTUBE_URL); }
  const goToNcert = () => { setInputUrlOrQuery(NCERT_BOOKS_URL); loadUrlInIframe(NCERT_BOOKS_URL); }

  useEffect(() => {
    if (!currentDisplayUrl && searchResults.length === 0 && !inputUrlOrQuery) {
      goHome();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Enhanced iframe error handling
  useEffect(() => {
    const iframeElement = iframeRef.current;
    if (iframeElement && currentDisplayUrl && currentDisplayUrl !== "/iframe-error.html") {
      const handleError = () => {
        console.warn(`Iframe failed to load: ${currentDisplayUrl}. Setting to error page.`);
        setSafeCurrentDisplayUrl("/iframe-error.html");
        // Toast is already shown by setSafeCurrentDisplayUrl if it hits its catch block
      };
      iframeElement.addEventListener('error', handleError);
      return () => {
        if (iframeElement) { // Check if iframeElement still exists
            iframeElement.removeEventListener('error', handleError);
        }
      };
    }
  }, [currentDisplayUrl, setSafeCurrentDisplayUrl]);


  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] space-y-6 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Globe className="mr-4 h-10 w-10" /> In-App Web Browser & Search
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Search the web using Google Custom Search API. Quick links (Home, YouTube, NCERT) attempt to load in-app.
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
              placeholder="Search the web..."
              className="flex-1 h-10 input-glow"
            />
            <Button onClick={handleNavigate} className="glow-button" disabled={isSearching}>
                {isSearching && searchResults.length === 0 ? <Loader2 className="animate-spin h-5 w-5"/> : <Search className="mr-1 sm:mr-2 h-5 w-5"/>}
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
        <CardContent className="flex-1 p-0 overflow-auto relative">
          {isSearching && searchResults.length === 0 && (
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-background/80 z-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Searching the web...</p>
            </div>
          )}
          {!isSearching && searchResults.length > 0 && (
            <div className="p-4 space-y-4">
              <h2 className="text-xl font-semibold glow-text-accent">Search Results for "{inputUrlOrQuery}":</h2>
              {searchResults.map((result, index) => (
                <Card key={index} className="bg-card/70 border-border/50 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-primary hover:underline">
                      <a href={result.link} target="_blank" rel="noopener noreferrer">
                        {result.title} <ExternalLink className="inline h-4 w-4 ml-1 opacity-70"/>
                      </a>
                    </CardTitle>
                    <CardDescription className="text-xs text-green-600 dark:text-green-400 truncate">{result.displayLink || result.link}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{result.snippet}</p>
                  </CardContent>
                  <CardFooter className="pb-3 pt-0">
                     <Button variant="default" size="sm" asChild className="glow-button">
                        <a href={result.link} target="_blank" rel="noopener noreferrer">
                           <ExternalLink className="mr-1.5 h-4 w-4"/> Open Link in New Tab
                        </a>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          {currentDisplayUrl && searchResults.length === 0 && (
            <iframe
              ref={iframeRef}
              src={currentDisplayUrl}
              key={currentDisplayUrl} // Add key to force re-render on src change
              title="In-App Browser Content"
              className="w-full h-full border-0"
              sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-top-navigation allow-top-navigation-by-user-activation"
            />
          )}
           {!currentDisplayUrl && searchResults.length === 0 && !isSearching && (
             <div className="flex flex-col justify-center items-center h-full text-center p-8">
                <ServerCrash className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-xl text-muted-foreground">Search the web or use quick links.</p>
                <p className="text-sm text-muted-foreground">The content area below will show embedded pages (for quick links) or search results.</p>
            </div>
          )}
        </CardContent>
      </Card>
       <Alert variant="default" className="mt-4 bg-muted/30 border-primary/30">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="font-semibold text-primary">Browser & Search Notes</AlertTitle>
        <AlertDescription>
            Search results are provided by Google Custom Search API and will open in a new tab.
            Quick links (Home, YouTube, NCERT) will attempt to load in the frame below. Some websites may not load correctly in the frame due to their security settings (e.g., X-Frame-Options preventing embedding). If a quick link page appears blank or shows an error, it's likely disallowing embedding.
        </AlertDescription>
      </Alert>
    </div>
  );
}
    