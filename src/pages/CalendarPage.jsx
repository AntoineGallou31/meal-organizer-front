import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutationState, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import MealSheet from '../components/planning/MealSheet'
import UndoSnackbar from '../components/planning/UndoSnackbar'
import useMealPlanMutations, { REMOVE_MUTATION_KEY } from '../components/planning/useMealPlanMutations'
import usePendingRemoval, { UNDO_DELAY_MS } from '../components/planning/usePendingRemoval'
import WeekGrid from '../components/planning/WeekGrid'
import WeekHeader from '../components/planning/WeekHeader'
import {
  buildWeek,
  countPlannedMeals,
  formatSlotShort,
  getErrorMessage,
  isSlotKey,
  mealPlanQueryOptions,
  MEALS_PER_WEEK,
} from '../lib/mealPlan'
import { getWeekDays, getWeekKey } from '../lib/week'

export default function CalendarPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const weekParam = searchParams.get('week')
  // Créneau dont le panneau est ouvert : gardé dans l'URL pour le rouvrir au retour
  // du sélecteur de recette ou d'une fiche recette
  const openDate = searchParams.get('date')
  const openSlot = searchParams.get('slot')

  const currentWeek = useMemo(() => {
    const parsed = weekParam ? dayjs(weekParam) : null
    return parsed?.isValid() ? parsed : dayjs()
  }, [weekParam])
  const isCurrentWeek = getWeekKey(currentWeek) === getWeekKey(dayjs())

  const mealPlanQuery = useQuery(mealPlanQueryOptions(currentWeek))

  const [error, setError] = useState(null)
  const showError = useCallback((cause) => setError({ id: Date.now(), message: getErrorMessage(cause) }), [])
  useEffect(() => {
    if (!error) return undefined
    const timer = setTimeout(() => setError(null), UNDO_DELAY_MS)
    return () => clearTimeout(timer)
  }, [error])

  const { addItem, updateNote, removeItem, removeItemOnExit } = useMealPlanMutations({ onError: showError })
  const { pendingItem, hiddenIds, remove, undo } = usePendingRemoval({ removeItem, removeItemOnExit })
  const removeWithUndo = (item) => {
    setError(null)
    remove(item)
  }

  // Masque l'item en attente d'annulation et ceux dont la suppression est en vol
  const removingIds = useMutationState({
    filters: { mutationKey: REMOVE_MUTATION_KEY, status: 'pending' },
    select: (mutation) => mutation.state.variables?.item?.id,
  })
  const hiddenKey = [...hiddenIds, ...removingIds].filter(Boolean).join('|')

  // Précharge les semaines voisines pour que la navigation soit instantanée
  useEffect(() => {
    for (const offset of [-1, 1]) {
      queryClient.prefetchQuery(mealPlanQueryOptions(currentWeek.add(offset, 'week')))
    }
  }, [queryClient, currentWeek])

  const days = useMemo(
    () => buildWeek(getWeekDays(currentWeek), mealPlanQuery.data, new Set(hiddenKey ? hiddenKey.split('|') : [])),
    [currentWeek, mealPlanQuery.data, hiddenKey],
  )
  const plannedCount = countPlannedMeals(days)

  const notice = error
    ? { type: 'error', title: error.message, detail: "Le planning n'a pas été modifié" }
    : pendingItem
      ? {
          type: 'undo',
          title: pendingItem.type === 'note' ? 'Note retirée' : `${pendingItem.recipe?.title ?? 'Recette'} retiré`,
          detail: formatSlotShort(pendingItem.date, pendingItem.slot),
        }
      : null

  const sheetTarget = useMemo(() => {
    if (!isSlotKey(openSlot) || !days.some((day) => day.date === openDate)) return null
    return { date: openDate, slot: openSlot }
  }, [days, openDate, openSlot])

  const updateParams = useCallback(
    (patch) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          Object.entries(patch).forEach(([key, value]) => {
            if (value == null) {
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

  const goToWeek = (date) => updateParams({ week: date.format('YYYY-MM-DD'), date: null, slot: null })
  const openSheet = (date, slot) => updateParams({ week: currentWeek.format('YYYY-MM-DD'), date, slot })
  const closeSheet = () => updateParams({ date: null, slot: null })

  // Sélecteur de recette existant : il crée l'item puis revient ici, où le panneau se rouvre
  const openRecipePicker = (date, slot) => {
    const params = new URLSearchParams({ mode: 'select', date, slot })
    navigate(`/recipes?${params.toString()}`)
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <WeekHeader
        week={currentWeek}
        isCurrentWeek={isCurrentWeek}
        plannedCount={plannedCount}
        totalCount={MEALS_PER_WEEK}
        loading={mealPlanQuery.isPending}
        onPrevious={() => goToWeek(currentWeek.subtract(1, 'week'))}
        onNext={() => goToWeek(currentWeek.add(1, 'week'))}
        onToday={() => goToWeek(dayjs())}
      />

      {mealPlanQuery.isError ? (
        <div className="px-4 pt-3.5">
          <ErrorState
            message={`Impossible de charger le planning. ${mealPlanQuery.error?.message ?? ''}`.trim()}
            onRetry={() => mealPlanQuery.refetch()}
          />
        </div>
      ) : (
        <WeekGrid days={days} loading={mealPlanQuery.isPending} onOpenSlot={openSheet} />
      )}

      <MealSheet
        target={sheetTarget}
        days={days}
        notice={notice}
        onUndo={undo}
        onDismissNotice={() => setError(null)}
        onClose={closeSheet}
        onAddRecipe={openRecipePicker}
        onAddItem={addItem}
        onUpdateNote={updateNote}
        onRemoveItem={removeWithUndo}
      />

      <UndoSnackbar
        notice={sheetTarget ? null : notice}
        onUndo={undo}
        onDismiss={() => setError(null)}
        className="fixed inset-x-4 bottom-[calc(80px+max(20px,env(safe-area-inset-bottom)))] z-40 mx-auto max-w-lg"
      />
    </div>
  )
}
