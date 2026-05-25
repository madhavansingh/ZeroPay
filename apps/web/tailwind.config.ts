/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#14A99A', // Brand primary
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        surface: {
          DEFAULT: '#0f1117',
          card: '#1a1d27',
          elevated: '#22263a',
          border: '#2a2e42',
        },
        text: {
          primary: '#f1f3f9',
          secondary: '#8b90a8',
          muted: '#4b5168',
        },
        status: {
          pending: '#f59e0b',
          submitted: '#3b82f6',
          confirming: '#8b5cf6',
          confirmed: '#10b981',
          settled: '#10b981',
          expired: '#6b7280',
          failed: '#ef4444',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'checkmark': 'checkmark 0.4s ease-out forwards',
        'grow-up': 'growUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
        checkmark: { from: { strokeDashoffset: '48' }, to: { strokeDashoffset: '0' } },
        growUp: {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'bottom' },
          '100%': { transform: 'scaleY(1)', transformOrigin: 'bottom' },
        },
      },
    },
  },
  plugins: [],
};
