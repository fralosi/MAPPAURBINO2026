/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Tutte le directory con file da processare
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './utils/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#e5ebfa',     // blu pallido personalizzato
        secondary: '#c8d9ea',   // grigio azzurrato
        accent: '#e0b180',      // sabbia/arancio Hero
        // aggiungi qui palette custom
      },
      // aggiungi se usi font personalizzati
      fontFamily: {
        mono: ['Fira Mono', 'Menlo', 'monospace'],
        sans: ['Inter', 'Helvetica', 'Arial', 'sans-serif']
      },
      // aggiungi effetti custom
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.13)'
      },
      // effetto backdrop blur
      backgroundColor: {
        'blur': 'rgba(230,235,250,0.55)'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    // Altri plugin: aggiungili qui se li installi
  ],
}
