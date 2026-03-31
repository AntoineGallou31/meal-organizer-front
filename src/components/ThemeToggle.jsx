import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

const THEME_STORAGE_KEY = 'meal-organizer-theme'

function getPreferredTheme() {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => getPreferredTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      aria-label={isDark ? 'Activer le thème clair' : 'Activer le thème sombre'}
      title={isDark ? 'Thème clair' : 'Thème sombre'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex items-center gap-2 rounded-2xl border border-cream-300 bg-white/90 px-3 py-2 text-xs font-semibold text-sage-800 shadow-soft transition hover:bg-cream-100 dark:border-charcoal-700 dark:bg-charcoal-800/90 dark:text-cream-100 dark:hover:bg-charcoal-700"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      <span>{isDark ? 'Clair' : 'Sombre'}</span>
    </button>
  )
}
