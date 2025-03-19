'use client';

import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

// Add SoundCloud Widget API types
declare global {
  interface Window {
    SC: {
      Widget: {
        (iframe: HTMLIFrameElement): any;
        Events: {
          READY: string;
          PLAY_PROGRESS: string;
          FINISH: string;
          PLAY: string;
          PAUSE: string;
          ERROR: string;
        };
      };
    };
  }
}

interface Track {
  title: string;
  artist: string;
  duration: string;
}

interface MusicPlayerContextType {
  isPlaying: boolean;
  currentTrack: number;
  currentTime: number;
  currentTrackInfo: Track;
  togglePlay: () => void;
  handlePrev: () => void;
  handleNext: () => void;
  playerVisible: boolean;
  setPlayerVisible: (visible: boolean) => void;
  isMinimized: boolean;
  toggleMinimized: () => void;
  apiLoaded: boolean;
}

const defaultTrackInfo: Track = {
  title: "Loading...",
  artist: "",
  duration: "00:00"
};

// Fallback tracks in case SoundCloud API fails
const fallbackTracks: Track[] = [
  {
    title: "Majestic Casual Mix",
    artist: "Various Artists",
    duration: "04:30"
  },
  {
    title: "Poolside Vibes",
    artist: "Vibe Code FM",
    duration: "03:45"
  }
];

const MusicPlayerContext = createContext<MusicPlayerContextType>({
  isPlaying: false,
  currentTrack: 0,
  currentTime: 0,
  currentTrackInfo: defaultTrackInfo,
  togglePlay: () => {},
  handlePrev: () => {},
  handleNext: () => {},
  playerVisible: true,
  setPlayerVisible: () => {},
  isMinimized: false,
  toggleMinimized: () => {},
  apiLoaded: false
});

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const [playerVisible, setPlayerVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackInfo, setCurrentTrackInfo] = useState<Track>(defaultTrackInfo);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Reference to the iframe for SoundCloud
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  
  // SoundCloud Widget API
  const [widget, setWidget] = useState<any>(null);
  
  // Playlist URL
  const playlistUrl = "https://soundcloud.com/cameron-kiani/sets/majesticcasual";

  // Timer for fake progress when using fallback
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load saved state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPlayerState = localStorage.getItem('musicPlayerState');
      if (savedPlayerState) {
        try {
          const state = JSON.parse(savedPlayerState);
          if (state.playerVisible !== undefined) setPlayerVisible(state.playerVisible);
          if (state.isMinimized !== undefined) setIsMinimized(state.isMinimized);
        } catch (e) {
          console.error('Error loading saved music player state', e);
        }
      }
    }
  }, []);

  // Save state changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('musicPlayerState', JSON.stringify({
          playerVisible,
          isMinimized
        }));
      } catch (e) {
        console.error('Error saving music player state', e);
      }
    }
  }, [playerVisible, isMinimized]);
  
  // Toggle minimized state
  const toggleMinimized = () => {
    setIsMinimized(prev => !prev);
  };
  
  // Load SoundCloud Widget API
  useEffect(() => {
    let scriptElement: HTMLScriptElement | null = null;
    let loadTimeoutId: NodeJS.Timeout;
    
    const initializeFallback = () => {
      console.log("Falling back to mock player");
      setApiError(true);
      setTracks(fallbackTracks);
      setCurrentTrackInfo(fallbackTracks[0]);
    };
    
    // Set a timeout for API loading
    loadTimeoutId = setTimeout(() => {
      if (!apiLoaded) {
        initializeFallback();
      }
    }, 5000);
    
    // Check if the script is already loaded
    const existingScript = document.querySelector('script[src="https://w.soundcloud.com/player/api.js"]');
    
    try {
      if (!existingScript) {
        // Create script element
        scriptElement = document.createElement('script');
        scriptElement.src = 'https://w.soundcloud.com/player/api.js';
        scriptElement.async = true;
        
        // Add error handling for script loading
        scriptElement.onerror = () => {
          console.error("Failed to load SoundCloud API");
          initializeFallback();
          clearTimeout(loadTimeoutId);
        };
        
        document.body.appendChild(scriptElement);
      }
      
      // Create iframe if it doesn't exist
      if (!iframeRef.current) {
        const iframe = document.createElement('iframe');
        iframe.width = "100%";
        iframe.height = "0";
        iframe.scrolling = "no";
        iframe.frameBorder = "no";
        iframe.allow = "autoplay";
        iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(playlistUrl)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`;
        iframe.className = "hidden";
        iframe.style.display = "none";
        
        // Add error handling for iframe loading
        iframe.onerror = () => {
          console.error("Failed to load SoundCloud iframe");
          initializeFallback();
          clearTimeout(loadTimeoutId);
        };
        
        document.body.appendChild(iframe);
        iframeRef.current = iframe;
      }
    } catch (error) {
      console.error("Error setting up SoundCloud player:", error);
      initializeFallback();
      clearTimeout(loadTimeoutId);
    }
    
    const initializeWidget = () => {
      if (iframeRef.current && window.SC) {
        try {
          const widgetInstance = window.SC.Widget(iframeRef.current);
          setWidget(widgetInstance);
          
          // Setup event listeners
          widgetInstance.bind(window.SC.Widget.Events.READY, () => {
            console.log('SoundCloud widget ready');
            setApiLoaded(true);
            clearTimeout(loadTimeoutId);
            
            // Get tracks from playlist
            widgetInstance.getSounds((playlist: any) => {
              try {
                if (!playlist || playlist.length === 0) {
                  throw new Error("Empty playlist returned");
                }
                
                const trackList = playlist.map((sound: any) => {
                  // Format duration from milliseconds to MM:SS
                  const minutes = Math.floor(sound.duration / 60000);
                  const seconds = Math.floor((sound.duration % 60000) / 1000);
                  const formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                  
                  return {
                    title: sound.title || "Unknown Track",
                    artist: sound.user?.username || 'Unknown Artist',
                    duration: formattedDuration
                  };
                });
                
                setTracks(trackList);
                
                // Get current track info
                widgetInstance.getCurrentSound((sound: any) => {
                  if (sound) {
                    updateCurrentTrackInfo(sound);
                  }
                });
              } catch (error) {
                console.error("Error processing playlist:", error);
                initializeFallback();
              }
            });
            
            // Track playback progress
            widgetInstance.bind(window.SC.Widget.Events.PLAY_PROGRESS, (e: any) => {
              const seconds = Math.floor(e.currentPosition / 1000);
              setCurrentTime(seconds);
            });
            
            // Listen for track finish
            widgetInstance.bind(window.SC.Widget.Events.FINISH, () => {
              handleNext();
            });
            
            // Listen for track changes
            widgetInstance.bind(window.SC.Widget.Events.PLAY, () => {
              setIsPlaying(true);
              // Get current track info
              widgetInstance.getCurrentSound((sound: any) => {
                if (sound) {
                  updateCurrentTrackInfo(sound);
                }
              });
              
              // Get current track index
              widgetInstance.getCurrentSoundIndex((index: number) => {
                setCurrentTrack(index);
              });
            });
            
            widgetInstance.bind(window.SC.Widget.Events.PAUSE, () => {
              setIsPlaying(false);
            });
          });
          
          // Handle widget error
          widgetInstance.bind(window.SC.Widget.Events.ERROR, () => {
            console.error("SoundCloud widget error");
            initializeFallback();
          });
        } catch (error) {
          console.error("Error initializing SoundCloud widget:", error);
          initializeFallback();
          clearTimeout(loadTimeoutId);
        }
      }
    };
    
    // Initialize widget once the script is loaded
    if (existingScript) {
      initializeWidget();
    } else if (scriptElement) {
      scriptElement.onload = initializeWidget;
    }
    
    // Cleanup function
    return () => {
      clearTimeout(loadTimeoutId);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Simulate playback when using fallback
  useEffect(() => {
    if (apiError && isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const duration = parseDuration(currentTrackInfo.duration);
          if (prev >= duration - 1) {
            handleNext();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (apiError && !isPlaying && timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [apiError, isPlaying, currentTrackInfo]);
  
  // Helper to parse duration string to seconds
  const parseDuration = (duration: string): number => {
    const [minutes, seconds] = duration.split(':').map(Number);
    return minutes * 60 + seconds;
  };
  
  // Update current track information
  const updateCurrentTrackInfo = (sound: any) => {
    const minutes = Math.floor(sound.duration / 60000);
    const seconds = Math.floor((sound.duration % 60000) / 1000);
    const formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    setCurrentTrackInfo({
      title: sound.title || "Unknown Track",
      artist: sound.user?.username || 'Unknown Artist',
      duration: formattedDuration
    });
  };
  
  // Toggle play/pause
  const togglePlay = () => {
    if (apiError) {
      // Handle fallback playback
      setIsPlaying(!isPlaying);
    } else if (widget) {
      if (isPlaying) {
        widget.pause();
      } else {
        widget.play();
      }
    }
  };
  
  // Previous track
  const handlePrev = () => {
    if (apiError) {
      // Handle fallback navigation
      setCurrentTime(0);
      setCurrentTrack(prev => {
        const newTrack = prev === 0 ? fallbackTracks.length - 1 : prev - 1;
        setCurrentTrackInfo(fallbackTracks[newTrack]);
        return newTrack;
      });
    } else if (widget) {
      widget.prev();
      setCurrentTime(0);
    }
  };
  
  // Next track
  const handleNext = () => {
    if (apiError) {
      // Handle fallback navigation
      setCurrentTime(0);
      setCurrentTrack(prev => {
        const newTrack = (prev + 1) % fallbackTracks.length;
        setCurrentTrackInfo(fallbackTracks[newTrack]);
        return newTrack;
      });
    } else if (widget) {
      widget.next();
      setCurrentTime(0);
    }
  };
  
  return (
    <MusicPlayerContext.Provider 
      value={{
        isPlaying,
        currentTrack,
        currentTime,
        currentTrackInfo,
        togglePlay,
        handlePrev,
        handleNext,
        playerVisible,
        setPlayerVisible,
        isMinimized,
        toggleMinimized,
        apiLoaded
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  return useContext(MusicPlayerContext);
} 