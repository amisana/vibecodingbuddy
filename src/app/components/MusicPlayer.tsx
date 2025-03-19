'use client';

import { useState, useRef, useEffect } from "react";

export default function MusicPlayer() {
  const [playerVisible, setPlayerVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [useEmbedded, setUseEmbedded] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const embeddedAudioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const tracks = [
    {
      title: "Melacholy High v1",
      artist: "Vibe Code FM",
      src: "/vibecodefm/melacholy_high_v1.mp3"
    },
    {
      title: "Melacholy High v2",
      artist: "Vibe Code FM",
      src: "/vibecodefm/melacholy_high_v2.mp3"
    }
  ];
  
  useEffect(() => {
    console.log("Trying to load audio tracks from:", tracks[currentTrack].src);
    
    // Try to use embedded audio element as fallback
    const tryEmbeddedAudio = () => {
      setUseEmbedded(true);
      setErrorMsg("Using embedded player");
    };
    
    // Create audio element if it doesn't exist
    if (!audioRef.current && !useEmbedded) {
      try {
        audioRef.current = new Audio(tracks[currentTrack].src);
        
        // Set up event listeners
        audioRef.current.addEventListener('loadedmetadata', () => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
            setErrorMsg(null);
            console.log("Audio metadata loaded successfully");
          }
        });
        
        audioRef.current.addEventListener('error', (e) => {
          console.error("Audio error:", e);
          setErrorMsg("Trying embedded player...");
          tryEmbeddedAudio();
        });
        
        audioRef.current.addEventListener('ended', handleNext);
      } catch (err) {
        console.error("Error creating audio element:", err);
        tryEmbeddedAudio();
      }
    } else if (audioRef.current && !useEmbedded) {
      try {
        // Update the source if track changes
        audioRef.current.src = tracks[currentTrack].src;
        audioRef.current.load();
        if (isPlaying) {
          audioRef.current.play().catch(err => {
            console.error("Error playing audio:", err);
            setIsPlaying(false);
            tryEmbeddedAudio();
          });
        }
      } catch (err) {
        console.error("Error updating audio source:", err);
        tryEmbeddedAudio();
      }
    }
    
    // If using embedded player, update the source
    if (useEmbedded && embeddedAudioRef.current) {
      embeddedAudioRef.current.src = tracks[currentTrack].src;
      if (isPlaying) {
        embeddedAudioRef.current.play().catch(err => {
          console.error("Error playing embedded audio:", err);
          setIsPlaying(false);
          setErrorMsg("Audio playback failed");
        });
      }
    }
    
    return () => {
      // Clean up
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioRef.current && !useEmbedded) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', handleNext);
        audioRef.current.removeEventListener('error', () => {});
      }
    };
  }, [currentTrack, isPlaying, useEmbedded]);
  
  // Update time from embedded player
  useEffect(() => {
    if (useEmbedded && embeddedAudioRef.current) {
      const updateTime = () => {
        setCurrentTime(embeddedAudioRef.current?.currentTime || 0);
        setDuration(embeddedAudioRef.current?.duration || 0);
      };
      
      const timeUpdateInterval = setInterval(updateTime, 1000);
      
      return () => {
        clearInterval(timeUpdateInterval);
      };
    }
  }, [useEmbedded]);
  
  // Format time in MM:SS
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Update progress bar
  const updateProgress = () => {
    if (audioRef.current && !useEmbedded) {
      setCurrentTime(audioRef.current.currentTime);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };
  
  // Play/pause toggle
  const togglePlay = () => {
    if (useEmbedded) {
      if (embeddedAudioRef.current) {
        if (isPlaying) {
          embeddedAudioRef.current.pause();
        } else {
          embeddedAudioRef.current.play().catch(err => {
            console.error("Error playing embedded audio:", err);
            setErrorMsg("Couldn't play audio file");
          });
        }
        setIsPlaying(!isPlaying);
      }
      return;
    }
    
    if (!audioRef.current) {
      console.error("Audio element not initialized");
      setErrorMsg("Audio player not ready");
      return;
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      audioRef.current.play().catch(err => {
        console.error("Error playing audio:", err);
        setErrorMsg("Couldn't play audio file");
      });
      animationRef.current = requestAnimationFrame(updateProgress);
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Previous track
  const handlePrev = () => {
    if (currentTrack === 0) {
      setCurrentTrack(tracks.length - 1);
    } else {
      setCurrentTrack(currentTrack - 1);
    }
  };
  
  // Next track
  const handleNext = () => {
    const nextTrack = (currentTrack + 1) % tracks.length;
    setCurrentTrack(nextTrack);
  };
  
  // Handle embedded audio end
  const handleEmbeddedEnd = () => {
    handleNext();
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
        <div>Vibe Code FM (Default)</div>
        <div>▼</div>
      </div>
      
      {errorMsg && <div className="music-player-error">{errorMsg}</div>}
      
      <div className="music-player-time">{formatTime(currentTime)} / {formatTime(duration)}</div>
      <div className="music-player-track">{tracks[currentTrack].title}</div>
      <div className="music-player-artist">{tracks[currentTrack].artist}</div>
      
      <div className="music-player-controls">
        <button className="music-player-button" onClick={handlePrev}>◂◂</button>
        <button className="music-player-button" onClick={togglePlay}>
          {isPlaying ? '❚❚' : '▶'}
        </button>
        <button className="music-player-button" onClick={handleNext}>▸▸</button>
      </div>
      
      {useEmbedded && (
        <audio
          ref={embeddedAudioRef}
          src={tracks[currentTrack].src}
          className="hidden"
          onEnded={handleEmbeddedEnd}
          onError={() => setErrorMsg("Audio file not found")}
        />
      )}
      
      <div className="dots-pattern"></div>
    </div>
  );
} 