import { useCallback, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import MealSheet from '../components/planning/MealSheet'
import useMealPlanMutations from '../components/planning/useMealPlanMutations'
import WeekGrid from '../components/planning/WeekGrid'
import WeekHeader from '../components/planning/WeekHeader'
import { buildWeek, countPlannedMeals, isSlotKey, mealPlanQueryOptions, MEALS_PER_WEEK } from '../lib/mealPlan'
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
  const { addItem, updateNote, removeItem } = useMealPlanMutations()

  // Précharge les semaines voisines pour que la navigation soit instantanée
  useEffect(() => {
    for (const offset of [-1, 1]) {
      queryClient.prefetchQuery(mealPlanQueryOptions(currentWeek.add(offset, 'week')))
    }
  }, [queryClient, currentWeek])

  const days = useMemo(
    () => buildWeek(getWeekDays(currentWeek), mealPlanQuery.data),
    [currentWeek, mealPlanQuery.data],
  )
  const plannedCount = countPlannedMeals(days)

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
        onClose={closeSheet}
        onAddRecipe={openRecipePicker}
        onAddItem={addItem}
        onUpdateNote={updateNote}
        onRemoveItem={removeItem}
      />
    </div>
  )
}
