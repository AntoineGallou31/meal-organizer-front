import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Clock3, Pencil, Trash2, Users } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import LoadingState from '../components/LoadingState'
import PageFrame from '../components/PageFrame'
import { api } from '../lib/api'
import { getUpcomingDays } from '../lib/week'

function parseQuantityToken(token) {
  const trimmed = token.trim()

  if (/^\d+\s+\d+\/\d+$/.test(trimmed)) {
    const [whole, fraction] = trimmed.split(/\s+/)
    const [num, den] = fraction.split('/')
    const denominator = Number(den)
    if (!denominator) return null
    return Number(whole) + Number(num) / denominator
  }

  if (/^\d+\/\d+$/.test(trimmed)) {
    const [num, den] = trimmed.split('/')
    const denominator = Number(den)
    if (!denominator) return null
    return Number(num) / denominator
  }

  const normalized = trimmed.replace(',', '.')
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

function formatScaledQuantity(value) {
  if (!Number.isFinite(value)) return ''
  const rounded = Math.round(value * 100) / 100
  if (Number.isInteger(rounded)) return String(rounded)
  return String(rounded).replace('.', ',')
}

function scaleIngredientText(ingredient, ratio) {
  if (!ingredient || !Number.isFinite(ratio) || ratio <= 0 || ratio === 1) return ingredient

  // Handle common Unicode fractions often found in imported recipes.
  const normalized = ingredient
    .replace(/½/g, '1/2')
    .replace(/⅓/g, '1/3')
    .replace(/⅔/g, '2/3')
    .replace(/¼/g, '1/4')
    .replace(/¾/g, '3/4')

  return normalized.replace(/\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?/g, (match) => {
    const quantity = parseQuantityToken(match)
    if (quantity == null) return match
    return formatScaledQuantity(quantity * ratio)
  })
}

export default function RecipeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [plannerOpen, setPlannerOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(getUpcomingDays(1)[0].value)
  const [selectedSlot, setSelectedSlot] = useState('dinner')
  const [targetServings, setTargetServings] = useState('')

  const recipeQuery = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => api.getRecipeById(id),
  })

  const assignMealMutation = useMutation({
    mutationFn: api.assignMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plan'] })
      setPlannerOpen(false)
    },
  })

  const deleteRecipeMutation = useMutation({
    mutationFn: api.deleteRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['meal-plan'] })
      navigate('/recipes')
    },
  })

  const recipe = recipeQuery.data
  const upcomingDays = getUpcomingDays(14)
  const baseServings = Number(recipe?.servings)
  const desiredServings = Number(targetServings)
  const scalingRatio =
    Number.isFinite(baseServings) && baseServings > 0 && Number.isFinite(desiredServings) && desiredServings > 0
      ? desiredServings / baseServings
      : 1

  const renderedIngredients = (recipe?.ingredients ?? []).map((ingredient) =>
    scaleIngredientText(ingredient, scalingRatio),
  )

  useEffect(() => {
    if (Number.isFinite(baseServings) && baseServings > 0) {
      setTargetServings(String(baseServings))
    }
  }, [baseServings])

  return (
    <PageFrame
      title={recipe?.title ?? 'Fiche recette'}
      subtitle="Details de la recette"
      action={
        <Link
          to="/recipes"
          className="inline-flex items-center gap-2 rounded-xl border border-sage-300 px-3 py-2 text-xs font-semibold text-sage-700 transition hover:bg-cream-100 dark:border-sage-700 dark:text-cream-300 dark:hover:bg-charcoal-800"
        >
          <ArrowLeft size={14} /> Retour
        </Link>
      }
    >
      {recipeQuery.isLoading ? <LoadingState label="Chargement de la recette..." /> : null}
      {recipeQuery.isError ? (
        <ErrorState message={recipeQuery.error.message} onRetry={recipeQuery.refetch} />
      ) : null}

      {recipe ? (
        <article className="space-y-5">
          <div className="overflow-hidden rounded-3xl border border-cream-200 bg-white dark:border-charcoal-700 dark:bg-charcoal-800">
            {recipe.imageUrl ? (
              <img src={recipe.imageUrl} alt={recipe.title} className="h-52 w-full object-cover" />
            ) : (
              <div className="flex h-52 items-center justify-center bg-gradient-to-br from-sage-200 to-terracotta-200 text-sm font-semibold text-sage-800 dark:from-charcoal-700 dark:to-charcoal-600 dark:text-cream-100">
                Aucune photo disponible
              </div>
            )}

            <div className="flex flex-wrap gap-4 p-4 text-sm text-sage-700 dark:text-cream-300">
              <span className="inline-flex items-center gap-2"><Clock3 size={15} /> {recipe.prepTime ? `${recipe.prepTime} min` : 'Temps inconnu'}</span>
              <span className="inline-flex items-center gap-2"><Users size={15} /> {recipe.servings ?? '-'} personnes</span>
            </div>
          </div>

          <section className="rounded-3xl border border-cream-200 bg-white p-4 dark:border-charcoal-700 dark:bg-charcoal-800">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-xl text-sage-900 dark:text-cream-50">Ingredients</h2>
              {Number.isFinite(baseServings) && baseServings > 0 ? (
                <label className="flex items-center gap-2 text-sm text-sage-700 dark:text-cream-300">
                  <span className="font-semibold">Portions</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={targetServings}
                    onChange={(event) => setTargetServings(event.target.value)}
                    onFocus={() => {
                      if (targetServings === '') {
                        setTargetServings(String(baseServings))
                      }
                    }}
                    className="w-20 rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm text-sage-900 outline-none transition focus:border-sage-500 dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-cream-100"
                  />
                </label>
              ) : null}
            </div>
            <ul className="mt-3 space-y-2 text-sm text-sage-800 dark:text-cream-200">
              {renderedIngredients.map((ingredient, index) => (
                <li key={`${ingredient}-${index}`} className="rounded-xl bg-cream-100 px-3 py-2 dark:bg-charcoal-700">
                  {ingredient}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-cream-200 bg-white p-4 dark:border-charcoal-700 dark:bg-charcoal-800">
            <h2 className="font-display text-xl text-sage-900 dark:text-cream-50">Preparation</h2>
            <ol className="mt-3 space-y-2 text-sm text-sage-800 dark:text-cream-200">
              {(recipe.steps ?? []).map((step, index) => (
                <li key={`${step}-${index}`} className="rounded-xl bg-cream-100 px-3 py-2 dark:bg-charcoal-700">
                  <span className="font-semibold">{index + 1}. </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>

          <button
            type="button"
            className="w-full rounded-2xl bg-sage-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sage-500"
            onClick={() => setPlannerOpen(true)}
          >
            Ajouter au calendrier
          </button>

          <div className="grid grid-cols-2 gap-3">
            <Link
              to={`/recipes/${id}/edit`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sage-300 px-4 py-3 text-sm font-semibold text-sage-800 transition hover:bg-cream-100 dark:border-sage-700 dark:text-cream-200 dark:hover:bg-charcoal-800"
            >
              <Pencil size={16} /> Modifier
            </Link>
            <button
              type="button"
              disabled={deleteRecipeMutation.isPending}
              onClick={() => {
                if (!recipe) return
                const confirmed = window.confirm('Supprimer cette recette ? Cette action est définitive.')
                if (!confirmed) return
                deleteRecipeMutation.mutate(recipe.id)
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-300 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30"
            >
              <Trash2 size={16} /> Supprimer
            </button>
          </div>

          {assignMealMutation.isError ? (
            <p className="text-sm text-red-700 dark:text-red-300">{assignMealMutation.error.message}</p>
          ) : null}

          {deleteRecipeMutation.isError ? (
            <p className="text-sm text-red-700 dark:text-red-300">{deleteRecipeMutation.error.message}</p>
          ) : null}
        </article>
      ) : null}

      {plannerOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-charcoal-950/50"
            onClick={() => setPlannerOpen(false)}
          />
          <section className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border border-cream-200 bg-cream-50 p-5 shadow-2xl animate-sheet-up dark:border-charcoal-700 dark:bg-charcoal-900">
            <h3 className="font-display text-xl text-sage-900 dark:text-cream-50">Planifier ce repas</h3>

            <label className="mt-4 block space-y-2">
              <span className="text-sm font-semibold text-sage-800 dark:text-cream-200">Jour</span>
              <select
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm dark:border-charcoal-700 dark:bg-charcoal-800"
              >
                {upcomingDays.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block space-y-2">
              <span className="text-sm font-semibold text-sage-800 dark:text-cream-200">Moment</span>
              <select
                value={selectedSlot}
                onChange={(event) => setSelectedSlot(event.target.value)}
                className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm dark:border-charcoal-700 dark:bg-charcoal-800"
              >
                <option value="lunch">Midi</option>
                <option value="dinner">Soir</option>
              </select>
            </label>

            <button
              type="button"
              disabled={assignMealMutation.isPending || !recipe}
              className="mt-5 w-full rounded-2xl bg-terracotta-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-terracotta-500 disabled:cursor-not-allowed disabled:opacity-70"
              onClick={() => {
                if (!recipe) return
                assignMealMutation.mutate({ date: selectedDate, slot: selectedSlot, recipeId: recipe.id })
              }}
            >
              {assignMealMutation.isPending ? 'Ajout en cours...' : 'Confirmer'}
            </button>
          </section>
        </>
      ) : null}
    </PageFrame>
  )
}
