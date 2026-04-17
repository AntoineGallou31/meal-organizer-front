import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, ArrowRightIcon, Plus, Trash2 } from 'lucide-react'
import dayjs from 'dayjs'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  BlockTitle,
  Button,
  List,
  ListInput,
  ListItem,
  Navbar,
  Page,
  Preloader,
  Sheet,
} from 'konsta/react'
import { api } from '../lib/api'
import { getWeekDays, getWeekKey, formatWeekLabel } from '../lib/week'

export default function CalendarPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const weekParam = searchParams.get('week')
  const [currentWeek, setCurrentWeek] = useState(() => (weekParam ? dayjs(weekParam) : dayjs()))
  const [editingCell, setEditingCell] = useState(null)
  const [editingValue, setEditingValue] = useState('')
  const [actionTarget, setActionTarget] = useState(null)

  const weekKey = getWeekKey(currentWeek)

  const mealPlanQuery = useQuery({
    queryKey: ['meal-plan', weekKey],
    queryFn: () => api.getMealPlan(weekKey),
    placeholderData: (previousData) => previousData,
  })

  const assignMealMutation = useMutation({
    mutationFn: api.assignMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plan', weekKey] })
      setEditingCell(null)
      setEditingValue('')
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

  const subtitle = formatWeekLabel(currentWeek)

  const goToPreviousWeek = () => {
    setCurrentWeek((prev) => {
      const nextWeek = prev.subtract(1, 'week')
      setSearchParams({ week: nextWeek.format('YYYY-MM-DD') }, { replace: true })
      return nextWeek
    })
  }

  const goToNextWeek = () => {
    setCurrentWeek((prev) => {
      const nextWeek = prev.add(1, 'week')
      setSearchParams({ week: nextWeek.format('YYYY-MM-DD') }, { replace: true })
      return nextWeek
    })
  }

  const getCellKey = (date, slot) => `${date}-${slot}`

  const handleSaveManualNote = (date, slot, text) => {
    const normalizedText = text.trim()
    if (!normalizedText) {
      setEditingCell(null)
      setEditingValue('')
      removeMealMutation.mutate({ date, slot })
      return
    }
    assignMealMutation.mutate({ date, slot, manualText: normalizedText })
  }

  const startInlineEdit = (date, slot, initialValue = '') => {
    setEditingCell(getCellKey(date, slot))
    setEditingValue(initialValue)
  }

  const openRecipePicker = (date, slot, options = {}) => {
    const multi = options.multi === true
    const recipe = slot === 'lunch' ? (days.find(d => d.date === date)?.lunch) : (days.find(d => d.date === date)?.dinner)
    const existingTitle = recipe?.title ?? undefined
    const params = new URLSearchParams({
      mode: 'select',
      date,
      slot,
      ...(multi && { multi: '1' }),
      ...(existingTitle && { existing: existingTitle }),
    })
    setSearchParams({ week: currentWeek.format('YYYY-MM-DD') }, { replace: true })
    navigate(`/recipes?${params.toString()}`)
  }

  const openSlotActions = (date, slot) => {
    setActionTarget({ date, slot })
  }

  const closeSlotActions = () => {
    setActionTarget(null)
  }

  const isRecipeToComplete = (recipe) => {
    if (!recipe) return false

    if (recipe.incomplete || recipe.importMode === 'incomplete') {
      return true
    }

    if (recipe.restrictedDetail) {
      return true
    }

    return (recipe.categories ?? []).some((category) => {
      const categoryName = String(category?.name ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()

      return categoryName === 'a completer'
    })
  }

  const openMealRecipe = (recipe) => {
    if (!recipe?.id) return

    if (isRecipeToComplete(recipe) && recipe.sourceUrl) {
      window.location.assign(recipe.sourceUrl)
      return
    }

    navigate(`/recipes/${recipe.id}`)
  }

  const renderSlotItem = (day, slot, label) => {
    const recipe = slot === 'lunch' ? day.lunch : day.dinner
    const manualNote = slot === 'lunch' ? day.lunchManualText : day.dinnerManualText
    const noteLines = typeof manualNote === 'string'
      ? manualNote.split('\n').map((line) => line.trim()).filter(Boolean)
      : []
    const cellKey = getCellKey(day.date, slot)
    const isEditing = editingCell === cellKey
    const hasSelectedMeal = Boolean(recipe || manualNote)
    const hasMultipleNoteLines = !recipe && noteLines.length > 1
    const title = recipe?.title ?? (hasMultipleNoteLines ? 'Repas prévus' : (manualNote ?? 'Ajouter une recette'))
    const isRecipeSelected = Boolean(recipe)

    return (
      <ListItem
        key={cellKey}
        header={label}
        className={`${hasMultipleNoteLines ? 'items-start' : 'items-center'} ${isRecipeSelected ? 'cursor-pointer' : ''}`}
        title={
          isEditing ? null : (
            <span
              className={isRecipeSelected ? 'font-medium underline decoration-2 underline-offset-2' : undefined}
            >
              {title}
            </span>
          )
        }
        text={isEditing ? (
          <ListInput
            type="text"
            value={editingValue}
            placeholder="Entrez une recette"
            onChange={(event) => setEditingValue(event.target.value)}
            onBlur={() => {
              handleSaveManualNote(day.date, slot, editingValue)
            }}
            autoFocus
          />
        ) : hasMultipleNoteLines ? (
          <div className="mt-1 space-y-1 text-sm text-gray-600">
            {noteLines.slice(0, 4).map((line) => (
              <div key={`${cellKey}-${line}`} className="truncate">
                {line}
              </div>
            ))}
            {noteLines.length > 4 ? (
              <div className="text-xs text-gray-500">+{noteLines.length - 4} autre(s)</div>
            ) : null}
          </div>
        ) : null}
        after={
          <div className="flex w-18 justify-end gap-1">
            {hasSelectedMeal ? (
              <>
                <Button
                  clear
                  small
                  title="Ajouter au planning"
                  onClick={(event) => {
                    event.stopPropagation()
                    openSlotActions(day.date, slot)
                  }}
                >
                  <Plus size={18} />
                </Button>
                <Button
                  clear
                  small
                  className="text-red-600!"
                  title="Supprimer le repas"
                  disabled={removeMealMutation.isPending}
                  onClick={(event) => {
                    event.stopPropagation()
                    setEditingCell(null)
                    setEditingValue('')
                    removeMealMutation.mutate({ date: day.date, slot })
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              </>
            ) : (
              <Button
                clear
                small
                title="Ajouter au planning"
                onClick={(event) => {
                  event.stopPropagation()
                  openSlotActions(day.date, slot)
                }}
              >
                <Plus size={18} />
              </Button>
            )}
          </div>
        }
        onClick={async () => {
          if (isEditing) {
            return
          }

          if (recipe) {
            openMealRecipe(recipe)
            return
          }

          openSlotActions(day.date, slot)
        }}
      />
    )
  }

  return (
    <Page className="pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      <Navbar
          title="Planning"
          subtitle={subtitle}
          left={
            <Button clear small onClick={goToPreviousWeek} title="Semaine precedente">
              <ArrowLeftIcon size={30} />
            </Button>
          }
          right={
            <Button clear small onClick={goToNextWeek} title="Semaine suivante">
              <ArrowRightIcon size={30} />
            </Button>
          }
        />

        {mealPlanQuery.isLoading ? (
          <div>
            <Preloader />
            <span>Chargement du planning...</span>
          </div>
        ) : null}

        {mealPlanQuery.isError ? (
          <List inset strong>
            <ListItem title="Impossible de charger le planning" footer={mealPlanQuery.error?.message} />
          </List>
        ) : null}

        {mealPlanQuery.data ? (
          <>
            {days.map((day) => (
              <div key={day.date}>
                <BlockTitle>
                  {dayjs(day.date).format('dddd DD MMMM')}
                </BlockTitle>
                <List strongIos outlineIos>
                  {renderSlotItem(day, 'lunch', 'Midi')}
                  {renderSlotItem(day, 'dinner', 'Soir')}
                </List>
              </div>
            ))}
          </>
        ) : null}

        {assignMealMutation.isError ? (
          <List inset strong>
            <ListItem title="Erreur d'assignation" footer={assignMealMutation.error?.message} />
          </List>
        ) : null}

        {removeMealMutation.isError ? (
          <List inset strong>
            <ListItem title="Erreur de suppression" footer={removeMealMutation.error?.message} />
          </List>
        ) : null}

        <Sheet opened={Boolean(actionTarget)} onBackdropClick={closeSlotActions}>
          <div className="p-4">
            <div className="mb-3 text-base font-semibold text-sage-900">Ajouter dans cette case</div>
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={() => {
                  if (!actionTarget) return
                  const { date, slot } = actionTarget
                  closeSlotActions()
                  openRecipePicker(date, slot)
                }}
              >
                Ajouter une recette
              </Button>
              <Button
                tonal
                onClick={() => {
                  if (!actionTarget) return
                  const { date, slot } = actionTarget
                  closeSlotActions()
                  openRecipePicker(date, slot, { multi: true })
                }}
              >
                Ajouter plusieurs recettes
              </Button>
              <Button
                tonal
                onClick={() => {
                  if (!actionTarget) return
                  const { date, slot } = actionTarget
                  closeSlotActions()
                  startInlineEdit(date, slot, '')
                }}
              >
                Ajouter une note
              </Button>
            </div>
          </div>
        </Sheet>

      </Page>
    )
}
