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
    isMinimized,
    toggleMinimized,
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
  
  // Minimized view
  if (isMinimized) {
    return (
      <div className="music-player-minimized">
        <div className="music-player-mini-controls">
          <button 
            className="music-player-mini-button" 
            onClick={togglePlay}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>
          <div className="music-player-mini-info retro-pixel">
            <div className="truncate">{currentTrackInfo.title}</div>
          </div>
          <button 
            className="music-player-mini-button" 
            onClick={toggleMinimized}
            title="Maximize"
          >
            □
          </button>
        </div>
      </div>
    );
  }
  
  // Full view
  return (
    <div className="music-player">
      <div className="music-player-header">
        <div className="music-player-title">VIBE CODE FM</div>
        <div className="music-player-buttons">
          <button 
            className="music-player-minimize" 
            onClick={toggleMinimized}
            title="Minimize"
          >
            _
          </button>
          <button 
            className="music-player-close" 
            onClick={() => setPlayerVisible(false)}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>
      
      <div className={`equalizer ${isPlaying ? 'playing' : ''}`}>
        {[...Array(24)].map((_, i) => (
          <div key={i} className="equalizer-bar"></div>
        ))}
      </div>
      
      <div className="music-player-channel">
        <div className="retro-pixel">{apiLoaded ? "Majestic Casual" : "Offline Mode"}</div>
        <div>▼</div>
      </div>
      
      <div className="music-player-time retro-pixel">{formatTime(currentTime)} / {currentTrackInfo.duration}</div>
      <div className="music-player-track retro-pixel">{currentTrackInfo.title}</div>
      <div className="music-player-artist retro-pixel">{currentTrackInfo.artist}</div>
      
      <div className="music-player-controls">
        <button className="music-player-button retro-pixel" onClick={handlePrev}>◂◂</button>
        <button className="music-player-button retro-pixel" onClick={togglePlay}>
          {isPlaying ? '❚❚' : '▶'}
        </button>
        <button className="music-player-button retro-pixel" onClick={handleNext}>▸▸</button>
      </div>
      
      {!apiLoaded && (
        <div className="text-xs mt-2 opacity-70 text-pooldark dark:text-poolbeige retro-pixel">
          Running in offline mode
        </div>
      )}
      
      <div className="dots-pattern"></div>
    </div>
  );
} 