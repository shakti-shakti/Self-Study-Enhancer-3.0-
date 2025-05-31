
// src/app/dashboard/browser/page.tsx
'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Search, ArrowLeft, ArrowRight, RotateCcw, Home, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function InAppBrowserPage() {
  const [url, setUrl] = useState<string>("https://www.google.com/search?igu=1"); // igu=1 to prevent Google redirect loops in iframe sometimes
  const [inputUrl, setInputUrl] = useState<string>("https://www.google.com");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleNavigate = () => {
    let finalUrl = inputUrl;
    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
      finalUrl = `https://${inputUrl}`;
    }
    // Basic validation to prevent non-http/https protocols
    if (!finalUrl.match(/^https?:\/\/[^\s/$.?#].[^\s]*$/i)) {
        alert("Please enter a valid URL starting with http:// or https://");
        return;
    }
    setUrl(finalUrl);
  };

  const goBack = () => iframeRef.current?.contentWindow?.history.back();
  const goForward = () => iframeRef.current?.contentWindow?.history.forward();
  const reload = () => iframeRef.current?.contentWindow?.location.reload();
  const goHome = () => { setUrl("https://www.google.com/search?igu=1"); setInputUrl("https://www.google.com");}

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
        <CardHeader className="border-b p-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={goBack} title="Back"><ArrowLeft className="h-5 w-5"/></Button>
            <Button variant="ghost" size="icon" onClick={goForward} title="Forward"><ArrowRight className="h-5 w-5"/></Button>
            <Button variant="ghost" size="icon" onClick={reload} title="Reload"><RotateCcw className="h-5 w-5"/></Button>
            <Button variant="ghost" size="icon" onClick={goHome} title="Home (Google)"><Home className="h-5 w-5"/></Button>
            <Input 
              type="text" 
              value={inputUrl} 
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleNavigate()}
              placeholder="Enter URL (e.g., google.com)"
              className="flex-1 h-10 input-glow"
            />
            <Button onClick={handleNavigate} className="glow-button"><Search className="mr-2 h-5 w-5"/>Go</Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          {url ? (
            <iframe
              ref={iframeRef}
              src={url}
              title="In-App Browser Content"
              className="w-full h-full border-0"
              sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-top-navigation allow-top-navigation-by-user-activation"
              // The sandbox attribute is important for security with iframes.
              // Adjust permissions as needed, but be cautious.
              // Some sites might block embedding via X-Frame-Options header.
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
        <AlertTitle className="font-semibold text-primary">Browser Compatibility</AlertTitle>
        <AlertDescription>
          Please note that some websites may not load correctly or at all within this in-app browser due to their security settings (e.g., X-Frame-Options). This is a limitation of web embedding technology.
        </AlertDescription>
      </Alert>
    </div>
  );
}

    