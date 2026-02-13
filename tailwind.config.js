/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        // Paleta SaaS enterprise: sobria, corporativa y de bajo ruido
        brand: {
          50: '#f6f8fb',
          100: '#eef2f7',
          200: '#dce4ef',
          300: '#c4d1e1',
          400: '#9fb2c9',
          500: '#768ca8',
          600: '#5f7694',
          700: '#4b607c',
          800: '#3b4d66',
          900: '#2f3f54',
        },
        accent: {
          50: '#f7f9fc',
          100: '#edf2f8',
          500: '#6b7f9a',
          600: '#4d617d',
        },
        slate: {
          850: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #f7f9fc 0%, #eef2f7 100%)',
        'gradient-dark': 'linear-gradient(to bottom right, #2f3f54, #4b607c)',
        glass:
          'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.82) 100%)',
      },
      boxShadow: {
        glass: '0 10px 26px 0 rgba(15, 23, 42, 0.08)',
        'glass-sm': '0 4px 12px 0 rgba(15, 23, 42, 0.06)',
        soft: '0 8px 20px rgba(15,23,42,0.10)',
      },
      borderRadius: {
        // Estandarizar radios de bordes
        sm: '0.375rem',   // 6px
        DEFAULT: '0.5rem',  // 8px
        lg: '0.75rem',    // 12px
        xl: '1rem',       // 16px
        '2xl': '1.5rem',  // 24px
        '3xl': '2rem',    // 32px
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
