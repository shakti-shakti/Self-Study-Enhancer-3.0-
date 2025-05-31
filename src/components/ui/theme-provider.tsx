// src/components/ui/theme-provider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

type Theme = 'light' | 'dark';

type ThemeProviderProps = {
  children: React.ReactNode;
  initialTheme?: Theme; // Optional: can be passed from server layout
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isThemeLoading: boolean;
};

const ThemeContext = createContext<ThemeProviderState | undefined>(undefined);

export default function ThemeProvider({
  children,
  initialTheme: serverInitialTheme, // Theme potentially passed from server
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme') as Theme | null;
      if (storedTheme) return storedTheme;
    }
    return serverInitialTheme || 'dark'; // Use server-passed theme or default
  });
  const [isThemeLoading, setIsThemeLoading] = useState(true);
  const supabase = createClient();

  const applyTheme = useCallback((selectedTheme: Theme) => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(selectedTheme);
    document.documentElement.style.colorScheme = selectedTheme;
    localStorage.setItem('theme', selectedTheme);
    setThemeState(selectedTheme);
  }, []);

  // Effect for initial theme load and auth changes
  useEffect(() => {
    const getInitialTheme = async () => {
      setIsThemeLoading(true);
      const storedTheme = localStorage.getItem('theme') as Theme | null;

      if (storedTheme) {
        applyTheme(storedTheme);
        setIsThemeLoading(false);
        return;
      }

      // If no theme in localStorage, try fetching from user profile if available
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('theme')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.theme) {
          applyTheme(profile.theme as Theme);
        } else {
          applyTheme(serverInitialTheme || 'dark'); // Fallback to server initial or 'dark'
        }
      } else {
         applyTheme(serverInitialTheme || 'dark'); // No session, use server initial or 'dark'
      }
      setIsThemeLoading(false);
    };

    getInitialTheme();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Re-fetch theme if user logs in/out, as preferences might change
        // or localStorage might be stale for a newly logged-in user
        // This also helps if the initialTheme prop was for a logged-out state
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('theme')
            .eq('id', session.user.id)
            .single();
          if (profile?.theme) {
            applyTheme(profile.theme as Theme);
          }
        } else {
          // User logged out, potentially revert to a default or localStorage
           const storedTheme = localStorage.getItem('theme') as Theme | null;
           applyTheme(storedTheme || serverInitialTheme || 'dark');
        }
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, applyTheme, serverInitialTheme]);


  const setTheme = (newTheme: Theme) => {
    applyTheme(newTheme);
  };

  // To prevent FOUC, we can initially hide the body until theme is determined
  // This is a common pattern but can have slight perceived performance impact
  // if not handled carefully with loading states.
  // For now, we rely on quick client-side update.
  // if (isThemeLoading && typeof window !== 'undefined') {
  //    return null; // Or a loading spinner that fills the screen
  // }


  return (
    <ThemeContext.Provider value={{ theme, setTheme, isThemeLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

    