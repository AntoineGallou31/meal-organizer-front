import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { removeItemFromWeek } from '../../lib/mealPlan'

export const UNDO_DELAY_MS = 5000

// Ids retirés dont le DELETE n'est peut-être pas parti (page fermée pendant l'attente).
// Ils sont supprimés au chargement suivant.
const STORAGE_KEY = 'meal-organizer:pending-removals'

function readStoredIds() {
  try {
    const ids = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(ids) ? ids : []
  } catch {
    return []
  }
}

function writeStoredIds(ids) {
  try {
    if (ids.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Stockage indisponible (navigation privée…) : seule la reprise est perdue
  }
}

const storeId = (id) => writeStoredIds([...new Set([...readStoredIds(), id])])
const forgetId = (id) => writeStoredIds(readStoredIds().filter((storedId) => storedId !== id))

// Retrait annulable : l'item est masqué tout de suite et la suppression n'est envoyée
// qu'après UNDO_DELAY_MS sans « Annuler ». Elle part immédiatement si un second retrait
// arrive, si la page se démonte, ou si l'onglet est masqué ou fermé.
export default function usePendingRemoval({ removeItem, removeItemOnExit }) {
  const queryClient = useQueryClient()
  const [pendingItem, setPendingItem] = useState(null)
  const [recoveringIds, setRecoveringIds] = useState(readStoredIds)
  const pendingRef = useRef(null)
  const timerRef = useRef(null)
  const recoveryStartedRef = useRef(false)
  const removeRef = useRef({ removeItem, removeItemOnExit })

  useEffect(() => {
    removeRef.current = { removeItem, removeItemOnExit }
  })

  // Suppressions interrompues lors d'une visite précédente
  useEffect(() => {
    if (recoveryStartedRef.current || recoveringIds.length === 0) return
    recoveryStartedRef.current = true

    const recover = async () => {
      const results = await Promise.all(
        recoveringIds.map((id) =>
          api.removeMealPlanItem({ id }).then(
            () => true,
            // 404 : déjà supprimé
            (error) => error?.status === 404,
          ),
        ),
      )
      const removedIds = recoveringIds.filter((_, index) => results[index])
      removedIds.forEach(forgetId)

      // Un chargement lancé avant la suppression renverrait encore ces items : on l'annule,
      // on les retire du cache et on recharge avant de les démasquer
      await queryClient.cancelQueries({ queryKey: ['meal-plan'] })
      queryClient.setQueriesData({ queryKey: ['meal-plan'] }, (data) =>
        removedIds.reduce((week, id) => removeItemFromWeek(week, id), data),
      )
      await queryClient.invalidateQueries({ queryKey: ['meal-plan'] })

      // Les échecs restent masqués et seront rejoués au prochain chargement
      setRecoveringIds(recoveringIds.filter((_, index) => !results[index]))
    }
    recover()
  }, [recoveringIds, queryClient])

  // Retire l'item en attente de la file et le renvoie
  const takePending = useCallback(() => {
    const item = pendingRef.current
    clearTimeout(timerRef.current)
    pendingRef.current = null
    setPendingItem(null)
    return item
  }, [])

  const flush = useCallback(() => {
    const item = takePending()
    if (!item) return
    forgetId(item.id)
    removeRef.current.removeItem(item)
  }, [takePending])

  const remove = useCallback(
    (item) => {
      flush()
      storeId(item.id)
      pendingRef.current = item
      setPendingItem(item)
      timerRef.current = setTimeout(flush, UNDO_DELAY_MS)
    },
    [flush],
  )

  const undo = useCallback(() => {
    const item = takePending()
    if (item) forgetId(item.id)
  }, [takePending])

  useEffect(() => {
    // L'id reste stocké : si la page se ferme avant la fin de la requête, elle sera rejouée
    const flushOnExit = () => {
      const item = takePending()
      if (item) removeRef.current.removeItemOnExit(item, () => forgetId(item.id))
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushOnExit()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', flushOnExit)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', flushOnExit)
      flush()
    }
  }, [flush, takePending])

  const hiddenIds = pendingItem ? [pendingItem.id, ...recoveringIds] : recoveringIds

  return { pendingItem, hiddenIds, remove, undo }
}
