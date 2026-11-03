import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

// Met à jour des paramètres d'URL sans ajouter d'entrée d'historique. `null` ou '' retire le paramètre.
export default function useUpdateSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  const updateSearchParams = useCallback(
    (patch) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          Object.entries(patch).forEach(([key, value]) => {
            if (value == null || value === '') {
              next.delete(key)
            } else {
              next.set(key, value)
            }
          })
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  return [searchParams, updateSearchParams]
}
