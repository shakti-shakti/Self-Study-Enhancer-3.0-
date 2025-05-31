
// src/app/dashboard/browser/page.tsx
'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Search, Home, Info, Youtube, BookOpen } from 'lucide-react'; // Added Youtube icon
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const GOOGLE_SEARCH_URL = "https://www.google.com/search?igu=1&q=";
const YOUTUBE_URL = "https://www.youtube.com";
const NCERT_BOOKS_URL = "https://ncert.nic.in/textbook.php";


export default function InAppBrowserPage() {
  const [currentDisplayUrl, setCurrentDisplayUrl] = useState<string>("https://www.google.com/search?igu=1"); // Initial URL for iframe
  const [inputUrl, setInputUrl] = useState<string>("https://www.google.com"); // For user input field
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleNavigate = (targetUrl?: string) => {
    let finalUrl = targetUrl || inputUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      // If it's likely a search term and not a URL
      if (!finalUrl.includes('.') || finalUrl.includes(' ')) {
        finalUrl = `${GOOGLE_SEARCH_URL}${encodeURIComponent(finalUrl)}`;
      } else {
        finalUrl = `https://${finalUrl}`;
      }
    }
    // Basic validation, can be improved
    if (!finalUrl.match(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?(\?.*)?$/i) && !finalUrl.startsWith(GOOGLE_SEARCH_URL)) {
        alert("Please enter a valid URL (e.g., example.com) or search term.");
        return;
    }
    setCurrentDisplayUrl(finalUrl);
    setInputUrl(finalUrl.startsWith(GOOGLE_SEARCH_URL) ? decodeURIComponent(finalUrl.substring(GOOGLE_SEARCH_URL.length)) : finalUrl);
  };

  const goHome = () => { setCurrentDisplayUrl("https://www.google.com/search?igu=1"); setInputUrl("https://www.google.com");}
  const goToYouTube = () => { setCurrentDisplayUrl(YOUTUBE_URL); setInputUrl(YOUTUBE_URL);}
  const goToNcert = () => { setCurrentDisplayUrl(NCERT_BOOKS_URL); setInputUrl(NCERT_BOOKS_URL);}


  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] space-y-6 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Globe className="mr-4 h-10 w-10" /> In-App Web Browser
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Quickly search doubts, watch lectures, or access online resources without leaving the app.
        </p>
      </header>

      <Card className="flex-1 flex flex-col interactive-card shadow-xl min-h-0">
        <CardHeader className="border-b p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={goHome} title="Home (Google Search)"><Home className="h-5 w-5"/></Button>
            <Input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleNavigate()}
              placeholder="Enter URL or search term..."
              className="flex-1 h-10 input-glow"
            />
            <Button onClick={() => handleNavigate()} className="glow-button"><Search className="mr-2 h-5 w-5"/>Go</Button>
          </div>
          <div className="flex gap-2 justify-center sm:justify-start">
            <Button variant="outline" size="sm" onClick={() => handleNavigate("https://www.google.com")} className="glow-button">
                <Search className="mr-1.5 h-4 w-4"/> Google
            </Button>
            <Button variant="outline" size="sm" onClick={goToYouTube} className="glow-button border-red-500/50 text-red-600 hover:bg-red-500/10 hover:text-red-700">
                <Youtube className="mr-1.5 h-4 w-4"/> YouTube
            </Button>
             <Button variant="outline" size="sm" onClick={goToNcert} className="glow-button border-green-500/50 text-green-600 hover:bg-green-500/10 hover:text-green-700">
                <BookOpen className="mr-1.5 h-4 w-4"/> NCERT Site
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          {currentDisplayUrl ? (
            <iframe
              ref={iframeRef}
              src={currentDisplayUrl}
              title="In-App Browser Content"
              className="w-full h-full border-0"
              sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-top-navigation allow-top-navigation-by-user-activation"
              onError={(e) => console.error("Iframe load error:", e)}
            />
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">Enter a URL above to start browsing.</p>
            </div>
          )}
        </CardContent>
      </Card>
       <Alert variant="default" className="mt-4 bg-muted/30 border-primary/30">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="font-semibold text-primary">Browser Functionality Note</AlertTitle>
        <AlertDescription>
          Some websites may not load correctly due to their security settings (e.g., X-Frame-Options). Navigation history (back/forward) within the iframe is managed by the embedded content.
        </AlertDescription>
      </Alert>
    </div>
  );
}
    
