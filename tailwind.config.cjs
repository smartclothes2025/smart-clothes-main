// tailwind.config.js
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // 👇 將預設字體 (sans) 直接改為思源宋體
        sans: [
          '"Noto Serif TC"', // 將 'Noto Serif TC' 設為第一順位
          ...defaultTheme.fontFamily.sans, // 保留備用字體
        ],
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['light', 'dark', 'cupcake', 'retro', 'emerald', 'corporate']
  }
}