import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center noise-texture crt-overlay">
      <div className="max-w-3xl w-full flex flex-col gap-8 items-center">
        <div className="text-center retro-frame relative">
          <h1 className="vapor-text text-5xl font-bold mb-2">Vibe Code Buddy</h1>
          <p className="retro-pixel uppercase tracking-widest mb-1 text-pooldark dark:text-poolbeige">PFM LEISURE ENHANCER</p>
          <span className="version-tag">v2.01</span>
          <div className="retro-lines">
            <p className="text-xl text-pooldark dark:text-poolbeige mb-8">A modern code structure visualization tool</p>
          </div>
        </div>

        <div className="p-6 border-2 border-poolpink-light rounded-xl w-full content-overlay">
          <h2 className="pixel-heading text-pooldark dark:text-poolbeige mb-4">ABOUT VIBE CODE BUDDY</h2>
          <p className="text-pooldark dark:text-poolbeige mb-4">
            Vibe Code Buddy is a modern, web-based tool designed to help you organize and document your code structure.
            With features like drag-and-drop file handling and markdown generation, Vibe Code Buddy makes documentation simple and intuitive.
          </p>
          <p className="text-pooldark dark:text-poolbeige text-sm italic mb-6">
            Built with Next.js and retrowave aesthetics for your coding pleasure.
          </p>
          
          <div className="flex justify-center">
            <Link 
              href="/copier" 
              className="bg-poolteal text-white py-2 px-6 rounded-md hover:bg-poolteal/80 transition-colors vapor-button"
            >
              Try it Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
