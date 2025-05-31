// src/app/dashboard/music/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import type { TablesInsert } from '@/lib/database.types';
import { useEffect, useState } from 'react';


// Fixed Spotify Playlist URL for embed
const SPOTIFY_EMBED_URL = "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M"; // Example: Spotify's "Chill Vibes" playlist

export default function MusicPlayerPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string|null>(null);

  useEffect(() => {
     const getInitialUser = async () => {
        const {data: {user}} = await supabase.auth.getUser();
        setUserId(user?.id || null);
    };
    getInitialUser();
  }, [supabase]);

  useEffect(() => {
    if (userId) {
      const logActivity = async () => {
        const activityLog: TablesInsert<'activity_logs'> = {
          user_id: userId,
          activity_type: 'music_player_visited',
          description: `Visited the Music Player page.`,
          details: { page: '/dashboard/music' }
        };
        await supabase.from('activity_logs').insert(activityLog);
      };
      logActivity();
    }
  }, [userId, supabase]);


  return (
    <div className="space-y-10 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Music className="mr-4 h-10 w-10" /> Music Player
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Tune into some music to help you focus or relax while you study.
        </p>
      </header>

      <Card className="interactive-card shadow-xl w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-headline glow-text-accent">Embedded Music Player</CardTitle>
          <CardDescription>
            Enjoy music directly within the app. You might need to log in to your music streaming service.
          </CardDescription>
        </CardHeader>
        <CardContent className="aspect-video">
          <iframe
            style={{ borderRadius: "12px" }}
            src={SPOTIFY_EMBED_URL}
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen={false} 
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Spotify Music Player Embed"
          ></iframe>
        </CardContent>
      </Card>
      
      <Alert className="max-w-3xl mx-auto bg-primary/5 border-primary/20">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="text-primary font-semibold">Note on Music Player</AlertTitle>
        <AlertDescription>
            This feature embeds a Spotify player. You may need a Spotify account and to log in within the iframe to access full functionality or your own playlists. The embedded playlist is a public example.
        </AlertDescription>
    </Alert>
    </div>
  );
}
