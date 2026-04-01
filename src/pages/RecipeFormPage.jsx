import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, LoaderCircle, X } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import LoadingState from '../components/LoadingState'
import PageFrame from '../components/PageFrame'
import { api } from '../lib/api'
import { SEASONS } from '../lib/seasonality'

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
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([])
  const [categoryError, setCategoryError] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [selectedSeasons, setSelectedSeasons] = useState([])
  const [customSeason, setCustomSeason] = useState('')

  const recipeQuery = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => api.getRecipeById(id),
    enabled: isEdit,
  })

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(false),
  })

  const createCategoryMutation = useMutation({
    mutationFn: async (name) => {
      const result = await api.createCategory({ name })
      return result
    },
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setSelectedCategoryIds((prev) => [...prev, newCategory.id])
      setNewCategoryName('')
    },
  })

  useEffect(() => {
    if (!isEdit) return
    const recipeCategoryIds = (recipeQuery.data?.categories ?? []).map((category) => category.id)
    setSelectedCategoryIds(recipeCategoryIds)
    const recipeSeasons = (recipeQuery.data?.seasons ?? []).filter(s => typeof s === 'string')
    setSelectedSeasons(recipeSeasons)
  }, [isEdit, recipeQuery.data])

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (isEdit) {
        const updatedRecipe = await api.updateRecipe(id, payload)
        await api.setRecipeCategories(id, selectedCategoryIds)
        return api.getRecipeById(updatedRecipe.id)
      }
      if (selectedCategoryIds.length > 0) {
        return api.createRecipe({
          ...payload,
          categoryIds: selectedCategoryIds,
        })
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
    if (isEdit && selectedCategoryIds.length === 0) {
      setCategoryError('Selectionne au moins une categorie.')
      return
    }
    setCategoryError('')
    if (createCategoryMutation.isPending) {
      return
    }
    const payload = formToPayload(new FormData(event.currentTarget))
    saveMutation.mutate({ ...payload, seasons: selectedSeasons })
  }

  const toggleCategory = (categoryId) => {
    setCategoryError('')
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    )
  }

  const addNewCategory = () => {
    const trimmed = newCategoryName.trim()
    if (!trimmed) return
    createCategoryMutation.mutate(trimmed)
  }

  const toggleSeason = (seasonValue) => {
    setSelectedSeasons((prev) =>
      prev.includes(seasonValue)
        ? prev.filter((s) => s !== seasonValue)
        : [...prev, seasonValue],
    )
  }

  const addCustomSeason = () => {
    const trimmed = customSeason.trim().toLowerCase()
    if (!trimmed) return
    if (selectedSeasons.includes(trimmed)) return
    setSelectedSeasons((prev) => [...prev, trimmed])
    setCustomSeason('')
  }

  const removeCustomSeason = (season) => {
    setSelectedSeasons((prev) => prev.filter((s) => s !== season))
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

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-sage-800">Categories</h3>
            {categoriesQuery.isLoading ? (
              <p className="text-sm text-sage-700">Chargement des categories...</p>
            ) : null}
            {categoriesQuery.isError ? (
              <p className="text-sm text-red-700">{categoriesQuery.error.message}</p>
            ) : null}
            {!categoriesQuery.isLoading && !categoriesQuery.isError ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {(categoriesQuery.data ?? []).map((category) => {
                  const checked = selectedCategoryIds.includes(category.id)
                  return (
                    <label
                      key={category.id}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                        checked
                          ? 'border-sage-600 bg-sage-50 text-sage-900'
                          : 'border-cream-300 bg-white text-sage-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCategory(category.id)}
                      />
                      <span>{category.name}</span>
                    </label>
                  )
                })}
              </div>
            ) : null}
            {categoryError ? (
              <p className="text-xs text-red-700">{categoryError}</p>
            ) : !isEdit && selectedCategoryIds.length === 0 ? (
              <p className="text-xs text-sage-700">Aucune categorie selectionnee: le backend tentera une detection automatique.</p>
            ) : null}

            <div className="space-y-2 border-t border-cream-300 pt-2">
              <label className="block text-xs font-semibold text-sage-700">Ajouter une catégorie personnalisée</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addNewCategory()
                    }
                  }}
                  placeholder="Ex: Plats sans gluten"
                  className="flex-1 rounded-lg border border-cream-300 bg-white px-3 py-2 text-sm text-sage-900 outline-none transition focus:border-sage-500"
                  disabled={createCategoryMutation.isPending}
                />
                <button
                  type="button"
                  onClick={addNewCategory}
                  disabled={createCategoryMutation.isPending || !newCategoryName.trim()}
                  className="rounded-lg border border-sage-300 bg-white px-4 py-2 text-sm font-semibold text-sage-700 transition hover:bg-cream-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createCategoryMutation.isPending ? <LoaderCircle size={14} className="inline animate-spin" /> : 'Ajouter'}
                </button>
              </div>
              {createCategoryMutation.isError ? (
                <p className="text-xs text-red-700">{createCategoryMutation.error.message}</p>
              ) : null}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-sage-800">Saisonnalité (optionnel)</h3>
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                {SEASONS.map((season) => {
                  const checked = selectedSeasons.includes(season.value)
                  return (
                    <label
                      key={season.id}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                        checked
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-cream-300 bg-white text-sage-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSeason(season.value)}
                      />
                      <span>{season.label}</span>
                    </label>
                  )
                })}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-sage-700">Ajouter une saison personnalisée</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSeason}
                    onChange={(e) => setCustomSeason(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCustomSeason()
                      }
                    }}
                    placeholder="Ex: printemps tardif"
                    className="flex-1 rounded-lg border border-cream-300 bg-white px-3 py-2 text-sm text-sage-900 outline-none transition focus:border-sage-500"
                  />
                  <button
                    type="button"
                    onClick={addCustomSeason}
                    className="rounded-lg border border-sage-300 bg-white px-4 py-2 text-sm font-semibold text-sage-700 transition hover:bg-cream-100"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              {selectedSeasons.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedSeasons.map((season) => {
                    const isPredefined = SEASONS.some((s) => s.value === season)
                    const label = isPredefined ? SEASONS.find((s) => s.value === season)?.label : season
                    return (
                      <span
                        key={season}
                        className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800"
                      >
                        {label}
                        <button
                          type="button"
                          onClick={() => removeCustomSeason(season)}
                          className="hover:text-blue-900"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    )
                  })}
                </div>
              ) : null}
            </div>
          </section>

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
