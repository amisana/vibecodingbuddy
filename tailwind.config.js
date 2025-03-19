/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Poolsuite-inspired color palette
        'poolbeige': '#f5f0e8',
        'poolteal': '#46b3b3',
        'poolpink': '#e4a0c1',
        'poolpink-light': '#f0c5d7',
        'pooldark': '#253137',
        
        // Custom background and foreground
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      fontFamily: {
        'cursive': ['var(--font-dancing-script)', 'cursive'],
        'vapor': ['Vaporfuturism', 'sans-serif'],
      },
      scale: {
        '102': '1.02',
      },
      dropShadow: {
        'retro': '2px 2px 0px rgba(0, 0, 0, 0.3)',
        'retrolight': '1px 1px 0px rgba(0, 0, 0, 0.2)',
        'vaporwave': '2px 2px 0px #e4a0c1',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}
