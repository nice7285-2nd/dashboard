import type { Config } from 'tailwindcss';

const plugin = require('tailwindcss/plugin');

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          400: '#2589FE',
          500: '#0070F3',
          600: '#2F6FEB',
        },
      },
      // 애니메이션 키 프레임 정의
      keyframes: {
        shimmer: {
          '0%': {
            transform: 'translateX(-100%)',
          },
          '100%': {
            transform: 'translateX(100%)',
          },
        },
      },
      // 애니메이션 정의
      animation: {
        shimmer: 'shimmer 2s 1',
      },
      // 커스텀 유틸리티 클래스 정의
      backgroundImage: {
        'gradient-shimmer': 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.6), transparent)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
export default config;
