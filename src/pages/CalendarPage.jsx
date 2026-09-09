import { useEffect, useMemo, useRef, useState } from 'react'
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
import NoteEditor from '../components/NoteEditor'

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
  const todayRef = useRef(null)

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

  useEffect(() => {
    if (mealPlanQuery.data && todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [mealPlanQuery.data])

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

  const handleSaveNote = (slotOverride, textOverride) => {
    const slot = slotOverride ?? editingSlot
    const text = textOverride ?? editingText
    if (!slot || !text.trim()) return
    const payload = {
      note: text.trim(),
      type: 'note',
    }
    if (slot.itemId) {
      updateMealPlanItemMutation.mutate({ id: slot.itemId, payload })
    } else {
      createMealPlanItemMutation.mutate({ date: slot.date, slot: slot.slot, ...payload })
    }
  }

  const handleNoteBlur = () => {
    if (editingText.trim()) {
      handleSaveNote()
    } else if (editingSlot?.itemId) {
      removeMealPlanItemMutation.mutate({ id: editingSlot.itemId })
      stopEditingSlot()
    } else {
      stopEditingSlot()
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
      if (afterAt.includes('\n')) {
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

  const insertRecipe = async (recipe) => {
    if (atPosition === null || !editingSlot) return

    // Remove the "@partial" text that triggered the suggestion, and add the
    // recipe as its own meal-plan item instead of inlining it in the note.
    const before = editingText.substring(0, atPosition)
    const afterAt = editingText.substring(atPosition + 1)
    const newlineIndex = afterAt.indexOf('\n')
    const searchLength = newlineIndex === -1 ? afterAt.length : newlineIndex
    const after = afterAt.substring(searchLength)
    const remainingText = `${before}${after}`.trim()
    setEditingText(remainingText)
    setAtSuggestions([])
    setAtPosition(null)

    const slot = editingSlot

    await createMealPlanItemMutation.mutateAsync({
      date: slot.date,
      slot: slot.slot,
      type: 'recipe',
      recipeId: recipe.id,
    })

    if (remainingText) {
      if (slot.itemId) {
        await updateMealPlanItemMutation.mutateAsync({ id: slot.itemId, payload: { note: remainingText, type: 'note' } })
      } else {
        await createMealPlanItemMutation.mutateAsync({ date: slot.date, slot: slot.slot, note: remainingText, type: 'note' })
      }
    } else {
      stopEditingSlot()
    }
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
            const recipe = allRecipes.find((r) => r.id === part.id)
            return (
              <span
                key={idx}
                className="inline-flex items-center gap-1 align-middle font-medium underline decoration-2 underline-offset-2 cursor-pointer text-orange-600 hover:opacity-70"
                onClick={(e) => {
                  e.stopPropagation()
                  if (recipe) {
                    openMealRecipe(recipe)
                  }
                }}
              >
                {recipe?.imageUrl && (
                  <img
                    src={recipe.imageUrl}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover shrink-0"
                  />
                )}
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
        <h3 className="text-left text-xs mb-1 text-sage-700">{label}</h3>

        {/* Card du repas */}
        <div className="border border-sage-200 rounded-lg overflow-hidden bg-white">
          {isEditing ? (
            // Mode édition
            <div className="p-2 space-y-1">
              <NoteEditor
                autoFocus
                placeholder="Ajoutez une note ou tapez @ pour une recette..."
                value={editingText}
                onChange={handleNoteChange}
                onBlur={handleNoteBlur}
              />

              {/* Suggestions @ */}
              {atSuggestions.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-sage-200 rounded bg-white shadow-lg">
                  {atSuggestions.map((recipe) => (
                    <button
                      key={recipe.id}
                      className="w-full text-left px-3 py-2 hover:bg-sage-100 text-sm border-b border-sage-100 last:border-b-0"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertRecipe(recipe)}
                    >
                      {recipe.title}
                    </button>
                  ))}
                </div>
              )}

              {/* Bouton recette */}
              <div className="flex justify-end">
                <Button
                  small
                  title="Ajouter une recette"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (!editingSlot) return
                    if (editingText.trim()) {
                      handleSaveNote()
                    }
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
            <div className="p-2">
              {(() => {
                const noteItem = slotItems.find((it) => it.type === 'note')
                const recipeItems = slotItems.filter((it) => it.type === 'recipe')

                return (
                  <div className="space-y-3">
                    {recipeItems.length > 0 && (
                      <div className="space-y-2">
                        {recipeItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-2 p-2 rounded bg-sage-50">
                            <div className="flex-1 flex items-center gap-1.5 text-sm">
                              {item.recipe?.imageUrl && (
                                <img
                                  src={item.recipe.imageUrl}
                                  alt=""
                                  className="w-5 h-5 rounded-full object-cover shrink-0"
                                />
                              )}
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
                        className="p-2 hover:bg-sage-50 cursor-pointer"
                        onClick={() => startEditingSlot(day.date, slot, noteItem)}
                      >
                        <div className="text-sm text-sage-800">{renderNoteContent(noteItem.note)}</div>
                      </div>
                    ) : (
                      <button
                        className="w-full p-2 text-center text-sm text-gray-400 hover:bg-sage-50 rounded"
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

        {(createMealPlanItemMutation.isPending || updateMealPlanItemMutation.isPending || removeMealPlanItemMutation.isPending) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60">
            <Preloader size={36} />
          </div>
        )}

        {mealPlanQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-gray-600">
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
            {days.map((day) => {
              const isToday = dayjs(day.date).isSame(dayjs(), 'day')
              return (
              <div key={day.date} ref={isToday ? todayRef : null}>
                {/* Titre du jour centré */}
                <div className="text-center">
                  <h2 className={`text-sm font-semibold ${isToday ? 'text-terracotta-500' : 'text-sage-900'}`}>
                    {dayjs(day.date).format('dddd DD MMMM')}
                  </h2>
                </div>
                
                {/* Cards pour chaque repas */}
                {renderMealCard(day, 'lunch', 'Midi')}
                {renderMealCard(day, 'dinner', 'Soir')}
              </div>
              )
            })}
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
