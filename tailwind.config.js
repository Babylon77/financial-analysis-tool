/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: 'var(--terminal-bg)',
          green: 'var(--terminal-green)',
          'green-muted': 'var(--terminal-green-muted)',
          'dim-green': 'var(--terminal-dim-green)',
          'dark-green': 'var(--terminal-dark-green)',
          amber: 'var(--terminal-amber)',
          'amber-dim': 'var(--terminal-amber-dim)',
          red: 'var(--terminal-red)',
          'red-dim': 'var(--terminal-red-dim)',
          cyan: 'var(--terminal-cyan)',
          'cyan-dim': 'var(--terminal-cyan-dim)',
          magenta: 'var(--terminal-magenta)',
        },
        surface: {
          primary: 'var(--surface-primary)',
          elevated: 'var(--surface-elevated)',
          overlay: 'var(--surface-overlay)',
          border: 'var(--surface-border)',
          'border-light': 'var(--surface-border-light)',
          'border-subtle': 'var(--surface-border-subtle)',
        },
        txt: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Fira Code'", "'Consolas'", 'monospace'],
        body: ["'Inter'", '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'sans-serif'],
        display: ["'Space Grotesk'", "'Inter'", 'sans-serif'],
      },
      boxShadow: {
        'glow-green': '0 0 15px rgba(0, 255, 65, 0.2)',
        'glow-green-sm': '0 0 8px rgba(0, 255, 65, 0.1)',
        'glow-amber': '0 0 15px rgba(255, 176, 0, 0.2)',
        'glow-red': '0 0 15px rgba(255, 7, 58, 0.2)',
        'glow-cyan': '0 0 15px rgba(0, 212, 255, 0.2)',
      },
      backgroundImage: {
        'terminal-grid':
          'linear-gradient(rgba(0, 255, 65, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 65, 0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
}
