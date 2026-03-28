/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef5ff',
          100: '#d9e8ff',
          200: '#bcd7ff',
          300: '#8ebeff',
          400: '#599bff',
          500: '#3375fc',
          600: '#1d55f2',
          700: '#1540de',
          800: '#1835b4',
          900: '#1a318e',
          950: '#152056',
        },
        surface: {
          50:  '#f8f9fb',
          100: '#f0f2f5',
          200: '#e4e7ec',
          300: '#cdd3dc',
          400: '#9aa3b4',
          500: '#6b7689',
          600: '#545d6e',
          700: '#454c5a',
          800: '#3b414d',
          900: '#353a43',
          950: '#1e2128',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
