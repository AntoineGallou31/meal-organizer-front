import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import {
  addItemToWeek,
  createTempId,
  findSlotItems,
  getMealPlanKey,
  getNextPosition,
  patchItemInWeek,
  removeItemFromWeek,
} from '../../lib/mealPlan'

const MUTATION_KEY = ['meal-plan']
// Permet de masquer les items dont la suppression est en vol (useMutationState)
export const REMOVE_MUTATION_KEY = ['meal-plan', 'remove']

// Un 404 veut dire que l'item est déjà supprimé : ce n'est pas un échec du retrait
async function deleteItem(id, options = {}) {
  try {
    await api.removeMealPlanItem({ id, ...options })
  } catch (error) {
    if (error?.status !== 404) throw error
  }
}

// Créations, modifications et suppressions d'items du planning, avec mise à jour
// optimiste du cache ['meal-plan', weekKey] et retour arrière ciblé en cas d'erreur.
export default function useMealPlanMutations({ onError } = {}) {
  const queryClient = useQueryClient()

  // Annule un rechargement en cours pour qu'il n'écrase pas la mise à jour optimiste
  const prepare = async (date) => {
    const queryKey = getMealPlanKey(date)
    await queryClient.cancelQueries({ queryKey })
    return queryKey
  }

  // Ne recharge qu'une fois la dernière mutation terminée : un rechargement
  // intermédiaire ferait disparaître les changements optimistes encore en vol
  const invalidateWhenIdle = () => {
    if (queryClient.isMutating({ mutationKey: MUTATION_KEY }) <= 1) {
      queryClient.invalidateQueries({ queryKey: ['meal-plan'] })
    }
  }

  const createMutation = useMutation({
    mutationKey: MUTATION_KEY,
    mutationFn: ({ tempItem }) =>
      api.createMealPlanItem({
        date: tempItem.date,
        slot: tempItem.slot,
        type: tempItem.type,
        recipeId: tempItem.recipeId ?? undefined,
        note: tempItem.note ?? undefined,
        position: tempItem.position,
      }),
    onMutate: async ({ tempItem }) => {
      const queryKey = await prepare(tempItem.date)
      queryClient.setQueryData(queryKey, (data) => addItemToWeek(data, tempItem))
    },
    onSuccess: (created, { tempItem }) => {
      queryClient.setQueryData(getMealPlanKey(tempItem.date), (data) =>
        patchItemInWeek(data, tempItem.id, { id: created.id, createdAt: created.createdAt ?? tempItem.createdAt }),
      )
    },
    onError: (error, { tempItem }) => {
      queryClient.setQueryData(getMealPlanKey(tempItem.date), (data) => removeItemFromWeek(data, tempItem.id))
      onError?.(error)
    },
    onSettled: invalidateWhenIdle,
  })

  const updateMutation = useMutation({
    mutationKey: MUTATION_KEY,
    mutationFn: ({ item, note }) => api.updateMealPlanItem(item.id, { note }),
    onMutate: async ({ item, note }) => {
      const queryKey = await prepare(item.date)
      queryClient.setQueryData(queryKey, (data) => patchItemInWeek(data, item.id, { note }))
    },
    onError: (error, { item }) => {
      queryClient.setQueryData(getMealPlanKey(item.date), (data) => patchItemInWeek(data, item.id, { note: item.note }))
      onError?.(error)
    },
    onSettled: invalidateWhenIdle,
  })

  const removeMutation = useMutation({
    mutationKey: REMOVE_MUTATION_KEY,
    mutationFn: ({ item }) => deleteItem(item.id),
    onMutate: async ({ item }) => {
      const queryKey = await prepare(item.date)
      queryClient.setQueryData(queryKey, (data) => removeItemFromWeek(data, item.id))
    },
    onError: (error, { item }) => {
      queryClient.setQueryData(getMealPlanKey(item.date), (data) => addItemToWeek(data, item))
      onError?.(error)
    },
    onSettled: invalidateWhenIdle,
  })

  // Ajoute une recette ou une note à la fin d'un créneau et renvoie l'id temporaire de l'item
  const addItem = ({ date, slot, type, recipe = null, note = null }) => {
    const items = findSlotItems(queryClient.getQueryData(getMealPlanKey(date)), date, slot)
    const tempItem = {
      id: createTempId(),
      date,
      slot,
      type,
      position: getNextPosition(items),
      recipeId: recipe?.id ?? null,
      note,
      recipe,
      createdAt: new Date().toISOString(),
    }
    createMutation.mutate({ tempItem })
    return tempItem.id
  }

  // Page masquée ou fermée : la requête part tout de suite, sans attendre onMutate,
  // et keepalive lui donne une chance d'aboutir après la fermeture
  const removeItemOnExit = (item, onDone) => {
    const queryKey = getMealPlanKey(item.date)
    queryClient.setQueryData(queryKey, (data) => removeItemFromWeek(data, item.id))
    deleteItem(item.id, { keepalive: true }).then(onDone, (error) => {
      queryClient.setQueryData(queryKey, (data) => addItemToWeek(data, item))
      onDone?.()
      onError?.(error)
    })
  }

  return {
    addItem,
    updateNote: (item, note) => updateMutation.mutate({ item, note }),
    removeItem: (item) => removeMutation.mutate({ item }),
    removeItemOnExit,
  }
}
