
// src/app/dashboard/browser/page.tsx
'use client';

import { useState, useRef, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Search, Home, Info, Youtube, BookOpen, ExternalLink, Loader2, ServerCrash } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { googleSearch, type GoogleSearchOutput, type SearchResultItem } from '@/ai/flows/google-search-flow';
import { useToast } from '@/hooks/use-toast';

const GOOGLE_SEARCH_URL_REDIRECT = "https://www.google.com/search?igu=1&q="; // Fallback redirect
const YOUTUBE_URL = "https://www.youtube.com";
const NCERT_BOOKS_URL = "https://ncert.nic.in/textbook.php";

export default function InAppBrowserPage() {
  const [currentDisplayUrl, setCurrentDisplayUrl] = useState<string | null>(null); 
  const [inputUrlOrQuery, setInputUrlOrQuery] = useState<string>("https://www.google.com");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleNavigate = async () => {
    setSearchResults([]); // Clear previous search results
    setCurrentDisplayUrl(null); // Hide iframe initially when new navigation starts

    if (!inputUrlOrQuery.trim()) {
        toast({ variant: 'destructive', title: "Input Empty", description: "Please enter a URL or search term." });
        return;
    }

    let finalUrlToLoad: string | null = null;

    if (isValidUrl(inputUrlOrQuery) || inputUrlOrQuery.startsWith('http://') || inputUrlOrQuery.startsWith('https://')) {
      finalUrlToLoad = inputUrlOrQuery.startsWith('http') ? inputUrlOrQuery : `https://${inputUrlOrQuery}`;
    } else {
      // It's a search query
      startSearchTransition(async () => {
        try {
          const result: GoogleSearchOutput = await googleSearch({ query: inputUrlOrQuery, numResults: 7 });
          if (result.error) {
            toast({ variant: 'destructive', title: "Search Error", description: result.error });
            // Fallback to Google redirect if API fails critically
            finalUrlToLoad = `${GOOGLE_SEARCH_URL_REDIRECT}${encodeURIComponent(inputUrlOrQuery)}`;
            setCurrentDisplayUrl(finalUrlToLoad);
          } else if (result.items.length > 0) {
            setSearchResults(result.items);
            // Do not set currentDisplayUrl here, iframe should be hidden
          } else {
            toast({ title: "No Results", description: "Your search returned no results." });
            // Optionally, redirect to Google as a fallback if no results from API
            // finalUrlToLoad = `${GOOGLE_SEARCH_URL_REDIRECT}${encodeURIComponent(inputUrlOrQuery)}`;
            // setCurrentDisplayUrl(finalUrlToLoad);
          }
        } catch (e: any) {
          toast({ variant: 'destructive', title: "Search Request Failed", description: e.message || "Could not connect to search service." });
          finalUrlToLoad = `${GOOGLE_SEARCH_URL_REDIRECT}${encodeURIComponent(inputUrlOrQuery)}`;
          setCurrentDisplayUrl(finalUrlToLoad);
        }
      });
    }
    
    if (finalUrlToLoad) {
      setCurrentDisplayUrl(finalUrlToLoad);
    }
  };
  
  const loadUrlInIframe = (url: string) => {
    setSearchResults([]); // Clear search results when a link is clicked
    setCurrentDisplayUrl(url);
    setInputUrlOrQuery(url); // Update address bar
  };

  const goHome = () => { setCurrentDisplayUrl(null); setSearchResults([]); setInputUrlOrQuery("https://www.google.com");}
  const goToYouTube = () => loadUrlInIframe(YOUTUBE_URL);
  const goToNcert = () => loadUrlInIframe(NCERT_BOOKS_URL);


  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] space-y-6 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Globe className="mr-4 h-10 w-10" /> In-App Web Browser & Search
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Search the web or navigate directly. Results from Google Custom Search API.
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
              placeholder="Enter URL or search query..."
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
        <CardContent className="flex-1 p-0 overflow-auto relative">
          {isSearching && (
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-background/80 z-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Searching the web...</p>
            </div>
          )}
          {!isSearching && searchResults.length > 0 && (
            <div className="p-4 space-y-4">
              <h2 className="text-xl font-semibold glow-text-accent">Search Results:</h2>
              {searchResults.map((result, index) => (
                <Card key={index} className="bg-card/70 border-border/50 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-primary hover:underline">
                      <a href={result.link} target="_blank" rel="noopener noreferrer" onClick={(e) => { e.preventDefault(); loadUrlInIframe(result.link); }}>
                        {result.title} <ExternalLink className="inline h-4 w-4 ml-1 opacity-70"/>
                      </a>
                    </CardTitle>
                    <CardDescription className="text-xs text-green-600 dark:text-green-400 truncate">{result.displayLink || result.link}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{result.snippet}</p>
                  </CardContent>
                  <CardFooter className="pb-3 pt-0">
                     <Button variant="outline" size="sm" onClick={() => loadUrlInIframe(result.link)} className="glow-button">
                        View Page in App
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          {currentDisplayUrl && !isSearching && searchResults.length === 0 && (
            <iframe
              ref={iframeRef}
              src={currentDisplayUrl}
              title="In-App Browser Content"
              className="w-full h-full border-0"
              sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-top-navigation allow-top-navigation-by-user-activation"
              onError={(e) => {
                console.error("Iframe load error:", e);
                toast({variant: "destructive", title: "Iframe Load Error", description: "Could not load the page. Some websites may block embedding."})
                setCurrentDisplayUrl("/iframe-error.html"); // Conceptual: redirect to a local error page or show message
              }}
            />
          )}
           {!currentDisplayUrl && !isSearching && searchResults.length === 0 && (
             <div className="flex flex-col justify-center items-center h-full text-center p-8">
                <ServerCrash className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-xl text-muted-foreground">Enter a URL or search query to begin.</p>
                <p className="text-sm text-muted-foreground">Or use the quick links above.</p>
            </div>
          )}
        </CardContent>
      </Card>
       <Alert variant="default" className="mt-4 bg-muted/30 border-primary/30">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="font-semibold text-primary">Browser & Search Notes</AlertTitle>
        <AlertDescription>
            Search results are provided by Google Custom Search API. Some websites may not load correctly in the iframe due to their security settings (e.g., X-Frame-Options).
        </AlertDescription>
      </Alert>
    </div>
  );
}
