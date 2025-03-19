'use client';

import { useState, useRef, useEffect } from "react";

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
        };
      };
    };
  }
}

interface Track {
  title: string;
  artist: string;
  duration: string;
  url?: string;
}

export default function MusicPlayer() {
  const [playerVisible, setPlayerVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackInfo, setCurrentTrackInfo] = useState<Track>({
    title: "Loading...",
    artist: "",
    duration: "00:00"
  });
  
  // Reference to the iframe for SoundCloud
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  
  // SoundCloud Widget API
  const [widget, setWidget] = useState<any>(null);
  
  // Playlist URL
  const playlistUrl = "https://soundcloud.com/cameron-kiani/sets/majesticcasual";
  
  // Load SoundCloud Widget API
  useEffect(() => {
    // Create script element
    const script = document.createElement('script');
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.async = true;
    
    script.onload = () => {
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
    
    document.body.appendChild(script);
    
    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
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
  
  // Format time in MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
  
  if (!playerVisible) {
    return null;
  }
  
  return (
    <div className="music-player">
      <div className="music-player-header">
        <div className="music-player-title">VIBE CODE FM</div>
        <button className="music-player-close" onClick={() => setPlayerVisible(false)}>×</button>
      </div>
      
      <div className={`equalizer ${isPlaying ? 'playing' : ''}`}>
        {[...Array(24)].map((_, i) => (
          <div key={i} className="equalizer-bar"></div>
        ))}
      </div>
      
      <div className="music-player-channel">
        <div>Majestic Casual</div>
        <div>▼</div>
      </div>
      
      <div className="music-player-time">{formatTime(currentTime)} / {currentTrackInfo.duration}</div>
      <div className="music-player-track">{currentTrackInfo.title}</div>
      <div className="music-player-artist">{currentTrackInfo.artist}</div>
      
      <div className="music-player-controls">
        <button className="music-player-button" onClick={handlePrev}>◂◂</button>
        <button className="music-player-button" onClick={togglePlay}>
          {isPlaying ? '❚❚' : '▶'}
        </button>
        <button className="music-player-button" onClick={handleNext}>▸▸</button>
      </div>
      
      {/* Hidden SoundCloud iframe */}
      <iframe 
        ref={iframeRef}
        width="100%" 
        height="0" 
        scrolling="no" 
        frameBorder="no" 
        allow="autoplay" 
        src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(playlistUrl)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`}
        className="hidden"
      ></iframe>
      
      <div className="dots-pattern"></div>
    </div>
  );
} 