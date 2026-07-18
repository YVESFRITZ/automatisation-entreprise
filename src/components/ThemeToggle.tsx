import { useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { getTheme, toggleTheme, type Theme } from '../lib/theme'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(() => getTheme())
  return (
    <button
      onClick={() => setTheme(toggleTheme())}
      className={`grid place-items-center rounded-full transition text-ink2 hover:text-ink hover:bg-bg-hover ${className}`}
      aria-label={theme === 'dark' ? 'Passer en clair' : 'Passer en sombre'}
      title={theme === 'dark' ? 'Thème clair' : 'Thème sombre'}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
