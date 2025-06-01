
// src/app/dashboard/music/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Music, Info, Radio, Search as SearchIcon, Loader2, Youtube, Disc, PlayCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import type { TablesInsert, SearchResultItem as DatabaseSearchResultItem } from '@/lib/database.types';
import { useEffect, useState, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { googleSearch, type GoogleSearchOutput } from '@/ai/flows/google-search-flow';
import { ScrollArea } from '@/components/ui/scroll-area'; // Added ScrollArea

const DEFAULT_YOUTUBE_VIDEO_EMBED_URL = "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1"; // Lofi Girl default

// For Spotify OAuth
const SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
// IMPORTANT: Replace these with your actual Spotify App Client ID and Redirect URI
const SPOTIFY_CLIENT_ID = "YOUR_SPOTIFY_CLIENT_ID"; // Placeholder
const SPOTIFY_REDIRECT_URI = "YOUR_APP_REDIRECT_URI/auth/spotify/callback"; // Placeholder, e.g., http://localhost:9002/auth/spotify/callback
const SPOTIFY_SCOPES = "user-read-email streaming user-modify-playback-state user-read-private playlist-read-private user-top-read";


export default function MusicPlayerPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string|null>(null);
  const { toast } = useToast();
  
  const [isSearching, startSearchTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResultsList, setSearchResultsList] = useState<DatabaseSearchResultItem[]>([]);
  
  const [currentEmbedUrl, setCurrentEmbedUrl] = useState(DEFAULT_YOUTUBE_VIDEO_EMBED_URL);
  const [currentPlayerTitle, setCurrentPlayerTitle] = useState("Lofi Girl Radio - Beats to Relax/Study to");

  useEffect(() => {
     const getInitialUser = async () => {
        const {data: {user}} = await supabase.auth.getUser();
        setUserId(user?.id || null);
    };
    getInitialUser();
  }, [supabase]);

  useEffect(() => {
    if (userId && currentEmbedUrl === DEFAULT_YOUTUBE_VIDEO_EMBED_URL) { 
      const logActivity = async () => {
        const activityLog: TablesInsert<'activity_logs'> = {
          user_id: userId,
          activity_type: 'music_player_visited',
          description: `Visited the Music Player page (defaulting to YouTube Lofi).`,
          details: { page: '/dashboard/music', initial_view: 'youtube_lofi' }
        };
        await supabase.from('activity_logs').insert(activityLog);
      };
      logActivity();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, supabase]); 

  const handleSpotifyConnect = () => {
    if (SPOTIFY_CLIENT_ID === "YOUR_SPOTIFY_CLIENT_ID" || SPOTIFY_REDIRECT_URI.startsWith("YOUR_APP_REDIRECT_URI")) {
        toast({
            variant: "destructive",
            title: "Spotify Not Configured",
            description: "Developer: Please set your Spotify Client ID and Redirect URI in src/app/dashboard/music/page.tsx to enable Spotify login.",
            duration: 10000,
        });
        return;
    }
    const authUrl = `${SPOTIFY_AUTHORIZE_URL}?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}&scope=${encodeURIComponent(SPOTIFY_SCOPES)}&show_dialog=true`;
    window.location.href = authUrl; // Redirect user to Spotify for login
    // After login, Spotify will redirect to YOUR_APP_REDIRECT_URI with a code.
    // A backend service at that URI is needed to exchange the code for an access token.
  };

  const performYoutubeSearch = async () => {
    if (!searchQuery.trim()) {
        toast({ title: "Empty Search", description: "Please enter a song, artist, or video name."});
        return;
    }
    setSearchResultsList([]); // Clear previous results
    setCurrentEmbedUrl(''); // Clear current player to show search results
    setCurrentPlayerTitle(`Searching for: ${searchQuery}`);

    startSearchTransition(async () => {
        const searchQueryForGoogle = `${searchQuery} youtube`;
        try {
            const result: GoogleSearchOutput = await googleSearch({ query: searchQueryForGoogle, numResults: 5 });
            if (result.error || !result.items || result.items.length === 0) {
                toast({ variant: 'destructive', title: "Search Error", description: result.error || "No relevant YouTube video found." });
                setSearchResultsList([]);
                setCurrentPlayerTitle("Search returned no results");
                setCurrentEmbedUrl(DEFAULT_YOUTUBE_VIDEO_EMBED_URL); // Revert to default
                return;
            }
            setSearchResultsList(result.items);
            setCurrentPlayerTitle(`Search Results for: ${searchQuery}`);
            if (userId) {
                const activityLog: TablesInsert<'activity_logs'> = {
                    user_id: userId,
                    activity_type: 'music_searched_youtube',
                    description: `Searched YouTube for: "${searchQuery}". Found ${result.items.length} results.`,
                    details: { query: searchQuery, results_count: result.items.length }
                };
                await supabase.from('activity_logs').insert(activityLog);
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: "YouTube Search Request Failed", description: e.message || "Could not connect to search service." });
            setCurrentEmbedUrl(DEFAULT_YOUTUBE_VIDEO_EMBED_URL);
            setCurrentPlayerTitle("Lofi Girl Radio - Beats to Relax/Study to");
        }
    });
  };
  
  const playYouTubeVideo = (video: DatabaseSearchResultItem) => {
    if (video.link && video.link.includes("youtube.com/watch?v=")) {
        const videoId = video.link.split("watch?v=")[1].split('&')[0];
        const youtubeEmbedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        setCurrentEmbedUrl(youtubeEmbedUrl);
        setCurrentPlayerTitle(video.title || searchQuery);
        setSearchResultsList([]); // Hide search results, show player
        toast({ title: "Now Playing", description: video.title || searchQuery });
    } else {
        toast({ variant: 'destructive', title: "Invalid YouTube Link", description: "Could not play this item."});
    }
  };

  const resetToDefaultPlayer = () => {
    setCurrentEmbedUrl(DEFAULT_YOUTUBE_VIDEO_EMBED_URL);
    setCurrentPlayerTitle("Lofi Girl Radio - Beats to Relax/Study to");
    setSearchQuery('');
    setSearchResultsList([]);
  };

  return (
    <div className="space-y-10 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Music className="mr-4 h-10 w-10" /> Music Player
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Search YouTube for study music or videos. Spotify integration requires backend setup.
        </p>
      </header>

      <div className="text-center">
        <Button onClick={handleSpotifyConnect} variant="outline" className="glow-button text-lg py-3 border-green-500 hover:bg-green-500/10 text-green-400">
          <Disc className="mr-2"/> Connect to Spotify (Initiates Login - Backend Required)
        </Button>
      </div>

      <Card className="interactive-card shadow-xl w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-headline glow-text-accent flex items-center"><Youtube className="mr-2 text-red-500"/> Search YouTube</CardTitle>
          <CardDescription>Enter a song, artist, or any video name.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
            <Input 
                type="text" 
                placeholder="E.g., Study with me live, Physics lectures" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && performYoutubeSearch()}
                className="input-glow h-11"
            />
            <Button onClick={performYoutubeSearch} disabled={isSearching} className="glow-button h-11">
                {isSearching ? <Loader2 className="animate-spin h-5 w-5"/> : <SearchIcon className="h-5 w-5"/>}
                Search
            </Button>
        </CardContent>
      </Card>
      
      {searchResultsList.length > 0 && (
        <Card className="interactive-card shadow-lg w-full max-w-2xl mx-auto mt-6">
          <CardHeader>
            <CardTitle className="text-xl font-headline glow-text-primary">Search Results for "{searchQuery.substring(0,30)}{searchQuery.length > 30 ? '...' : ''}"</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-3">
              <ul className="space-y-3">
                {searchResultsList.map((item, index) => (
                  <li key={index} className="p-3 border rounded-md bg-card/70 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-foreground truncate" title={item.title}>{item.title}</p>
                        <p className="text-xs text-green-600 dark:text-green-400 truncate">{item.displayLink || item.link}</p>
                      </div>
                      <Button size="sm" onClick={() => playYouTubeVideo(item)} className="glow-button">
                        <PlayCircle className="mr-1.5 h-4 w-4"/> Play
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
          <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => setSearchResultsList([])} className="glow-button">Clear Results</Button>
          </CardFooter>
        </Card>
      )}


      {(currentEmbedUrl && searchResultsList.length === 0) && (
          <Card className="interactive-card shadow-xl w-full max-w-3xl mx-auto mt-6">
            <CardHeader>
              <CardTitle className="text-2xl font-headline glow-text-accent flex items-center">
                <Youtube className="mr-2 text-red-500"/> {currentPlayerTitle}
              </CardTitle>
              <CardDescription>
                Playing from YouTube. Some videos may have embedding restrictions or ads.
              </CardDescription>
            </CardHeader>
            <CardContent className="aspect-video">
              <iframe
                key={currentEmbedUrl} 
                style={{ borderRadius: "12px" }}
                src={currentEmbedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title="YouTube Player Embed"
              ></iframe>
            </CardContent>
            {currentEmbedUrl !== DEFAULT_YOUTUBE_VIDEO_EMBED_URL && (
                <CardFooter>
                    <Button onClick={resetToDefaultPlayer} variant="outline" className="w-full glow-button">
                        Back to Default Lofi Stream
                    </Button>
                </CardFooter>
            )}
          </Card>
      )}
      
      <Alert className="max-w-3xl mx-auto bg-primary/5 border-primary/20">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="text-primary font-semibold">Music Player & Spotify Integration</AlertTitle>
        <AlertDescription>
            Currently, this player primarily uses YouTube for music and video search/playback.
            <br /><br />
            <strong>To enable full Spotify integration (login, search Spotify library, play Spotify tracks):</strong>
            <ol className="list-decimal list-inside pl-4 my-2 space-y-1">
              <li>Replace placeholder `SPOTIFY_CLIENT_ID` and `SPOTIFY_REDIRECT_URI` in this page's code with your actual Spotify Developer App credentials.</li>
              <li>Develop a backend service at your `SPOTIFY_REDIRECT_URI` to handle the OAuth callback from Spotify. This service must exchange the authorization code for an access token and refresh token.</li>
              <li>Securely store and manage these tokens on your backend.</li>
              <li>Implement backend endpoints that your frontend can call to:
                <ul className="list-disc list-inside pl-6">
                  <li>Initiate login.</li>
                  <li>Fetch authenticated user data.</li>
                  <li>Search the Spotify catalog using the user's access token.</li>
                  <li>Potentially control playback via Spotify's Web Playback SDK or Connect API (this requires further frontend SDK integration).</li>
                </ul>
              </li>
            </ol>
            Clicking "Connect to Spotify" will redirect you to Spotify's login page. After login, Spotify will redirect to your specified (currently placeholder) `redirect_uri` with a code. Without a backend handling this callback, the login flow will not complete within the app.
            <br /><br />
            <strong>Background Playback:</strong> Music/video will play as long as this browser tab is active. True background playback (app closed) requires native app features or advanced PWA capabilities.
        </AlertDescription>
      </Alert>
    </div>
  );
}
