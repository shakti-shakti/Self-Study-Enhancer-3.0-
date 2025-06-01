
// src/app/dashboard/music/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Music, Info, Radio, Search as SearchIcon, Loader2, Youtube, Disc } from 'lucide-react'; // Added Disc for Spotify icon
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import type { TablesInsert } from '@/lib/database.types';
import { useEffect, useState, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { googleSearch, type GoogleSearchOutput } from '@/ai/flows/google-search-flow';

const DEFAULT_SPOTIFY_PLAYLIST_EMBED_URL = "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M"; // Default Spotify Chill Vibes
const DEFAULT_YOUTUBE_VIDEO_EMBED_URL = "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1"; // Lofi Girl default

type PlayerMode = 'youtube_general' | 'spotify_simulated';

export default function MusicPlayerPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string|null>(null);
  const { toast } = useToast();
  
  const [isSearching, startSearchTransition] = useTransition();
  const [playerMode, setPlayerMode] = useState<PlayerMode>('youtube_general');
  
  // State for general YouTube search
  const [youtubeSearchQuery, setYoutubeSearchQuery] = useState('');
  
  // State for "Spotify" search (which actually searches YouTube for Spotify content)
  const [spotifySearchQuery, setSpotifySearchQuery] = useState('');
  
  const [currentEmbedUrl, setCurrentEmbedUrl] = useState(DEFAULT_YOUTUBE_VIDEO_EMBED_URL);
  const [currentPlayerTitle, setCurrentPlayerTitle] = useState("Lofi Girl Radio - Beats to Relax/Study to");
  const [currentSearchTermDisplay, setCurrentSearchTermDisplay] = useState<string | null>(null);


  useEffect(() => {
     const getInitialUser = async () => {
        const {data: {user}} = await supabase.auth.getUser();
        setUserId(user?.id || null);
    };
    getInitialUser();
  }, [supabase]);

  useEffect(() => {
    if (userId && !currentSearchTermDisplay) { 
      const logActivity = async () => {
        const activityLog: TablesInsert<'activity_logs'> = {
          user_id: userId,
          activity_type: 'music_player_visited',
          description: `Visited the Music Player page (defaulting to YouTube).`,
          details: { page: '/dashboard/music', initial_view: 'youtube_lofi' }
        };
        await supabase.from('activity_logs').insert(activityLog);
      };
      logActivity();
    }
  }, [userId, supabase, currentSearchTermDisplay]);
  
  const handleToggleSpotifyMode = () => {
    if (playerMode === 'spotify_simulated') {
      setPlayerMode('youtube_general');
      setCurrentEmbedUrl(DEFAULT_YOUTUBE_VIDEO_EMBED_URL);
      setCurrentPlayerTitle("Lofi Girl Radio - Beats to Relax/Study to");
      setSpotifySearchQuery('');
      setCurrentSearchTermDisplay(null);
      toast({ title: "Switched to General YouTube Mode", description: "Search for any YouTube video." });
    } else {
      setPlayerMode('spotify_simulated');
      setCurrentEmbedUrl(DEFAULT_SPOTIFY_PLAYLIST_EMBED_URL);
      setCurrentPlayerTitle("Curated Spotify Study Playlist");
      setYoutubeSearchQuery('');
      setCurrentSearchTermDisplay(null);
      toast({ title: "Switched to Spotify Mode (Simulated)", description: "Player showing default Spotify playlist. Search will look for Spotify content on YouTube." });
    }
  };

  const performSearch = async (query: string, source: 'youtube' | 'spotify_via_youtube') => {
    if (!query.trim()) {
        toast({ title: "Empty Search", description: "Please enter a song or artist name."});
        return;
    }
    setCurrentSearchTermDisplay(query);
    startSearchTransition(async () => {
        const searchQueryForGoogle = source === 'spotify_via_youtube' 
            ? `${query} official audio spotify youtube` 
            : `${query} youtube`;
        try {
            const result: GoogleSearchOutput = await googleSearch({ query: searchQueryForGoogle, numResults: 1 });
            if (result.error || !result.items || result.items.length === 0) {
                toast({ variant: 'destructive', title: "Search Error", description: result.error || "No relevant YouTube video found." });
                // Revert to default for the current mode if search fails
                setCurrentEmbedUrl(playerMode === 'spotify_simulated' ? DEFAULT_SPOTIFY_PLAYLIST_EMBED_URL : DEFAULT_YOUTUBE_VIDEO_EMBED_URL);
                setCurrentPlayerTitle(playerMode === 'spotify_simulated' ? "Curated Spotify Study Playlist" : "Lofi Girl Radio");
                return;
            }
            
            const firstResult = result.items[0];
            if (firstResult.link && firstResult.link.includes("youtube.com/watch?v=")) {
                const videoId = firstResult.link.split("watch?v=")[1].split('&')[0];
                const youtubeEmbedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
                setCurrentEmbedUrl(youtubeEmbedUrl);
                setCurrentPlayerTitle(firstResult.title || query);
                toast({ title: "Now Playing (Attempting)", description: `Trying to play: ${firstResult.title || query}`});

                 if (userId) {
                    const activityLog: TablesInsert<'activity_logs'> = {
                        user_id: userId,
                        activity_type: source === 'spotify_via_youtube' ? 'music_searched_spotify' : 'music_searched_youtube',
                        description: `Searched for: "${query}". Playing: ${firstResult.title}`,
                        details: { query: query, source: source, video_title: firstResult.title, video_url: firstResult.link }
                    };
                    await supabase.from('activity_logs').insert(activityLog);
                }
            } else {
                toast({ variant: 'destructive', title: "No YouTube Link Found", description: "Could not find a direct YouTube video link." });
                setCurrentEmbedUrl(playerMode === 'spotify_simulated' ? DEFAULT_SPOTIFY_PLAYLIST_EMBED_URL : DEFAULT_YOUTUBE_VIDEO_EMBED_URL);
                setCurrentPlayerTitle(playerMode === 'spotify_simulated' ? "Curated Spotify Study Playlist" : "Lofi Girl Radio");
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Search Request Failed", description: e.message || "Could not connect to search service." });
            setCurrentEmbedUrl(playerMode === 'spotify_simulated' ? DEFAULT_SPOTIFY_PLAYLIST_EMBED_URL : DEFAULT_YOUTUBE_VIDEO_EMBED_URL);
            setCurrentPlayerTitle(playerMode === 'spotify_simulated' ? "Curated Spotify Study Playlist" : "Lofi Girl Radio");
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
          {playerMode === 'spotify_simulated' 
            ? "Spotify Mode (Simulated): Search for Spotify tracks (plays via YouTube) or enjoy the default playlist."
            : "YouTube Mode: Search for any video or enjoy the default Lofi stream."
          }
        </p>
      </header>

      <div className="text-center">
        <Button onClick={handleToggleSpotifyMode} variant="outline" className="glow-button text-lg py-3">
          {playerMode === 'spotify_simulated' ? 
            <><Youtube className="mr-2"/> Switch to YouTube Mode</> :
            <><Disc className="mr-2 text-green-500"/> Connect to Spotify (Simulated)</>
          }
        </Button>
      </div>

      {playerMode === 'youtube_general' && (
        <Card className="interactive-card shadow-xl w-full max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-headline glow-text-accent flex items-center"><Youtube className="mr-2 text-red-500"/> Search YouTube</CardTitle>
            <CardDescription>Enter a song, artist, or any video name.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
              <Input 
                  type="text" 
                  placeholder="E.g., Study with me live, Physics lectures" 
                  value={youtubeSearchQuery}
                  onChange={(e) => setYoutubeSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && performSearch(youtubeSearchQuery, 'youtube')}
                  className="input-glow h-11"
              />
              <Button onClick={() => performSearch(youtubeSearchQuery, 'youtube')} disabled={isSearching} className="glow-button h-11">
                  {isSearching ? <Loader2 className="animate-spin h-5 w-5"/> : <SearchIcon className="h-5 w-5"/>}
                  Search
              </Button>
          </CardContent>
        </Card>
      )}

      {playerMode === 'spotify_simulated' && (
        <Card className="interactive-card shadow-xl w-full max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-headline glow-text-green-400 flex items-center"><Disc className="mr-2 text-green-500"/> Search Spotify (via YouTube)</CardTitle>
            <CardDescription>Enter song or artist. Plays best available YouTube version.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
              <Input 
                  type="text" 
                  placeholder="E.g., Your favorite study song, Artist name" 
                  value={spotifySearchQuery}
                  onChange={(e) => setSpotifySearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && performSearch(spotifySearchQuery, 'spotify_via_youtube')}
                  className="input-glow h-11"
              />
              <Button onClick={() => performSearch(spotifySearchQuery, 'spotify_via_youtube')} disabled={isSearching} className="glow-button h-11">
                  {isSearching ? <Loader2 className="animate-spin h-5 w-5"/> : <SearchIcon className="h-5 w-5"/>}
                  Search
              </Button>
          </CardContent>
        </Card>
      )}

      <Card className="interactive-card shadow-xl w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-headline glow-text-accent flex items-center">
            {currentEmbedUrl.includes('youtube') ? <Youtube className="mr-2 text-red-500"/> : <Disc className="mr-2 text-green-500"/> }
            {currentSearchTermDisplay ? `Playing: ${currentPlayerTitle}` : currentPlayerTitle}
          </CardTitle>
          <CardDescription>
            {currentEmbedUrl.includes('youtube') 
              ? "Playing from YouTube. Some videos may have embedding restrictions or ads." 
              : "Enjoy this Spotify playlist. You might need to log in to Spotify within the player for full functionality."}
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
            allowFullScreen={false} 
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Music Player Embed"
          ></iframe>
        </CardContent>
        <CardFooter>
            <Button 
                onClick={() => { 
                    setCurrentEmbedUrl(playerMode === 'spotify_simulated' ? DEFAULT_SPOTIFY_PLAYLIST_EMBED_URL : DEFAULT_YOUTUBE_VIDEO_EMBED_URL); 
                    setCurrentPlayerTitle(playerMode === 'spotify_simulated' ? "Curated Spotify Study Playlist" : "Lofi Girl Radio");
                    setCurrentSearchTermDisplay(null); 
                    setYoutubeSearchQuery(''); 
                    setSpotifySearchQuery(''); 
                }} 
                variant="outline" 
                className="w-full glow-button"
            >
                Back to Default {playerMode === 'spotify_simulated' ? 'Spotify Playlist' : 'Lofi Stream'}
            </Button>
        </CardFooter>
      </Card>
      
      <Alert className="max-w-3xl mx-auto bg-primary/5 border-primary/20">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="text-primary font-semibold">Note on Music Player</AlertTitle>
        <AlertDescription>
            Searching will attempt to find and embed a YouTube video. Playback success depends on the video's embedding permissions and ads. 
            "Spotify Mode" simulates finding Spotify content on YouTube. Full Spotify integration is a future goal.
            Audio playback continues as long as this browser tab is active. True background playback (app closed) is not supported by standard web technology.
        </AlertDescription>
      </Alert>
    </div>
  );
}

    