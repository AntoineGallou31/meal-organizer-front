import { useEffect, useMemo, useState } from 'react'
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
} from '../components/ui'
import { api } from '../lib/api'
import { getWeekDays, getWeekKey, formatWeekLabel } from '../lib/week'

export default function CalendarPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const weekParam = searchParams.get('week')
  const [currentWeek, setCurrentWeek] = useState(() => (weekParam ? dayjs(weekParam) : dayjs()))
  const [actionTarget, setActionTarget] = useState(null)
  const [noteTarget, setNoteTarget] = useState(null)
  const [noteValue, setNoteValue] = useState('')

  const weekKey = getWeekKey(currentWeek)

  const mealPlanQuery = useQuery({
    queryKey: ['meal-plan', weekKey],
    queryFn: () => api.getMealPlan(weekKey),
    placeholderData: (previousData) => previousData,
  })

  const createMealPlanItemMutation = useMutation({
    mutationFn: api.createMealPlanItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plan', weekKey] })
      setNoteTarget(null)
      setNoteValue('')
    },
  })

  const removeMealPlanItemMutation = useMutation({
    mutationFn: api.removeMealPlanItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plan', weekKey] })
    },
  })

  const clearMealSlotMutation = useMutation({
    mutationFn: api.clearMealSlot,
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

  useEffect(() => {
    const nextWeekValue = currentWeek.format('YYYY-MM-DD')
    if (weekParam === nextWeekValue) return
    setSearchParams({ week: nextWeekValue }, { replace: true })
  }, [currentWeek, weekParam, setSearchParams])

  const getCellKey = (date, slot) => `${date}-${slot}`

  const handleSaveNote = (date, slot, text) => {
    const normalizedText = text.trim()
    if (!normalizedText) {
      setNoteTarget(null)
      setNoteValue('')
      return
    }
    createMealPlanItemMutation.mutate({ date, slot, type: 'note', note: normalizedText })
  }

  const openRecipePicker = (date, slot) => {
    const params = new URLSearchParams({
      mode: 'select',
      date,
      slot,
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

  const openNoteEditor = (date, slot) => {
    setNoteTarget({ date, slot })
    setNoteValue('')
  }

  const closeNoteEditor = () => {
    setNoteTarget(null)
    setNoteValue('')
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

  const getSlotItems = (day, slot) => {
    const list = slot === 'lunch' ? day.lunchItems : day.dinnerItems
    return Array.isArray(list) ? list : []
  }

  const renderSlotItem = (day, slot, label) => {
    const slotItems = getSlotItems(day, slot)
    const cellKey = getCellKey(day.date, slot)

    return (
      <>
        <ListItem
          key={cellKey}
          header={label}
          title={slotItems.length > 0 ? `${slotItems.length} élément(s)` : 'Aucun élément'}
          text={slotItems.length > 0 ? 'Touchez un élément pour voir le détail.' : 'Ajoutez une recette ou une note.'}
          after={
            <div className="flex w-18 justify-end gap-1">
              <Button
                clear
                small
                title="Ajouter au planning"
                onClick={(event) => {
                  event.stopPropagation()
                  openSlotActions(day.date, slot)
                }}
              >
                <Plus size={30} />
              </Button>
              {slotItems.length > 0 ? (
                <Button
                  clear
                  small
                  className="text-red-600"
                  title="Vider le créneau"
                  disabled={clearMealSlotMutation.isPending}
                  onClick={(event) => {
                    event.stopPropagation()
                    clearMealSlotMutation.mutate({ date: day.date, slot })
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              ) : null}
            </div>
          }
          onClick={() => openSlotActions(day.date, slot)}
        />

        {slotItems.map((item) => {
          const isRecipeItem = item.type === 'recipe' && item.recipe
          const itemTitle = isRecipeItem
            ? item.recipe.title
            : (item.note || 'Note')

          return (
            <ListItem
              key={item.id}
              className={isRecipeItem ? 'cursor-pointer' : ''}
              title={
                <span className={isRecipeItem ? 'font-medium underline decoration-2 underline-offset-2' : undefined}>
                  {itemTitle}
                </span>
              }
              text={item.type === 'note' ? 'Note' : 'Recette'}
              after={
                <Button
                  clear
                  small
                  className="text-red-600"
                  title="Supprimer cet élément"
                  disabled={removeMealPlanItemMutation.isPending}
                  onClick={(event) => {
                    event.stopPropagation()
                    removeMealPlanItemMutation.mutate({ id: item.id })
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              }
              onClick={() => {
                if (isRecipeItem) {
                  openMealRecipe(item.recipe)
                }
              }}
            />
          )
        })}
      </>
    )
  }

  return (
    <Page className="pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      <Navbar
          title={subtitle}
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

        {createMealPlanItemMutation.isError ? (
          <List inset strong>
            <ListItem title="Erreur d'ajout" footer={createMealPlanItemMutation.error?.message} />
          </List>
        ) : null}

        {removeMealPlanItemMutation.isError ? (
          <List inset strong>
            <ListItem title="Erreur de suppression" footer={removeMealPlanItemMutation.error?.message} />
          </List>
        ) : null}

        {clearMealSlotMutation.isError ? (
          <List inset strong>
            <ListItem title="Erreur de suppression" footer={clearMealSlotMutation.error?.message} />
          </List>
        ) : null}

        <Sheet
          opened={Boolean(actionTarget)}
          onBackdropClick={closeSlotActions}
        >
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
                  openNoteEditor(date, slot)
                }}
              >
                Ajouter une note
              </Button>
            </div>
          </div>
        </Sheet>

        <Sheet
          opened={Boolean(noteTarget)}
          onBackdropClick={closeNoteEditor}
        >
          <div className="p-4">
            <div className="mb-3 text-base font-semibold text-sage-900">Ajouter une note</div>
            <List strongIos outlineIos>
              <ListInput
                type="textarea"
                placeholder="Ex: soupe maison + salade"
                value={noteValue}
                onChange={(event) => setNoteValue(event.target.value)}
              />
            </List>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button tonal onClick={closeNoteEditor}>Annuler</Button>
              <Button
                disabled={createMealPlanItemMutation.isPending || !noteTarget}
                onClick={() => {
                  if (!noteTarget) return
                  handleSaveNote(noteTarget.date, noteTarget.slot, noteValue)
                }}
              >
                {createMealPlanItemMutation.isPending ? 'Ajout...' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </Sheet>

      </Page>
    )
}
