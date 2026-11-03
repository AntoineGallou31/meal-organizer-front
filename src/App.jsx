import { Route, Routes, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import CalendarPage from './pages/CalendarPage'
import RecipeFormPage from './pages/RecipeFormPage'
import ImportRecipePage from './pages/ImportRecipePage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import RecipeFolderPage from './pages/RecipeFolderPage'
import RecipesPage from './pages/RecipesPage'
import ShareTargetPage from './pages/ShareTargetPage'
import { getSelection } from './lib/recipes'

const API_URL = import.meta.env.VITE_API_URL ?? 'https://meal-organizer-back.vercel.app'

function AppLayout() {
  const { pathname, search } = useLocation()
  // Choix d'une recette depuis le planning : la barre de navigation est masquée
  const isPickingRecipe = pathname.startsWith('/recipes') && getSelection(new URLSearchParams(search)) != null

  return (
    <>
      <main className={isPickingRecipe ? 'pb-[max(16px,env(safe-area-inset-bottom))]' : 'pb-(--bottom-nav-space)'}>
        <Routes>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/recipes/folder/:folderId" element={<RecipeFolderPage />} />
          <Route path="/recipes/new" element={<RecipeFormPage />} />
          <Route path="/recipes/import" element={<ImportRecipePage />} />
          <Route path="/share-target" element={<ShareTargetPage />} />
          <Route path="/recipes/:id/edit" element={<RecipeFormPage />} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        </Routes>
      </main>

      {/* Masquée sans être démontée, pour garder la mémoire des onglets */}
      <BottomNav hidden={isPickingRecipe} />
    </>
  )
}

export default AppLayout
