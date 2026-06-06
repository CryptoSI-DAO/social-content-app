/** @type {import('tailwindcss').Config'} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0a0a0f',
          card: '#141420',
          border: '#2a2a3a',
          accent: '#4a7cf7',
          text: '#e4e4e9',
          muted: '#8888a0',
        },
      },
    },
  },
  plugins: [],
}
