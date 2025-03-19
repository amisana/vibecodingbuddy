'use client';

import { useMusicPlayer } from "./MusicPlayerContext";

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
  const {
    isPlaying,
    currentTime,
    currentTrackInfo,
    togglePlay,
    handlePrev,
    handleNext,
    playerVisible,
    setPlayerVisible
  } = useMusicPlayer();
  
  if (!playerVisible) {
    return null;
  }
  
  // Format time in MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
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
      
      <div className="dots-pattern"></div>
    </div>
  );
} 