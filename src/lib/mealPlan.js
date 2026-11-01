import dayjs from 'dayjs'
import { api } from './api'
import { getWeekKey } from './week'

export const SLOTS = [
  { key: 'lunch', label: 'Midi' },
  { key: 'dinner', label: 'Soir' },
]

export const MEALS_PER_WEEK = 14

export function isSlotKey(value) {
  return SLOTS.some((slot) => slot.key === value)
}

export function getSlotLabel(slot) {
  return SLOTS.find((candidate) => candidate.key === slot)?.label ?? ''
}

// L'API renvoie soit un tableau de jours, soit { days: [...] }
export function getDaysList(data) {
  if (Array.isArray(data)) return data
  return Array.isArray(data?.days) ? data.days : []
}

export function getSlotItems(day, slot) {
  const list = slot === 'lunch' ? day?.lunchItems : day?.dinnerItems
  return Array.isArray(list) ? list : []
}

// Associe les items du planning aux 7 jours de la semaine affichée
export function buildWeek(weekDays, data) {
  const daysByDate = new Map(getDaysList(data).map((day) => [day.date, day]))

  return weekDays.map((day) => {
    const apiDay = daysByDate.get(day.date)
    return {
      ...day,
      lunchItems: getSlotItems(apiDay, 'lunch'),
      dinnerItems: getSlotItems(apiDay, 'dinner'),
    }
  })
}

export function countPlannedMeals(days) {
  return days.reduce(
    (total, day) => total + SLOTS.filter((slot) => getSlotItems(day, slot.key).length > 0).length,
    0,
  )
}

export function splitItems(items) {
  return {
    recipes: items.filter((item) => item.type === 'recipe'),
    notes: items.filter((item) => item.type === 'note'),
  }
}

export function getItemLabel(item) {
  if (item.type === 'note') return item.note ?? ''
  return item.recipe?.title ?? 'Recette'
}

// "35 min · Soupes", sans les parties inconnues
export function formatRecipeMeta(recipe) {
  return [recipe?.prepTime ? `${recipe.prepTime} min` : null, recipe?.category]
    .filter(Boolean)
    .join(' · ')
}

export function getMealPlanKey(dateOrWeek) {
  return ['meal-plan', getWeekKey(dateOrWeek)]
}

export function mealPlanQueryOptions(date) {
  const queryKey = getMealPlanKey(date)
  return {
    queryKey,
    queryFn: () => api.getMealPlan(queryKey[1]),
  }
}

let tempCounter = 0

// Identifiant des items créés de façon optimiste, en attendant la réponse du serveur
export function createTempId() {
  tempCounter += 1
  return `temp-${Date.now()}-${tempCounter}`
}

export function isPendingItem(item) {
  return String(item?.id ?? '').startsWith('temp-')
}

// Position d'un nouvel item en fin de créneau. Le backend place les items sans
// position après les autres (par date de création) : s'il y en a dans le
// créneau, on n'en envoie pas non plus pour que le nouvel item reste à la fin.
export function getNextPosition(items) {
  if (items.some((item) => !Number.isInteger(item.position))) return null
  return items.reduce((max, item) => Math.max(max, item.position), -1) + 1
}

// Même ordre que le backend : position, puis date de création
function sortSlotItems(items) {
  const rank = (item) => (Number.isInteger(item.position) ? item.position : Number.MAX_SAFE_INTEGER)
  const created = (item) => (item.createdAt ? Date.parse(item.createdAt) : 0)
  return [...items].sort((a, b) => rank(a) - rank(b) || created(a) - created(b))
}

const SLOT_FIELDS = { lunch: 'lunchItems', dinner: 'dinnerItems' }

function mapWeekDays(data, mapDay) {
  if (!data) return data
  if (Array.isArray(data)) return data.map(mapDay)
  return { ...data, days: getDaysList(data).map(mapDay) }
}

function mapAllItems(data, mapItems) {
  return mapWeekDays(data, (day) => ({
    ...day,
    lunchItems: mapItems(getSlotItems(day, 'lunch')),
    dinnerItems: mapItems(getSlotItems(day, 'dinner')),
  }))
}

export function findSlotItems(data, date, slot) {
  return getSlotItems(getDaysList(data).find((day) => day.date === date), slot)
}

export function addItemToWeek(data, item) {
  return mapWeekDays(data, (day) =>
    day.date === item.date
      ? { ...day, [SLOT_FIELDS[item.slot]]: sortSlotItems([...getSlotItems(day, item.slot), item]) }
      : day,
  )
}

export function removeItemFromWeek(data, id) {
  return mapAllItems(data, (items) => items.filter((item) => item.id !== id))
}

export function patchItemInWeek(data, id, patch) {
  return mapAllItems(data, (items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
}

// "mercredi 4"
export function formatDayShort(date) {
  return dayjs(date).format('dddd D')
}

// "Mardi 3 novembre"
export function formatDayLong(date) {
  const label = dayjs(date).format('dddd D MMMM')
  return label.charAt(0).toUpperCase() + label.slice(1)
}
