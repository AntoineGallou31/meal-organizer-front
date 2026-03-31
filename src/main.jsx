import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'
import { queryClient } from './lib/queryClient'

registerSW({ immediate: true })

const THEME_STORAGE_KEY = 'meal-organizer-theme'

function applyInitialTheme() {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const theme = storedTheme === 'light' || storedTheme === 'dark'
    ? storedTheme
    : (systemPrefersDark ? 'dark' : 'light')

  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

applyInitialTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
