'use client';

import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

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
}

const defaultTrackInfo: Track = {
  title: "Loading...",
  artist: "",
  duration: "00:00"
};

const MusicPlayerContext = createContext<MusicPlayerContextType>({
  isPlaying: false,
  currentTrack: 0,
  currentTime: 0,
  currentTrackInfo: defaultTrackInfo,
  togglePlay: () => {},
  handlePrev: () => {},
  handleNext: () => {},
  playerVisible: true,
  setPlayerVisible: () => {}
});

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const [playerVisible, setPlayerVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackInfo, setCurrentTrackInfo] = useState<Track>(defaultTrackInfo);
  
  // Reference to the iframe for SoundCloud
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  
  // SoundCloud Widget API
  const [widget, setWidget] = useState<any>(null);
  
  // Playlist URL
  const playlistUrl = "https://soundcloud.com/cameron-kiani/sets/majesticcasual";
  
  // Load SoundCloud Widget API
  useEffect(() => {
    let scriptElement: HTMLScriptElement | null = null;
    
    // Check if the script is already loaded
    const existingScript = document.querySelector('script[src="https://w.soundcloud.com/player/api.js"]');
    
    if (!existingScript) {
      // Create script element
      scriptElement = document.createElement('script');
      scriptElement.src = 'https://w.soundcloud.com/player/api.js';
      scriptElement.async = true;
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
      document.body.appendChild(iframe);
      iframeRef.current = iframe;
    }
    
    const initializeWidget = () => {
      if (iframeRef.current && window.SC) {
        const widgetInstance = window.SC.Widget(iframeRef.current);
        setWidget(widgetInstance);
        
        // Setup event listeners
        widgetInstance.bind(window.SC.Widget.Events.READY, () => {
          console.log('SoundCloud widget ready');
          
          // Get tracks from playlist
          widgetInstance.getSounds((playlist: any) => {
            const trackList = playlist.map((sound: any) => {
              // Format duration from milliseconds to MM:SS
              const minutes = Math.floor(sound.duration / 60000);
              const seconds = Math.floor((sound.duration % 60000) / 1000);
              const formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
              
              return {
                title: sound.title,
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
      // We don't remove the iframe or script since we want the player to persist
    };
  }, []);
  
  // Update current track information
  const updateCurrentTrackInfo = (sound: any) => {
    const minutes = Math.floor(sound.duration / 60000);
    const seconds = Math.floor((sound.duration % 60000) / 1000);
    const formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    setCurrentTrackInfo({
      title: sound.title,
      artist: sound.user?.username || 'Unknown Artist',
      duration: formattedDuration
    });
  };
  
  // Toggle play/pause
  const togglePlay = () => {
    if (widget) {
      if (isPlaying) {
        widget.pause();
      } else {
        widget.play();
      }
    }
  };
  
  // Previous track
  const handlePrev = () => {
    if (widget) {
      widget.prev();
      setCurrentTime(0);
    }
  };
  
  // Next track
  const handleNext = () => {
    if (widget) {
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
        setPlayerVisible
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  return useContext(MusicPlayerContext);
} 