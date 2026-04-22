/** @type {import('tailwindcss').Config} */
const defaultColors = require('tailwindcss/colors')

// #FD002D 기반 레드 계열 팔레트
const brandRed = {
  50:  '#fff0f2',
  100: '#ffe0e5',
  200: '#ffc6cf',
  300: '#ff9dab',
  400: '#ff6479',
  500: '#FD002D',
  600: '#E50028',
  700: '#C10022',
  800: '#A0001D',
  900: '#84001C',
  950: '#4C000E',
}

module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    colors: {
      // Tailwind 기본 색상 유지
      ...defaultColors,
      // blue를 #FD002D 계열로 완전 교체
      blue: brandRed,
      // indigo도 같은 계열로 교체 (쿠폰 그라디언트 등)
      indigo: brandRed,
      // brand 토큰도 동일하게 설정
      brand: brandRed,
      // 쿠폰 배너 전용 색상
      coupon: {
        500: '#eb3f3f',
        600: '#d43636',
        700: '#b82e2e',
      },
    },
    extend: {},
  },
  plugins: [],
}

