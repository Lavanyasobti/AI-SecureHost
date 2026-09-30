/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      colors: {
        primary: '#0F172A', // Dark Navy
        secondary: '#1E293B', // Slate 800 (keeping for depth)
        accent: '#2563EB', // Blue 600
        alert: '#DC2626', // Red 600
        safe: '#16A34A', // Green 600
        background: '#F1F5F9', // Light Background
      },
    },
  },
  plugins: [],
}
