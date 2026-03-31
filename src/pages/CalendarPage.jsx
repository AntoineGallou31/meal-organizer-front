import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import LoadingState from '../components/LoadingState'
import PageFrame from '../components/PageFrame'
import RecipePickerSheet from '../components/RecipePickerSheet'
import { api } from '../lib/api'
import { getWeekDays, getWeekKey } from '../lib/week'

function MealCell({ recipe, manualNote, onAdd, onOpen, onClear, label, onSaveManualNote, onEditManual, isEditing }) {
  const [editText, setEditText] = useState(manualNote || '')

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <p className="w-10 text-sm font-semibold text-charcoal-500 dark:text-cream-500">
          {label}
        </p>
        <div className="flex w-full items-center gap-2">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Entrez un plat..."
            className="w-full rounded-2xl border border-sage-300 bg-white px-3 py-3 text-sm dark:border-sage-700 dark:bg-charcoal-800"
            autoFocus
          />
          <button
            type="button"
            onClick={() => onSaveManualNote(editText)}
            className="rounded-full bg-green-500 p-2 text-white hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-800"
          >
            <Check size={16} />
          </button>
          <button
            type="button"
            onClick={onEditManual}
            className="rounded-full bg-gray-300 p-2 text-charcoal-800 hover:bg-gray-400 dark:bg-charcoal-700 dark:text-cream-200 dark:hover:bg-charcoal-600"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  if (!recipe && !manualNote) {
    return (
      <div className="flex items-center gap-2">
        <p className="w-10 text-sm font-semibold text-charcoal-500 dark:text-cream-500">
          {label}
        </p>
        <div className="flex w-full gap-2">
          <button
            type="button"
            className="flex flex-1 min-h-16 items-center justify-center rounded-2xl border border-dashed border-sage-300 bg-cream-100/50 px-2 py-3 text-sage-700 transition hover:border-sage-500 hover:bg-cream-100 dark:border-sage-700 dark:bg-charcoal-800 dark:text-cream-300"
            onClick={onEditManual}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <Edit2 size={16} />
              Note
            </span>
          </button>
          <button
            type="button"
            className="group flex flex-1 min-h-16 items-center justify-center rounded-2xl border border-dashed border-sage-300 bg-cream-100/50 px-2 py-3 text-sage-700 transition hover:border-sage-500 hover:bg-cream-100 dark:border-sage-700 dark:bg-charcoal-800 dark:text-cream-300"
            onClick={onAdd}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <Plus size={16} className="transition group-hover:rotate-90" />
              Recette
            </span>
          </button>
        </div>
      </div>
    )
  }

  if (recipe) {
    return (
      <div className="flex items-center gap-2">
        <p className="w-10 text-sm font-semibold text-charcoal-500 dark:text-cream-500">
          {label}
        </p>
        <div className="relative w-full">
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
      </div>
    )
  }

  if (manualNote) {
    return (
      <div className="flex items-center gap-2">
        <p className="w-10 text-sm font-semibold text-charcoal-500 dark:text-cream-500">
          {label}
        </p>
        <div className="relative w-full">
          <button
            type="button"
            className="w-full rounded-2xl border border-blue-200 bg-blue-50 px-3 py-3 text-left transition hover:border-blue-400 dark:border-blue-800 dark:bg-blue-900/30"
            onClick={onEditManual}
          >
            <p className="line-clamp-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
              {manualNote}
            </p>
          </button>
          <button
            type="button"
            aria-label="Supprimer"
            className="absolute right-2 top-2 rounded-full bg-white/85 p-1 text-blue-700 shadow hover:bg-white dark:bg-charcoal-800 dark:text-blue-200"
            onClick={onClear}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentWeek] = useState(dayjs())
  const [selection, setSelection] = useState(null)
  const [editingCell, setEditingCell] = useState(null)

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
      setEditingCell(null)
    },
  })

  const removeMealMutation = useMutation({
    mutationFn: api.removeMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plan', weekKey] })
    },
  })

  const days = useMemo(() => {
    const list = Array.isArray(mealPlanQuery.data)
      ? mealPlanQuery.data
      : (mealPlanQuery.data?.days ?? [])
    return list.length ? list : getWeekDays(currentWeek)
  }, [mealPlanQuery.data, currentWeek])

  const subtitle = dayjs().format('MMMM YYYY')

  const getCellKey = (date, slot) => `${date}-${slot}`

  const handleSaveManualNote = (date, slot, text) => {
    const normalizedText = text.trim()
    if (!normalizedText) {
      setEditingCell(null)
      return
    }
    assignMealMutation.mutate({ date, slot, manualText: normalizedText })
  }

  const handleClearCell = (date, slot) => removeMealMutation.mutate({ date, slot })

  const handleToggleEdit = (date, slot) => {
    const key = getCellKey(date, slot)
    if (editingCell === key) {
      setEditingCell(null)
    } else {
      setEditingCell(key)
    }
  }

  return (
    <PageFrame title="Plan des repas" subtitle={subtitle}>
      {mealPlanQuery.isLoading ? <LoadingState /> : null}
      {mealPlanQuery.isError ? <ErrorState /> : null}
      {mealPlanQuery.data ? (
        <div className="divide-y divide-sage-200 dark:divide-sage-800">
          {days.map(day => {
            const lunchKey = getCellKey(day.date, 'lunch')
            const dinnerKey = getCellKey(day.date, 'dinner')
            return (
              <div
                key={day.date}
                 className="flex flex-col gap-4 py-4"
              >
                 <h2 className="font-bold capitalize text-charcoal-800 dark:text-cream-100">
                  {dayjs(day.date).format('dddd DD MMMM')}
                </h2>
                <div className="flex flex-col gap-4">
                  <MealCell
                    key={`${lunchKey}-${day.lunch?.id ?? 'no-recipe'}-${day.lunchManualText ?? ''}`}
                    label="Midi"
                    recipe={day.lunch}
                    manualNote={day.lunchManualText}
                    isEditing={editingCell === lunchKey}
                    onAdd={() => setSelection({ date: day.date, slot: 'lunch' })}
                    onOpen={() => navigate(`/recipes/${day.lunch.id}`)}
                    onClear={() => handleClearCell(day.date, 'lunch')}
                    onEditManual={() => handleToggleEdit(day.date, 'lunch')}
                    onSaveManualNote={(text) => handleSaveManualNote(day.date, 'lunch', text)}
                  />
                  <MealCell
                    key={`${dinnerKey}-${day.dinner?.id ?? 'no-recipe'}-${day.dinnerManualText ?? ''}`}
                    label="Soir"
                    recipe={day.dinner}
                    manualNote={day.dinnerManualText}
                    isEditing={editingCell === dinnerKey}
                    onAdd={() => setSelection({ date: day.date, slot: 'dinner' })}
                    onOpen={() => navigate(`/recipes/${day.dinner.id}`)}
                    onClear={() => handleClearCell(day.date, 'dinner')}
                    onEditManual={() => handleToggleEdit(day.date, 'dinner')}
                    onSaveManualNote={(text) => handleSaveManualNote(day.date, 'dinner', text)}
                  />
                </div>
              </div>
            )
          })}
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
