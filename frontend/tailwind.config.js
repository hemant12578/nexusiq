/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        nexus: {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a2e',
          600: '#242440',
        }
      },
      animation: {
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'float': 'float 5s ease-in-out infinite',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.22,1,0.36,1) forwards',
        'fade-in': 'fadeInUp 0.4s cubic-bezier(0.22,1,0.36,1) forwards',
        'slide-in-left': 'slideInLeft 0.5s cubic-bezier(0.22,1,0.36,1) forwards',
        'slide-in-right': 'slideInRight 0.5s cubic-bezier(0.22,1,0.36,1) forwards',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(124,58,237,0.3), 0 0 10px rgba(124,58,237,0.1)' },
          '50%': { boxShadow: '0 0 15px rgba(124,58,237,0.6), 0 0 40px rgba(124,58,237,0.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeInUp: {
          '0%': { transform: 'translateY(16px) scale(0.97)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      backdropBlur: {
        '2xl': '40px',
      },
    },
  },
  plugins: [],
}
