import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "CopyCode - File Copy Tool",
  description: "A tool for copying and organizing files",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="fixed top-0 w-full bg-background/80 backdrop-blur-sm z-10 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg">CopyCode</Link>
            <nav>
              <ul className="flex gap-4">
                <li>
                  <Link href="/" className="hover:text-blue-500 transition-colors">Home</Link>
                </li>
                <li>
                  <Link href="/copier" className="hover:text-blue-500 transition-colors">File Copier</Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <div className="pt-14">
          {children}
        </div>
      </body>
    </html>
  );
}
