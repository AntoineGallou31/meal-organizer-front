import { getCurrentMonth } from './seasonality'

export const RECIPES_PAGE_SIZE = 10

// Texte comparable : sans accents, en minuscules
export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

// La catégorie « A completer » est reconnue par son nom, sans tenir compte des accents ni de la casse
export function isIncompleteCategory(category) {
  return normalizeText(category?.name) === 'a completer'
}

export function findIncompleteCategory(categories) {
  return (categories ?? []).find(isIncompleteCategory) ?? null
}

// Dossiers de la page Recettes : catégories non vides, sans « A completer » (déjà en raccourci)
export function getVisibleFolders(categories, sort = 'filled') {
  const byName = (a, b) => String(a.name).localeCompare(String(b.name), 'fr', { sensitivity: 'base' })
  const byCount = (a, b) => b.recipe_count - a.recipe_count || byName(a, b)

  return (categories ?? [])
    .filter((category) => category.recipe_count > 0 && !isIncompleteCategory(category))
    .sort(sort === 'az' ? byName : byCount)
}

// Dossiers spéciaux, ouverts depuis les raccourcis
export const SPECIAL_FOLDERS = {
  saison: { id: 'saison', name: 'De saison', color: '#3f6212', statKey: 'seasonal' },
  favoris: { id: 'favoris', name: 'Favoris', color: '#be123c', statKey: 'favorites' },
  'a-completer': { id: 'a-completer', name: 'À compléter', color: '#92400e', statKey: 'toComplete' },
}

export function getSpecialFolder(id) {
  return Object.hasOwn(SPECIAL_FOLDERS, id) ? SPECIAL_FOLDERS[id] : null
}

export function getFolderPath(id, search = '') {
  return `/recipes/folder/${encodeURIComponent(id)}${search}`
}

// Filtres cumulables d'un dossier, dans l'ordre où ils sont écrits dans l'URL (`?f=saison,rapide,jamais`)
export const FOLDER_FILTER_IDS = ['saison', 'rapide', 'jamais']

export function parseFolderFilters(value, availableIds = FOLDER_FILTER_IDS) {
  const requested = new Set(String(value ?? '').split(','))
  return new Set(availableIds.filter((id) => requested.has(id)))
}

export function serializeFolderFilters(active) {
  return FOLDER_FILTER_IDS.filter((id) => active.has(id)).join(',')
}

// État d'historique posé en ouvrant un dossier depuis la liste : le bouton retour du dossier
// revient alors en arrière, ce qui retrouve la liste à la même position
export const FROM_FOLDERS_STATE = { fromFolders: true }

// Paramètres du mode sélection (choix d'une recette depuis le planning), à garder d'une page à l'autre
export function getSelection(searchParams) {
  const date = searchParams.get('date') ?? ''
  const slot = searchParams.get('slot') ?? ''
  if (searchParams.get('mode') !== 'select') return null
  return { date, slot, search: `?${new URLSearchParams({ mode: 'select', date, slot })}` }
}

export function formatCount(count, singular, plural = `${singular}s`) {
  return `${count} ${count > 1 ? plural : singular}`
}

export function formatRecipeCount(count) {
  return formatCount(count, 'recette')
}

// Nombre exact quand toutes les pages sont chargées ou que le total est connu, sinon « Plus de N »
export function formatListCount({ count, hasMore, total = null, noun = ['recette', 'recettes'], qualifier }) {
  const exact = !hasMore ? count : Number.isInteger(total) && total >= count ? total : null
  const value = exact ?? count
  const plural = exact == null || value > 1
  const text = `${exact == null ? 'Plus de ' : ''}${value} ${plural ? noun[1] : noun[0]}`
  const suffix = qualifier?.(plural)
  return suffix ? `${text} ${suffix}` : text
}

export function isInCurrentMonth(recipe, month = getCurrentMonth().value) {
  const target = normalizeText(month)
  return (recipe?.months ?? []).some((value) => normalizeText(value) === target)
}

// "30 min · faite 4 fois", "jamais faite"… Le nombre de fois n'est affiché que si l'API le calcule
export function formatRecipeCardMeta(recipe, { withCookCount = false } = {}) {
  const cookCount = recipe?.cookCount ?? 0
  return [
    recipe?.prepTime ? `${recipe.prepTime} min` : null,
    withCookCount ? (cookCount > 0 ? `faite ${cookCount} fois` : 'jamais faite') : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

// Teintes utilisées quand une recette n'a pas de photo et qu'aucune couleur de dossier ne s'applique
const FALLBACK_COLORS = ['#D9893F', '#C9962E', '#D2692B', '#9AA86A', '#7F9254', '#A86F3E', '#8C7A63', '#B8A27A', '#9A6B3F']

export function pickFallbackColor(seed) {
  let hash = 0
  for (const char of String(seed ?? '')) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length]
}

// Fond teinté d'une couleur de catégorie (~15 %)
export function tintColor(color, percent = 15) {
  return `color-mix(in srgb, ${color} ${percent}%, white)`
}

export function getWriteErrorMessage(error) {
  if (error?.details?.code === 'DEMO_READ_ONLY') return 'Modification désactivée sur la démo'
  if (error instanceof TypeError) return 'Pas de connexion au serveur'
  return error?.message || "La modification n'a pas pu être enregistrée"
}
