'use client';

import { useState, useRef, useEffect } from "react";

export default function MusicPlayer() {
  const [playerVisible, setPlayerVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio(tracks[currentTrack].src);
      
      // Set up event listeners
      audioRef.current.addEventListener('loadedmetadata', () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
        }
      });
      
      audioRef.current.addEventListener('ended', handleNext);
    } else {
      // Update the source if track changes
      audioRef.current.src = tracks[currentTrack].src;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play();
      }
    }
    
    return () => {
      // Clean up
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', handleNext);
      }
    };
  }, [currentTrack, isPlaying]);
  
  // Format time in MM:SS
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Update progress bar
  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };
  
  // Play/pause toggle
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      audioRef.current.play();
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
      
      <div className="dots-pattern"></div>
    </div>
  );
} 