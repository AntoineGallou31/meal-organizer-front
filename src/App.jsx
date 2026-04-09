import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { App as KonstaApp } from 'konsta/react'
import BottomNav from './components/BottomNav'
import CalendarPage from './pages/CalendarPage'
import RecipeFormPage from './pages/RecipeFormPage'
import ImportRecipePage from './pages/ImportRecipePage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import RecipesPage from './pages/RecipesPage'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

function AppLayout() {
  return (
    <KonstaApp theme="ios" safeAreas={false} className="relative min-h-screen overflow-hidden pb-28">
      <main>
        <Routes>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/recipes/new" element={<RecipeFormPage />} />
          <Route path="/recipes/import" element={<ImportRecipePage />} />
          <Route path="/recipes/:id/edit" element={<RecipeFormPage />} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        </Routes>
      </main>

      <BottomNav />
    </KonstaApp>
  )
}

export default AppLayout
