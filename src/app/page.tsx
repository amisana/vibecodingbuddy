'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const [playerVisible, setPlayerVisible] = useState(true);
  
  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center noise-texture crt-overlay relative">
      <div className="max-w-3xl w-full flex flex-col gap-8 items-center">
        <div className="text-center retro-frame relative">
          <h1 className="vapor-text text-5xl font-bold mb-2">Vibe Code Buddy</h1>
          <p className="retro-pixel uppercase tracking-widest mb-1 text-pooldark dark:text-poolbeige">SOFTWARE COMPOSER ENHANCER</p>
          <span className="version-tag">v2.01</span>
          <div className="retro-lines">
            <p className="text-xl text-pooldark dark:text-poolbeige mb-8">A modern code structure visualization tool</p>
          </div>
        </div>

        <div className="p-6 border-2 border-poolpink-light rounded-xl w-full content-overlay">
          <h2 className="pixel-heading text-pooldark dark:text-poolbeige mb-4">ABOUT VIBE CODE BUDDY</h2>
          <p className="pixel-body text-pooldark dark:text-poolbeige mb-4">
            Vibe Code Buddy is a modern, web-based tool designed to help you organize and document your code structure.
            With features like drag-and-drop file handling and markdown generation, Vibe Code Buddy makes documentation simple and intuitive.
          </p>
          <p className="pixel-body text-pooldark dark:text-poolbeige text-sm italic">
            Built with Next.js and retrowave aesthetics for your coding pleasure.
          </p>
        </div>
      </div>
      
      {/* Floating action button */}
      <Link 
        href="/copier" 
        className="float-button"
      >
        <span>Try it now</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </Link>
      
      {/* Music Player */}
      {playerVisible && (
        <div className="music-player">
          <div className="music-player-header">
            <div className="music-player-title">VIBE CODE FM</div>
            <button className="music-player-close" onClick={() => setPlayerVisible(false)}>×</button>
          </div>
          
          <div className="music-player-visualization"></div>
          
          <div className="music-player-channel">
            <div>Vibe Code FM (Default)</div>
            <div>▼</div>
          </div>
          
          <div className="music-player-time">... / 04:52</div>
          <div className="music-player-track">Com Truise - Ultrafiche</div>
          <div className="music-player-artist">Iteration</div>
          
          <div className="music-player-controls">
            <button className="music-player-button">◂◂</button>
            <button className="music-player-button">▶</button>
            <button className="music-player-button">▸▸</button>
          </div>
          
          <div className="dots-pattern"></div>
        </div>
      )}
    </div>
  );
}
