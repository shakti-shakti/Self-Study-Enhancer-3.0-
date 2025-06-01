
// src/app/dashboard/music/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Music, Info, Radio, Search as SearchIcon, Loader2, Youtube } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import type { TablesInsert } from '@/lib/database.types';
import { useEffect, useState, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { googleSearch, type GoogleSearchOutput, type SearchResultItem } from '@/ai/flows/google-search-flow';

const DEFAULT_SPOTIFY_EMBED_URL = "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M"; // Example: Spotify's "Chill Vibes" playlist

export default function MusicPlayerPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string|null>(null);
  const { toast } = useToast();
  const [isSearching, startSearchTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentEmbedUrl, setCurrentEmbedUrl] = useState(DEFAULT_SPOTIFY_EMBED_URL);
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string | null>(null);

  useEffect(() => {
     const getInitialUser = async () => {
        const {data: {user}} = await supabase.auth.getUser();
        setUserId(user?.id || null);
    };
    getInitialUser();
  }, [supabase]);

  useEffect(() => {
    if (userId && !currentSearchTerm) { // Only log initial visit if not searching
      const logActivity = async () => {
        const activityLog: TablesInsert<'activity_logs'> = {
          user_id: userId,
          activity_type: 'music_player_visited',
          description: `Visited the Music Player page.`,
          details: { page: '/dashboard/music', initial_view: 'spotify_playlist' }
        };
        await supabase.from('activity_logs').insert(activityLog);
      };
      logActivity();
    }
  }, [userId, supabase, currentSearchTerm]);

  const handleConnectSpotify = () => {
    toast({
        title: "Connect to Spotify (Future Feature)",
        description: "Full Spotify integration, allowing you to search and play any song from your account, is planned for a future update. This would require you to authenticate with Spotify.",
        duration: 7000,
    });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
        toast({ title: "Empty Search", description: "Please enter a song or artist name."});
        return;
    }
    setCurrentSearchTerm(searchQuery);
    startSearchTransition(async () => {
        try {
            const result: GoogleSearchOutput = await googleSearch({ query: `${searchQuery} youtube official audio or music video`, numResults: 1 });
            if (result.error || !result.items || result.items.length === 0) {
                toast({ variant: 'destructive', title: "Search Error", description: result.error || "No relevant YouTube video found." });
                setCurrentEmbedUrl(DEFAULT_SPOTIFY_EMBED_URL); // Revert to default if search fails
                return;
            }
            
            const firstResult = result.items[0];
            if (firstResult.link && firstResult.link.includes("youtube.com/watch?v=")) {
                const videoId = firstResult.link.split("watch?v=")[1].split('&')[0];
                const youtubeEmbedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`; // Added autoplay
                setCurrentEmbedUrl(youtubeEmbedUrl);
                toast({ title: "Now Playing (Attempting)", description: `Trying to play: ${firstResult.title}`});

                 if (userId) {
                    const activityLog: TablesInsert<'activity_logs'> = {
                    user_id: userId,
                    activity_type: 'music_searched',
                    description: `Searched for music: "${searchQuery}". Attempting to play: ${firstResult.title}`,
                    details: { query: searchQuery, source: 'youtube_search', video_title: firstResult.title, video_url: firstResult.link }
                    };
                    await supabase.from('activity_logs').insert(activityLog);
                }

            } else {
                toast({ variant: 'destructive', title: "No YouTube Link", description: "Could not find a direct YouTube video link from search results." });
                setCurrentEmbedUrl(DEFAULT_SPOTIFY_EMBED_URL);
            }

        } catch (e: any) {
            toast({ variant: 'destructive', title: "Search Request Failed", description: e.message || "Could not connect to search service." });
            setCurrentEmbedUrl(DEFAULT_SPOTIFY_EMBED_URL);
        }
    });
  };

  return (
    <div className="space-y-10 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Music className="mr-4 h-10 w-10" /> Music Player
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Search for music to play via YouTube, or enjoy the default study playlist.
        </p>
      </header>

      <Card className="interactive-card shadow-xl w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-headline glow-text-accent flex items-center"><SearchIcon className="mr-2"/> Search for Music</CardTitle>
          <CardDescription>
            Enter a song or artist name. Results will attempt to play from YouTube.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
            <Input 
                type="text" 
                placeholder="E.g., Lo-fi study beats, Beethoven Symphony No. 5" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="input-glow h-11"
            />
            <Button onClick={handleSearch} disabled={isSearching} className="glow-button h-11">
                {isSearching ? <Loader2 className="animate-spin h-5 w-5"/> : <SearchIcon className="h-5 w-5"/>}
                Search
            </Button>
        </CardContent>
         <CardFooter>
            <Button onClick={() => { setCurrentEmbedUrl(DEFAULT_SPOTIFY_EMBED_URL); setCurrentSearchTerm(null); setSearchQuery(''); }} variant="outline" className="w-full glow-button">
                Back to Default Study Playlist
            </Button>
        </CardFooter>
      </Card>

      <Card className="interactive-card shadow-xl w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-headline glow-text-accent flex items-center">
            {currentEmbedUrl.includes('youtube') ? <Youtube className="mr-2 text-red-500"/> : <Music className="mr-2"/> }
            {currentEmbedUrl.includes('youtube') && currentSearchTerm ? `Now Playing: ${currentSearchTerm}` : 'Curated Study Playlist'}
          </CardTitle>
          <CardDescription>
            {currentEmbedUrl.includes('youtube') 
              ? "Playing from YouTube. Some videos may have embedding restrictions." 
              : "Enjoy this Spotify playlist. You might need to log in to Spotify within the player."}
          </CardDescription>
        </CardHeader>
        <CardContent className="aspect-video">
          <iframe
            key={currentEmbedUrl} // Important: Force re-render when src changes
            style={{ borderRadius: "12px" }}
            src={currentEmbedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen={false} 
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Music Player Embed"
          ></iframe>
        </CardContent>
      </Card>
      
      <Alert className="max-w-3xl mx-auto bg-primary/5 border-primary/20">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="text-primary font-semibold">Note on Music Player</AlertTitle>
        <AlertDescription>
            Searching will attempt to find and embed a YouTube video. Playback success depends on the video's embedding permissions.
            The "Connect to Spotify" button below is a placeholder for future direct Spotify integration.
        </AlertDescription>
      </Alert>
       <Card className="interactive-card shadow-md w-full max-w-xl mx-auto mt-6">
        <CardHeader>
          <CardTitle className="text-xl font-headline glow-text-secondary">Full Spotify Experience (Future)</CardTitle>
           <CardDescription>
            A deeper integration is planned.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <Button onClick={handleConnectSpotify} className="glow-button text-lg py-3 mb-4">
                <Radio className="mr-2"/> Connect to Spotify (Conceptual)
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
