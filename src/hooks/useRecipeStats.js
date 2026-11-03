import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

// `GET /api/recipes/stats` n'existe qu'avec un backend à jour : en cas d'erreur, les compteurs
// sont masqués. Son succès indique aussi que l'API calcule `cookCount` et connaît `cooked=never`.
export default function useRecipeStats() {
  return useQuery({
    queryKey: ['recipes-stats'],
    queryFn: api.getRecipeStats,
    retry: false,
  })
}
