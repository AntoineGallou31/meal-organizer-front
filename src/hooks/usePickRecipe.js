import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { getPlanningPath } from '../lib/recipes'

// Ajoute la recette choisie au créneau, puis revient au planning sur la bonne semaine.
// La navigation remplace l'entrée courante : depuis un dossier, un retour en arrière
// (`navigate(-1)`) ramènerait à la liste au lieu du planning.
export default function usePickRecipe(selection) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (recipe) =>
      api.createMealPlanItem({ date: selection.date, slot: selection.slot, type: 'recipe', recipeId: recipe.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plan'] })
      navigate(getPlanningPath(selection), { replace: true })
    },
  })
}
