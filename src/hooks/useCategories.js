import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

// Catégories avec leurs compteurs. Clé distincte de ['categories'] seule, que le formulaire
// de recette remplit sans compteurs ; invalider ['categories'] rafraîchit les deux.
export default function useCategories() {
  return useQuery({
    queryKey: ['categories', 'withCount'],
    queryFn: () => api.getCategories(true),
  })
}
