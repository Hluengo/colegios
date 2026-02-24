/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      // ==========================================
      // SISTEMA DE DISEÑO MODERNO - TOKENS
      // ==========================================

      // COLORES - Sistema Surface
      colors: {
        // Surface tokens (para fondos y elevación)
        surface: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },

        // Primary - Indigo moderno
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1', // Indigo-500 - Color principal
          600: '#4f46e5', // Indigo-600 - Hover
          700: '#4338ca', // Indigo-700 - Active
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },

        // Accent - Colores semánticos
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },

        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },

        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },

        info: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },

        // Brand legacy (mantener compatibilidad)
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },

        // Slate extendido
        slate: {
          850: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },

      // SOMBRAS - Sistema de elevación moderno
      boxShadow: {
        // Sombras sutiles para superficies
        'surface-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'surface-md':
          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'surface-lg':
          '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'surface-xl':
          '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',

        // Sombras con color (glow effects)
        'glow-primary': '0 0 20px rgba(99, 102, 241, 0.25)',
        'glow-success': '0 0 20px rgba(34, 197, 94, 0.25)',
        'glow-danger': '0 0 20px rgba(239, 68, 68, 0.25)',

        // Glass effects
        glass: '0 10px 26px 0 rgba(15, 23, 42, 0.08)',
        'glass-sm': '0 4px 12px 0 rgba(15, 23, 42, 0.06)',
        soft: '0 8px 20px rgba(15,23,42,0.10)',

        // Legacy
        'glass-panel': '0 10px 26px 0 rgba(15, 23, 42, 0.08)',
        'glass-panel-hover': '0 20px 25px -5px rgba(15, 23, 42, 0.12)',
      },

      // BORDER RADIUS - Escala moderna
      borderRadius: {
        sm: '0.375rem', // 6px
        DEFAULT: '0.5rem', // 8px
        lg: '0.75rem', // 12px
        xl: '1rem', // 16px
        '2xl': '1.5rem', // 24px
        '3xl': '2rem', // 32px
        full: '9999px',
      },

      // BACKDROP BLUR
      backdropBlur: {
        xs: '2px',
      },

      // ANIMACIONES - Micro-interacciones
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
        shimmer: 'shimmer 2s linear infinite',

        // Loading states
        'spin-slow': 'spin 2s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
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
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },

      // TRANSICIONES - Extendidas para mejor UX
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        'smooth-out': 'cubic-bezier(0, 0, 0.2, 1)',
      },

      // BACKGROUND IMAGES
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #f7f9fc 0%, #eef2f7 100%)',
        'gradient-dark': 'linear-gradient(to bottom right, #2f3f54, #4b607c)',
        'gradient-primary': 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        'gradient-surface': 'linear-gradient(to bottom, #ffffff, #fafafa)',
        shimmer:
          'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        glass:
          'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.82) 100%)',
      },

      // SPACING - Grid y gaps
      spacing: {
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
      },

      // Z-INDEX
      zIndex: {
        dropdown: '1000',
        sticky: '1020',
        fixed: '1030',
        'modal-backdrop': '1040',
        modal: '1050',
        popover: '1060',
        tooltip: '1070',
      },
    },
  },
  plugins: [],
};
