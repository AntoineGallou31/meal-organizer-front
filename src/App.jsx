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

function AppLayout() {
  return (
    <KonstaApp theme="ios" safeAreas>
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
