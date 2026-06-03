/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: { 'sm':'640px', 'md':'768px', 'lg':'1024px', 'xl':'1280px' },
      colors: {
        brand: { 400:'#f5a623', 500:'#e8950f' },
        surface: { DEFAULT:'#0a0a0a', card:'#111111', hover:'#1a1a1a' }
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        display: ['Bebas Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
