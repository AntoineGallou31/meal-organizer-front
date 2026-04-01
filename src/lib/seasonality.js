// Mapping of ingredients to seasons (French calendar)
// Seasons: 'spring' (Mar-May), 'summer' (June-Aug), 'autumn' (Sept-Nov), 'winter' (Dec-Feb)

const INGREDIENT_SEASONS = {
  // Vegetables
  'asperge': ['spring'],
  'brocoli': ['spring', 'autumn', 'winter'],
  'chou': ['spring', 'autumn', 'winter'],
  'chou-fleur': ['spring', 'autumn', 'winter'],
  'épinard': ['spring', 'autumn', 'winter'],
  'pois': ['spring', 'summer'],
  'laitue': ['spring', 'summer'],
  'roquette': ['spring', 'summer'],
  'radis': ['spring', 'summer'],
  'courgette': ['summer', 'autumn'],
  'tomate': ['summer', 'autumn'],
  'aubergine': ['summer', 'autumn'],
  'poivron': ['summer', 'autumn'],
  'concombre': ['summer'],
  'haricot': ['summer', 'autumn'],
  'maïs': ['summer', 'autumn'],
  'courge': ['autumn', 'winter'],
  'citrouille': ['autumn', 'winter'],
  'carotte': ['autumn', 'winter'],
  'betterave': ['autumn', 'winter'],
  'champignon': ['spring', 'autumn', 'winter'],
  'poireau': ['autumn', 'winter'],
  'endive': ['winter'],
  'navet': ['autumn', 'winter'],
  'oignon': ['autumn', 'winter'],
  'ail': ['summer', 'autumn'],
  'échalote': ['autumn', 'winter'],

  // Fruits
  'fraise': ['spring', 'summer'],
  'rhubarbe': ['spring'],
  'cerise': ['summer'],
  'abricot': ['summer'],
  'pêche': ['summer'],
  'nectarine': ['summer'],
  'melon': ['summer'],
  'pastèque': ['summer'],
  'framboise': ['summer'],
  'myrtille': ['summer'],
  'mûre': ['summer', 'autumn'],
  'cassis': ['summer'],
  'raisin': ['autumn'],
  'pomme': ['autumn', 'winter'],
  'poire': ['autumn', 'winter'],
  'figue': ['autumn'],
  'noix': ['autumn', 'winter'],
  'amande': ['autumn'],
  'châtaigne': ['autumn', 'winter'],
  'kiwi': ['winter', 'spring'],
  'grenade': ['autumn', 'winter'],
  'clémentine': ['winter'],
  'mandarine': ['winter'],
  'citron': ['winter'],
  'orange': ['winter'],
  'pamplemousse': ['winter'],
}

export const MEAL_TYPES = [
  { id: 'appetizer', label: 'Entrée', color: 'sage' },
  { id: 'main', label: 'Plat principal', color: 'terracotta' },
  { id: 'dessert', label: 'Dessert', color: 'blue' },
  { id: 'soup', label: 'Soupe', color: 'green' },
  { id: 'salad', label: 'Salade', color: 'cyan' },
  { id: 'sauce', label: 'Sauce/Condiment', color: 'amber' },
  { id: 'other', label: 'Autre', color: 'gray' },
]

export const SEASONS = [
  { id: 'spring', label: 'Printemps (Mar-Mai)', value: 'spring' },
  { id: 'summer', label: 'Été (Juin-Août)', value: 'summer' },
  { id: 'autumn', label: 'Automne (Sept-Nov)', value: 'autumn' },
  { id: 'winter', label: 'Hiver (Déc-Fév)', value: 'winter' },
]

export function getSeasonForMonth(month) {
  // month is 1-12
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter' // 12, 1, 2
}

export function getCurrentSeason() {
  const month = new Date().getMonth() + 1
  return getSeasonForMonth(month)
}

export function normalizeIngredient(ingredient) {
  return ingredient
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
}

export function getIngredientsSeasons(ingredients) {
  if (!Array.isArray(ingredients)) return []

  const seasonsSet = new Set()

  ingredients.forEach((ingredient) => {
    const normalized = normalizeIngredient(ingredient)

    // Exact match
    if (INGREDIENT_SEASONS[normalized]) {
      INGREDIENT_SEASONS[normalized].forEach((s) => seasonsSet.add(s))
      return
    }

    // Partial match (check if any key is a substring)
    for (const [key, seasons] of Object.entries(INGREDIENT_SEASONS)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        seasons.forEach((s) => seasonsSet.add(s))
        break
      }
    }
  })

  return Array.from(seasonsSet)
}

export function hasIngredientsInSeason(ingredients, season) {
  const seasons = getIngredientsSeasons(ingredients)
  return seasons.includes(season)
}

export function getCommonSeasons(ingredients) {
  const allSeasons = getIngredientsSeasons(ingredients)
  return allSeasons.length > 0 ? allSeasons : ['spring', 'summer', 'autumn', 'winter']
}
