// tailwind.config.js
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // 將 'sans' 設定為預設字體
        sans: ['"Noto Sans TC"', 'sans-serif'],
      },
    },
  },
  
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['light', 'dark', 'cupcake', 'retro', 'emerald', 'corporate']
  }
}