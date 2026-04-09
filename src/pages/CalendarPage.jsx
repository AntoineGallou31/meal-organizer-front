import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'
import {
  Block,
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
  const [currentWeek, setCurrentWeek] = useState(dayjs())
  const [editingCell, setEditingCell] = useState(null)
  const [editingValue, setEditingValue] = useState('')
  const [recipePickerCell, setRecipePickerCell] = useState(null)

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
      setEditingCell(null)
      setEditingValue('')
      setRecipePickerCell(null)
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
    setCurrentWeek((prev) => prev.subtract(1, 'week'))
  }

  const goToNextWeek = () => {
    setCurrentWeek((prev) => prev.add(1, 'week'))
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

  const openRecipePicker = (date, slot) => {
    setRecipePickerCell({ date, slot })
  }

  const closeRecipePicker = () => {
    setRecipePickerCell(null)
  }

  const handlePickRecipe = (recipe) => {
    if (!recipePickerCell) return

    assignMealMutation.mutate({
      date: recipePickerCell.date,
      slot: recipePickerCell.slot,
      recipeId: recipe.id,
    })
  }

  const renderSlotItem = (day, slot, label) => {
    const recipe = slot === 'lunch' ? day.lunch : day.dinner
    const manualNote = slot === 'lunch' ? day.lunchManualText : day.dinnerManualText
    const cellKey = getCellKey(day.date, slot)
    const isEditing = editingCell === cellKey
    const title = recipe?.title ?? manualNote ?? 'Ajouter une note'

    return (
      <ListItem
        key={cellKey}
        header={label}
        title={isEditing ? null : title}
        text={isEditing ? (
          <ListInput
            type="text"
            value={editingValue}
            placeholder="Entrez un plat"
            onChange={(event) => setEditingValue(event.target.value)}
            onBlur={() => {
              handleSaveManualNote(day.date, slot, editingValue)
            }}
            inputClassName="w-full text-[14px] py-1"
            autoFocus
          />
        ) : null}
        after={isEditing ? (
          <Button
            small
            tonal
            onClick={(event) => {
              event.stopPropagation()
              openRecipePicker(day.date, slot)
            }}
          >
            Ajouter une recette
          </Button>
        ) : 'Editer'}
        onClick={() => {
          if (isEditing) {
            return
          }
          startInlineEdit(day.date, slot, recipe?.title ?? manualNote ?? '')
        }}
      />
    )
  }

  return (
    <div className="relative h-[100dvh] overflow-hidden">
      <Page className="page-enter pb-24 pt-1">
        <Navbar
          title="Planning"
          subtitle={subtitle}
          left={
            <Button clear small onClick={goToPreviousWeek} title="Semaine precedente">
              <ChevronLeft size={20} />
            </Button>
          }
          right={
            <Button clear small onClick={goToNextWeek} title="Semaine suivante">
              <ChevronRight size={20} />
            </Button>
          }
        />

        {mealPlanQuery.isLoading ? (
          <Block className="flex items-center gap-1.5 py-1">
            <Preloader size={20} />
            <span className="text-[13px]">Chargement du planning...</span>
          </Block>
        ) : null}

        {mealPlanQuery.isError ? (
          <List inset strong className="my-2">
            <ListItem title="Impossible de charger le planning" footer={mealPlanQuery.error?.message} />
          </List>
        ) : null}

        {mealPlanQuery.data ? (
          <>
            {days.map((day) => (
              <Block key={day.date} className="mb-2">
                <div className="mb-1 px-1 text-[12px] font-semibold uppercase tracking-wide text-sage-700">
                  {dayjs(day.date).format('dddd DD MMMM')}
                </div>
                <List strongIos outlineIos className="my-0 space-y-0">
                  {renderSlotItem(day, 'lunch', 'Midi')}
                  {renderSlotItem(day, 'dinner', 'Soir')}
                </List>
              </Block>
            ))}
          </>
        ) : null}

        {assignMealMutation.isError ? (
          <List inset strong className="my-2">
            <ListItem title="Erreur d'assignation" footer={assignMealMutation.error?.message} />
          </List>
        ) : null}

        {removeMealMutation.isError ? (
          <List inset strong className="my-2">
            <ListItem title="Erreur de suppression" footer={removeMealMutation.error?.message} />
          </List>
        ) : null}

        <Sheet opened={Boolean(recipePickerCell)} onBackdropClick={closeRecipePicker}>
          <Block className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold">Ajouter une recette</div>
                <div className="text-xs text-sage-700">Choisir une recette pour remplacer la note</div>
              </div>
              <Button clear small onClick={closeRecipePicker}>Fermer</Button>
            </div>
            {recipesQuery.isLoading || assignMealMutation.isPending ? (
              <div className="flex items-center gap-2 py-1">
                <Preloader size={16} />
                <span className="text-[13px]">Chargement des recettes...</span>
              </div>
            ) : null}
            {recipesQuery.isError ? (
              <List strongIos outlineIos className="my-0">
                <ListItem title="Impossible de charger les recettes" />
              </List>
            ) : null}
            {recipesQuery.data ? (
              <List strongIos outlineIos className="my-0 space-y-0">
                {recipesQuery.data.map((recipe) => (
                  <ListItem
                    key={recipe.id}
                    title={recipe.title}
                    text={recipe.prepTime ? `${recipe.prepTime} min` : null}
                    link
                    onClick={() => handlePickRecipe(recipe)}
                  />
                ))}
              </List>
            ) : null}
          </Block>
        </Sheet>

      </Page>
    </div>
  )
}
