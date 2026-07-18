/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Surfaces (canaux RGB en variables CSS -> bascule clair/sombre + opacité)
        bg: {
          DEFAULT: 'rgb(var(--bg) / <alpha-value>)',
          soft: 'rgb(var(--bg-soft) / <alpha-value>)',
          card: 'rgb(var(--bg-card) / <alpha-value>)',
          hover: 'rgb(var(--bg-hover) / <alpha-value>)',
        },
        line: 'rgb(var(--line) / <alpha-value>)',
        // Texte
        ink: 'rgb(var(--ink) / <alpha-value>)',
        ink2: 'rgb(var(--ink2) / <alpha-value>)',
        ink3: 'rgb(var(--ink3) / <alpha-value>)',
        ink4: 'rgb(var(--ink4) / <alpha-value>)',
        // Marque : corail
        brand: {
          DEFAULT: '#F24B5E',
          soft: '#E11D48',
          glow: '#DA2C46',
        },
        // Accent secondaire : bleu
        azure: {
          DEFAULT: '#2F6BF6',
          soft: '#1E56E0',
        },
        // Sémantique finances
        ok: '#12A150',
        danger: '#F0433A',
        warn: '#F79009',
        info: '#2F6BF6',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', 'Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 1px rgba(16,24,40,0.03), 0 2px 6px -2px rgba(16,24,40,0.05), 0 12px 28px -12px rgba(16,24,40,0.10)',
        lift: '0 2px 4px rgba(16,24,40,0.04), 0 18px 40px -16px rgba(16,24,40,0.20)',
        soft: '0 2px 10px rgba(16,24,40,0.06)',
        nav: '0 8px 34px -12px rgba(16,24,40,0.20)',
        glow: '0 8px 22px -8px rgba(242,75,94,0.45)',
        blue: '0 8px 22px -8px rgba(47,107,246,0.42)',
        insetTop: 'inset 0 1px 0 0 rgba(255,255,255,0.7)',
      },
      borderRadius: {
        xl2: '1.25rem',
        '3xl': '1.75rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .4s cubic-bezier(.2,.7,.2,1) both',
        pop: 'pop .18s ease both',
      },
    },
  },
  plugins: [],
}
