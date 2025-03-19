'use client';

import { useMusicPlayer } from "./MusicPlayerContext";

export default function MusicPlayer() {
  const {
    isPlaying,
    currentTime,
    currentTrackInfo,
    togglePlay,
    handlePrev,
    handleNext,
    playerVisible,
    setPlayerVisible,
    apiLoaded
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
        <div>{apiLoaded ? "Majestic Casual" : "Offline Mode"}</div>
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
      
      {!apiLoaded && (
        <div className="text-xs mt-2 opacity-70 text-pooldark dark:text-poolbeige">
          Running in offline mode
        </div>
      )}
      
      <div className="dots-pattern"></div>
    </div>
  );
} 