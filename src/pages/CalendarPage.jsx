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
import { getWeekDays, getWeekKey } from '../lib/week'

export default function CalendarPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const weekParam = searchParams.get('week')
  const [currentWeek, setCurrentWeek] = useState(() => (weekParam ? dayjs(weekParam) : dayjs()))
  const [editingSlot, setEditingSlot] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [atSuggestions, setAtSuggestions] = useState([])
  const [atPosition, setAtPosition] = useState(null)
  const [allRecipes, setAllRecipes] = useState([])

  const weekKey = getWeekKey(currentWeek)

  const mealPlanQuery = useQuery({
    queryKey: ['meal-plan', weekKey],
    queryFn: () => api.getMealPlan(weekKey),
    placeholderData: (previousData) => previousData,
  })

  const recipesQuery = useQuery({
    queryKey: ['recipes-all'],
    queryFn: () => api.getRecipesPage({ limit: 1000 }),
  })

  useEffect(() => {
    if (recipesQuery.data?.items) {
      setAllRecipes(recipesQuery.data.items)
    }
  }, [recipesQuery.data])

  const createMealPlanItemMutation = useMutation({
    mutationFn: api.createMealPlanItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plan', weekKey] })
      stopEditingSlot()
    },
  })

  const updateMealPlanItemMutation = useMutation({
    mutationFn: ({ id, payload }) => api.updateMealPlanItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plan', weekKey] })
      stopEditingSlot()
    },
    onError: (error, variables) => {
      // If the item is not found on the server (404), fallback to creating a new note
      if (error?.status === 404) {
        const { payload } = variables || {}
        // create a new note for the same date/slot
        if (editingSlot) {
          createMealPlanItemMutation.mutate({ date: editingSlot.date, slot: editingSlot.slot, type: payload?.type ?? 'note', note: payload?.note ?? '' })
        }
      }
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

  const subtitle = "Planning";

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

  const handleSaveNote = () => {
    if (!editingSlot || !editingText.trim()) return
    const payload = {
      note: editingText.trim(),
      type: 'note',
    }
    if (editingSlot.itemId) {
      updateMealPlanItemMutation.mutate({ id: editingSlot.itemId, payload })
    } else {
      createMealPlanItemMutation.mutate({ date: editingSlot.date, slot: editingSlot.slot, ...payload })
    }
  }

  const openMealRecipe = (recipe) => {
    if (!recipe?.id) return
    navigate(`/recipes/${recipe.id}`)
  }

  const getSlotItems = (day, slot) => {
    const list = slot === 'lunch' ? day.lunchItems : day.dinnerItems
    return Array.isArray(list) ? list : []
  }

  const startEditingSlot = (date, slot, existingItem = null) => {
    setEditingSlot({ date, slot, itemId: existingItem?.id ?? null })
    setEditingText(existingItem?.note ?? '')
    setAtSuggestions([])
    setAtPosition(null)
  }

  const stopEditingSlot = () => {
    setEditingSlot(null)
    setEditingText('')
    setAtSuggestions([])
    setAtPosition(null)
  }

  const handleNoteChange = (text) => {
    setEditingText(text)

    // Détecte @ et affiche les suggestions
    const lastAtIndex = text.lastIndexOf('@')
    if (lastAtIndex !== -1) {
      const afterAt = text.substring(lastAtIndex + 1)
      if (afterAt.includes('\n') || afterAt.includes(' ')) {
        setAtSuggestions([])
        setAtPosition(null)
      } else {
        const filtered = allRecipes.filter((recipe) =>
          recipe.title.toLowerCase().includes(afterAt.toLowerCase())
        )
        setAtSuggestions(filtered)
        setAtPosition(lastAtIndex)
      }
    } else {
      setAtSuggestions([])
      setAtPosition(null)
    }
  }

  const insertRecipe = (recipe) => {
    if (atPosition === null) return

    const before = editingText.substring(0, atPosition)
    const after = editingText.substring(editingText.indexOf('@', atPosition) + 1)
    const newText = `${before}[@${recipe.title}|${recipe.id}] ${after}`
    setEditingText(newText)
    setAtSuggestions([])
    setAtPosition(null)
  }

  const handleAddRecipe = (recipe) => {
    if (!editingSlot) return
    createMealPlanItemMutation.mutate({
      date: editingSlot.date,
      slot: editingSlot.slot,
      type: 'recipe',
      recipeId: recipe.id,
    })
  }

  const parseNoteContent = (text) => {
    // Parse le format [@nom|id] et retourne un array d'éléments
    const parts = []
    const regex = /\[@([^\]|]+)\|([^\]]+)\]/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(text)) !== null) {
      // Ajoute le texte avant le match
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) })
      }
      // Ajoute la recette
      parts.push({ type: 'recipe', name: match[1], id: match[2] })
      lastIndex = regex.lastIndex
    }

    // Ajoute le texte restant
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) })
    }

    return parts.length > 0 ? parts : [{ type: 'text', content: text }]
  }

  const renderNoteContent = (text) => {
    const parts = parseNoteContent(text)
    return (
      <span>
        {parts.map((part, idx) => {
          if (part.type === 'text') {
            return <span key={idx}>{part.content}</span>
          } else if (part.type === 'recipe') {
            return (
              <span
                key={idx}
                className="font-medium underline decoration-2 underline-offset-2 cursor-pointer text-orange-600 hover:opacity-70"
                onClick={(e) => {
                  e.stopPropagation()
                  // On cherche la recette dans allRecipes
                  const recipe = allRecipes.find((r) => r.id === part.id)
                  if (recipe) {
                    openMealRecipe(recipe)
                  }
                }}
              >
                {part.name}
              </span>
            )
          }
        })}
      </span>
    )
  }

  const renderMealCard = (day, slot, label) => {
    const slotItems = getSlotItems(day, slot)
    const cellKey = getCellKey(day.date, slot)
    const isEditing = editingSlot?.date === day.date && editingSlot?.slot === slot

    return (
      <div key={cellKey} className="mb-2 px-2">
        {/* Sous-titre du repas à gauche */}
        <h3 className="text-left font-medium text-sm mb-1 text-sage-700">{label}</h3>

        {/* Card du repas */}
        <div className="border border-sage-200 rounded-lg overflow-hidden bg-white">
          {isEditing ? (
            // Mode édition
            <div className="p-4 space-y-3">
              {/* Textarea */}
              <textarea
                autoFocus
                className="w-full p-2 border border-sage-200 rounded text-sm font-normal resize-none focus:outline-none focus:ring-2 focus:ring-sage-300"
                placeholder="Ajoutez une note ou tapez @ pour une recette..."
                rows={3}
                value={editingText}
                onChange={(e) => handleNoteChange(e.target.value)}
              />

              {/* Suggestions @ */}
              {atSuggestions.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-sage-200 rounded bg-white shadow-lg">
                  {atSuggestions.map((recipe) => (
                    <button
                      key={recipe.id}
                      className="w-full text-left px-3 py-2 hover:bg-sage-100 text-sm border-b border-sage-100 last:border-b-0"
                      onClick={() => insertRecipe(recipe)}
                    >
                      {recipe.title}
                    </button>
                  ))}
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex gap-2">
                <Button
                  tonal
                  small
                  className="flex-1"
                  onClick={stopEditingSlot}
                >
                  Annuler
                </Button>
                <Button
                  small
                  className="flex-1"
                  disabled={(createMealPlanItemMutation.isPending || updateMealPlanItemMutation.isPending) || !editingText.trim()}
                  onClick={handleSaveNote}
                >
                  {(createMealPlanItemMutation.isPending || updateMealPlanItemMutation.isPending) ? 'Enregistrement...' : 'Ajouter'}
                </Button>
                <Button
                  small
                  title="Ajouter une recette"
                  onClick={() => {
                    if (!editingSlot) return
                    const params = new URLSearchParams({
                      mode: 'select',
                      date: editingSlot.date,
                      slot: editingSlot.slot,
                    })
                    setSearchParams({ week: currentWeek.format('YYYY-MM-DD') }, { replace: true })
                    navigate(`/recipes?${params.toString()}`)
                  }}
                >
                  <Plus size={18} />
                </Button>
              </div>
            </div>
          ) : (
            // Mode affichage : on n'autorise qu'une note par créneau
            <div className="p-4">
              {(() => {
                const noteItem = slotItems.find((it) => it.type === 'note')
                const recipeItems = slotItems.filter((it) => it.type === 'recipe')

                return (
                  <div className="space-y-3">
                    {recipeItems.length > 0 && (
                      <div className="space-y-2">
                        {recipeItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-2 p-2 rounded bg-sage-50">
                            <div className="flex-1 text-sm">
                              <span
                                className="font-medium underline decoration-2 underline-offset-2 cursor-pointer hover:opacity-70 text-orange-600"
                                onClick={() => openMealRecipe(item.recipe)}
                              >
                                {item.recipe?.title}
                              </span>
                            </div>
                            <Button
                              clear
                              small
                              className="text-red-600"
                              title="Supprimer"
                              disabled={removeMealPlanItemMutation.isPending}
                              onClick={(e) => {
                                e.stopPropagation()
                                removeMealPlanItemMutation.mutate({ id: item.id })
                              }}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Note unique */}
                    {noteItem ? (
                      <div
                        className="p-4 border border-sage-100 rounded hover:bg-sage-50 cursor-pointer"
                        onClick={() => startEditingSlot(day.date, slot, noteItem)}
                      >
                        <div className="text-sm text-sage-800">{renderNoteContent(noteItem.note)}</div>
                        <div className="mt-2 flex justify-end">
                          <Button
                            clear
                            small
                            className="text-red-600"
                            title="Supprimer la note"
                            disabled={removeMealPlanItemMutation.isPending}
                            onClick={(e) => {
                              e.stopPropagation()
                              removeMealPlanItemMutation.mutate({ id: noteItem.id })
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="w-full p-4 text-center text-sm text-sage-600 hover:bg-sage-50 rounded"
                        onClick={() => startEditingSlot(day.date, slot)}
                      >
                        + Ajouter une note ou une recette
                      </button>
                    )}
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Page>
      <Navbar
          title={subtitle}
          left={
            <Button clear small onClick={goToPreviousWeek} title="Semaine precedente">
              <ArrowLeftIcon size={26} />
            </Button>
          }
          right={
            <Button clear small onClick={goToNextWeek} title="Semaine suivante">
              <ArrowRightIcon size={26} />
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
              <div key={day.date} className="mb-4">
                {/* Titre du jour centré */}
                <div className="text-center mt-2">
                  <h2 className="text-lg font-semibold text-sage-900">
                    {dayjs(day.date).format('dddd DD MMMM')}
                  </h2>
                </div>
                
                {/* Cards pour chaque repas */}
                {renderMealCard(day, 'lunch', 'Midi')}
                {renderMealCard(day, 'dinner', 'Soir')}
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

      </Page>
    )
}
