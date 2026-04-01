/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#f7f1e8',
          100: '#efe4d2',
          200: '#e4d1b5',
          300: '#d6ba93',
        },
        sage: {
          50: '#f2f5ef',
          100: '#e3eadb',
          200: '#c8d5bc',
          300: '#a4ba94',
          500: '#738d62',
          600: '#5f7751',
          700: '#4d6143',
          800: '#3d4c35',
          900: '#2f3a2a',
        },
        terracotta: {
          50: '#fcf1ec',
          200: '#f1c2ad',
          500: '#ca6a4e',
          600: '#b55b40',
          800: '#7f3d2a',
          900: '#682f21',
        },
        charcoal: {
          600: '#373737',
          700: '#2c2c2c',
          800: '#212121',
          900: '#181818',
          950: '#101010',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Manrope"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 14px 30px -20px rgba(107, 78, 56, 0.4)',
      },
      keyframes: {
        sheetUp: {
          '0%': { transform: 'translateY(10%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'sheet-up': 'sheetUp 220ms ease-out',
      },
    },
  },
  plugins: [],
}
