import dayjs from 'dayjs'

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

// "mercredi 4"
export function formatDayShort(date) {
  return dayjs(date).format('dddd D')
}

// "Mardi 3 novembre"
export function formatDayLong(date) {
  const label = dayjs(date).format('dddd D MMMM')
  return label.charAt(0).toUpperCase() + label.slice(1)
}
