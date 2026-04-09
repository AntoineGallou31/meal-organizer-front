import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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

  const weekKey = getWeekKey(currentWeek)

  const mealPlanQuery = useQuery({
    queryKey: ['meal-plan', weekKey],
    queryFn: () => api.getMealPlan(weekKey),
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

  const openRecipePicker = (date, slot) => {
    setSearchParams({ week: currentWeek.format('YYYY-MM-DD') }, { replace: true })
    navigate(`/recipes?mode=select&date=${encodeURIComponent(date)}&slot=${encodeURIComponent(slot)}`)
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
    <Page>
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

      </Page>
    )
}
