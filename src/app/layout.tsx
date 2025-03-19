import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Dancing_Script } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Vibe Code Buddy - Code Structure Tool",
  description: "A tool for organizing and documenting code structure",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${dancingScript.variable} antialiased`}
      >
        <header className="fixed top-0 w-full z-10 backdrop-blur-sm">
          <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between border-b-2 border-poolpink content-overlay">
            <Link href="/" className="pixel-heading text-pooldark dark:text-poolbeige">
              VIBE CODE BUDDY
            </Link>
            <nav>
              <ul className="flex gap-4">
                <li>
                  <Link href="/" className="hover:text-poolteal transition-colors pixel-heading text-sm">HOME</Link>
                </li>
                <li>
                  <Link href="/copier" className="hover:text-poolteal transition-colors pixel-heading text-sm">FILE COPIER</Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <div className="pt-16">
          {children}
        </div>
      </body>
    </html>
  );
}
