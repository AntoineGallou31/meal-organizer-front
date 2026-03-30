import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import LoadingState from '../components/LoadingState'
import PageFrame from '../components/PageFrame'
import RecipePickerSheet from '../components/RecipePickerSheet'
import { api } from '../lib/api'
import { formatWeekLabel, getWeekDays, getWeekKey } from '../lib/week'

function MealCell({ recipe, onAdd, onOpen, onClear }) {
  if (!recipe) {
    return (
      <button
        type="button"
        className="group flex w-full min-h-20 items-center justify-center rounded-2xl border border-dashed border-sage-300 bg-cream-100/50 px-2 py-3 text-sage-700 transition hover:border-sage-500 hover:bg-cream-100 dark:border-sage-700 dark:bg-charcoal-800 dark:text-cream-300"
        onClick={onAdd}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <Plus size={16} className="transition group-hover:rotate-90" />
          Ajouter
        </span>
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="w-full rounded-2xl border border-terracotta-200 bg-terracotta-50 px-3 py-3 text-left transition hover:border-terracotta-400 dark:border-terracotta-800 dark:bg-terracotta-900/30"
        onClick={onOpen}
      >
        <p className="line-clamp-2 text-sm font-semibold text-terracotta-900 dark:text-terracotta-100">
          {recipe.title}
        </p>
      </button>
      <button
        type="button"
        aria-label="Supprimer"
        className="absolute right-2 top-2 rounded-full bg-white/85 p-1 text-terracotta-700 shadow hover:bg-white dark:bg-charcoal-800 dark:text-terracotta-200"
        onClick={onClear}
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentWeek, setCurrentWeek] = useState(dayjs())
  const [selection, setSelection] = useState(null)

  const weekKey = getWeekKey(currentWeek)

  const mealPlanQuery = useQuery({
    queryKey: ['meal-plan', weekKey],
    queryFn: () => api.getMealPlan(weekKey),
  })

  const recipesQuery = useQuery({
    queryKey: ['recipes'],
    queryFn: api.getRecipes,
  })

  const assignMealMutation = useMutation({
    mutationFn: api.assignMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plan', weekKey] })
      setSelection(null)
    },
  })

  const removeMealMutation = useMutation({
    mutationFn: api.removeMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plan', weekKey] })
    },
  })

  const days = useMemo(() => {
    const list = mealPlanQuery.data?.days ?? []
    return list.length ? list : getWeekDays(currentWeek)
  }, [mealPlanQuery.data?.days, currentWeek])

  const subtitle = formatWeekLabel(currentWeek)

  return (
    <PageFrame
      title="Plan des repas"
      subtitle={subtitle}
      action={
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-sage-300 p-2 text-sage-800 transition hover:bg-cream-100 dark:border-sage-700 dark:text-cream-200 dark:hover:bg-charcoal-800"
            onClick={() => setCurrentWeek((prev) => prev.subtract(1, 'week'))}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="rounded-full border border-sage-300 p-2 text-sage-800 transition hover:bg-cream-100 dark:border-sage-700 dark:text-cream-200 dark:hover:bg-charcoal-800"
            onClick={() => setCurrentWeek((prev) => prev.add(1, 'week'))}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      }
    >
      {mealPlanQuery.isLoading ? <LoadingState label="Chargement du calendrier..." /> : null}
      {mealPlanQuery.isError ? (
        <ErrorState message={mealPlanQuery.error.message} onRetry={mealPlanQuery.refetch} />
      ) : null}

      {!mealPlanQuery.isLoading && !mealPlanQuery.isError ? (
        <div className="overflow-hidden rounded-3xl border border-cream-200 dark:border-charcoal-700">
          <div className="grid grid-cols-8 bg-sage-100 dark:bg-charcoal-800">
            <div className="p-2" />
            {days.map((day) => (
              <div key={day.date} className="p-2 text-center text-xs font-semibold text-sage-800 dark:text-cream-200">
                <div>{day.dayLabel}</div>
                <div className="text-[11px] uppercase opacity-70">{day.dayNumber}</div>
              </div>
            ))}
          </div>

          {[{ key: 'lunch', label: 'Midi' }, { key: 'dinner', label: 'Soir' }].map((row) => (
            <div key={row.key} className="grid grid-cols-8 border-t border-cream-200 bg-white dark:border-charcoal-700 dark:bg-charcoal-900">
              <div className="flex items-center justify-center border-r border-cream-200 p-2 text-xs font-bold uppercase tracking-wide text-sage-700 dark:border-charcoal-700 dark:text-cream-300">
                {row.label}
              </div>

              {days.map((day) => {
                const recipe = day[row.key]

                return (
                  <div key={`${day.date}-${row.key}`} className="border-r border-cream-100 p-2 last:border-r-0 dark:border-charcoal-800">
                    <MealCell
                      recipe={recipe}
                      onAdd={() => setSelection({ date: day.date, slot: row.key })}
                      onOpen={() => navigate(`/recipes/${recipe.id}`)}
                      onClear={(event) => {
                        event.stopPropagation()
                        removeMealMutation.mutate({ date: day.date, slot: row.key })
                      }}
                    />
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      ) : null}

      {assignMealMutation.isError ? (
        <p className="mt-3 text-sm text-red-700 dark:text-red-300">{assignMealMutation.error.message}</p>
      ) : null}

      {removeMealMutation.isError ? (
        <p className="mt-3 text-sm text-red-700 dark:text-red-300">{removeMealMutation.error.message}</p>
      ) : null}

      <RecipePickerSheet
        open={Boolean(selection)}
        title={selection ? `Choisir un plat pour ${selection.slot === 'lunch' ? 'midi' : 'soir'}` : ''}
        recipes={recipesQuery.data ?? []}
        loading={recipesQuery.isLoading || assignMealMutation.isPending}
        error={recipesQuery.isError}
        onClose={() => setSelection(null)}
        onPick={(recipe) => {
          if (!selection) return
          assignMealMutation.mutate({ date: selection.date, slot: selection.slot, recipeId: recipe.id })
        }}
      />
    </PageFrame>
  )
}
