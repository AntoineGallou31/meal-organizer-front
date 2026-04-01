import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import LoadingState from '../components/LoadingState'
import PageFrame from '../components/PageFrame'
import { api } from '../lib/api'

function recipeToFormDefaults(recipe) {
  if (!recipe) {
    return {
      title: '',
      imageUrl: '',
      prepTime: '',
      servings: '',
      sourceUrl: '',
      ingredientsText: '',
      stepsText: '',
    }
  }

  return {
    title: recipe.title ?? '',
    imageUrl: recipe.imageUrl ?? '',
    prepTime: recipe.prepTime ?? '',
    servings: recipe.servings ?? '',
    sourceUrl: recipe.sourceUrl ?? '',
    ingredientsText: (recipe.ingredients ?? []).join('\n'),
    stepsText: (recipe.steps ?? []).join('\n'),
  }
}

function formToPayload(formData) {
  const title = String(formData.get('title') ?? '').trim()
  const imageUrl = String(formData.get('imageUrl') ?? '').trim()
  const prepTime = String(formData.get('prepTime') ?? '').trim()
  const servings = String(formData.get('servings') ?? '').trim()
  const sourceUrl = String(formData.get('sourceUrl') ?? '').trim()
  const ingredientsText = String(formData.get('ingredientsText') ?? '')
  const stepsText = String(formData.get('stepsText') ?? '')

  return {
    title,
    imageUrl: imageUrl || null,
    prepTime: prepTime === '' ? null : Number(prepTime),
    servings: servings === '' ? null : Number(servings),
    sourceUrl: sourceUrl || null,
    ingredients: ingredientsText
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
    steps: stepsText
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
  }
}

export default function RecipeFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const recipeQuery = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => api.getRecipeById(id),
    enabled: isEdit,
  })

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (isEdit) {
        return api.updateRecipe(id, payload)
      }
      return api.createRecipe(payload)
    },
    onSuccess: (savedRecipe) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['recipe', id] })
      }
      navigate(`/recipes/${savedRecipe.id}`)
    },
  })

  const subtitle = useMemo(
    () => (isEdit ? 'Modifier une recette existante' : 'Créer une recette à la main'),
    [isEdit],
  )

  const defaultValues = recipeToFormDefaults(isEdit ? recipeQuery.data : null)

  const handleSubmit = (event) => {
    event.preventDefault()
    const payload = formToPayload(new FormData(event.currentTarget))
    saveMutation.mutate(payload)
  }

  return (
    <PageFrame
      title={isEdit ? 'Modifier la recette' : 'Nouvelle recette'}
      subtitle={subtitle}
      action={
        <Link
          to={isEdit ? `/recipes/${id}` : '/recipes'}
          className="inline-flex items-center gap-2 rounded-xl border border-sage-300 px-3 py-2 text-xs font-semibold text-sage-700 transition hover:bg-cream-100"
        >
          <ArrowLeft size={14} /> Retour
        </Link>
      }
    >
      {isEdit && recipeQuery.isLoading ? <LoadingState label="Chargement de la recette..." /> : null}
      {isEdit && recipeQuery.isError ? (
        <ErrorState message={recipeQuery.error.message} onRetry={recipeQuery.refetch} />
      ) : null}

      {(!isEdit || recipeQuery.data) ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-sage-800">Titre</span>
            <input
              type="text"
              name="title"
              required
              defaultValue={defaultValues.title}
              className="w-full rounded-2xl border border-cream-300 bg-white px-4 py-3 text-sm text-sage-900 outline-none transition focus:border-sage-500"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-sage-800">Temps (min)</span>
              <input
                type="number"
                name="prepTime"
                min="1"
                defaultValue={defaultValues.prepTime}
                className="w-full rounded-2xl border border-cream-300 bg-white px-4 py-3 text-sm text-sage-900 outline-none transition focus:border-sage-500"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-sage-800">Portions</span>
              <input
                type="number"
                name="servings"
                min="1"
                defaultValue={defaultValues.servings}
                className="w-full rounded-2xl border border-cream-300 bg-white px-4 py-3 text-sm text-sage-900 outline-none transition focus:border-sage-500"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-sage-800">URL image</span>
            <input
              type="url"
              name="imageUrl"
              placeholder="https://..."
              defaultValue={defaultValues.imageUrl}
              className="w-full rounded-2xl border border-cream-300 bg-white px-4 py-3 text-sm text-sage-900 outline-none transition focus:border-sage-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-sage-800">URL source (optionnel)</span>
            <input
              type="url"
              name="sourceUrl"
              placeholder="https://..."
              defaultValue={defaultValues.sourceUrl}
              className="w-full rounded-2xl border border-cream-300 bg-white px-4 py-3 text-sm text-sage-900 outline-none transition focus:border-sage-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-sage-800">Ingrédients (1 ligne = 1 ingrédient)</span>
            <textarea
              name="ingredientsText"
              required
              rows={6}
              defaultValue={defaultValues.ingredientsText}
              className="w-full rounded-2xl border border-cream-300 bg-white px-4 py-3 text-sm text-sage-900 outline-none transition focus:border-sage-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-sage-800">Étapes (1 ligne = 1 étape)</span>
            <textarea
              name="stepsText"
              required
              rows={8}
              defaultValue={defaultValues.stepsText}
              className="w-full rounded-2xl border border-cream-300 bg-white px-4 py-3 text-sm text-sage-900 outline-none transition focus:border-sage-500"
            />
          </label>

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 rounded-2xl bg-sage-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sage-500 disabled:cursor-not-allowed disabled:opacity-80"
          >
            {saveMutation.isPending ? <LoaderCircle size={16} className="animate-spin" /> : null}
            {isEdit ? 'Enregistrer les modifications' : 'Créer la recette'}
          </button>
        </form>
      ) : null}

      {saveMutation.isError ? (
        <p className="mt-4 text-sm text-red-700">{saveMutation.error.message}</p>
      ) : null}
    </PageFrame>
  )
}
