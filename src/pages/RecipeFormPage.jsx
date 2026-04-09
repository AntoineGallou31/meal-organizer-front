import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, LoaderCircle, Upload, X } from 'lucide-react'
import {
  Block,
  BlockTitle,
  Button,
  Chip,
  Fab,
  List,
  ListInput,
  ListItem,
  Navbar,
  Page,
  Preloader,
} from 'konsta/react'
import { useNavigate, useParams } from 'react-router-dom'
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
  const normalizedCustomSeason = customSeason.trim().toLowerCase()
  const canAddCustomSeason =
    normalizedCustomSeason !== '' && !selectedSeasons.includes(normalizedCustomSeason)

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
    if (!canAddCustomSeason) return
    setSelectedSeasons((prev) => [...prev, normalizedCustomSeason])
    setCustomSeason('')
  }

  const removeCustomSeason = (season) => {
    setSelectedSeasons((prev) => prev.filter((s) => s !== season))
  }

  return (
    <Page>
      <Navbar
        title={isEdit ? 'Modifier la recette' : 'Nouvelle recette'}
        subtitle={subtitle}
        left={
          <Button clear small onClick={() => navigate(isEdit ? `/recipes/${id}` : '/recipes')} title="Retour">
            <ChevronLeft size={20} />
          </Button>
        }
        right={
          <Fab
            small
            tonal
            title="Importer une recette"
            onClick={() => navigate('/recipes/import')}
            className="rounded-full"
          >
            <Upload size={16} />
          </Fab>
        }
      />

      {isEdit && recipeQuery.isLoading ? (
        <Block className="flex items-center justify-center gap-2 py-8 text-sm text-gray-600">
          <Preloader />
          <span>Chargement de la recette...</span>
        </Block>
      ) : null}

      {isEdit && recipeQuery.isError ? (
        <List inset strong>
          <ListItem title="Impossible de charger la recette" footer={recipeQuery.error?.message} />
        </List>
      ) : null}

      {!isEdit || recipeQuery.data ? (
        <form onSubmit={handleSubmit} className="pb-24">
          <BlockTitle>Informations</BlockTitle>
          <List strongIos outlineIos>
            <ListInput
              type="text"
              label="Titre"
              name="title"
              required
              defaultValue={defaultValues.title}
            />

            <ListInput
              type="number"
              label="Temps (min)"
              name="prepTime"
              min="1"
              defaultValue={defaultValues.prepTime}
            />

            <ListInput
              type="number"
              label="Portions"
              name="servings"
              min="1"
              defaultValue={defaultValues.servings}
            />

            <ListInput
              type="url"
              label="URL image"
              name="imageUrl"
              placeholder="https://..."
              defaultValue={defaultValues.imageUrl}
            />

            <ListInput
              type="url"
              label="URL source (optionnel)"
              name="sourceUrl"
              placeholder="https://..."
              defaultValue={defaultValues.sourceUrl}
            />

            <ListInput
              type="textarea"
              label="Ingrédients (1 ligne = 1 ingrédient)"
              name="ingredientsText"
              required
              defaultValue={defaultValues.ingredientsText}
              inputClassName="min-h-28"
            />

            <ListInput
              type="textarea"
              label="Étapes (1 ligne = 1 étape)"
              name="stepsText"
              required
              defaultValue={defaultValues.stepsText}
              inputClassName="min-h-36"
            />
          </List>

          <BlockTitle>Catégories</BlockTitle>

          {categoriesQuery.isLoading ? (
            <Block className="flex items-center gap-2 py-3 text-sm text-gray-600">
              <Preloader />
              <span>Chargement des catégories...</span>
            </Block>
          ) : null}

          {categoriesQuery.isError ? (
            <List inset strong>
              <ListItem title="Impossible de charger les catégories" footer={categoriesQuery.error?.message} />
            </List>
          ) : null}

          {!categoriesQuery.isLoading && !categoriesQuery.isError ? (
            <>
              <List strongIos outlineIos>
                {(categoriesQuery.data ?? []).map((category) => {
                  const checked = selectedCategoryIds.includes(category.id)

                  return (
                    <ListItem
                      key={category.id}
                      title={category.name}
                      className={checked ? '!bg-sage-50' : ''}
                      onClick={() => toggleCategory(category.id)}
                      after={
                        <input
                          type="checkbox"
                          checked={checked}
                          onClick={(event) => event.stopPropagation()}
                          onChange={() => toggleCategory(category.id)}
                        />
                      }
                    />
                  )
                })}

                <ListInput
                  type="text"
                  label="Ajouter une catégorie personnalisée"
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addNewCategory()
                    }
                  }}
                  placeholder="Ex: Plats sans gluten"
                  disabled={createCategoryMutation.isPending}
                />
              </List>

              <div className="px-4 pt-2">
                <Button
                  tonal
                  type="button"
                  onClick={addNewCategory}
                  disabled={createCategoryMutation.isPending || !newCategoryName.trim()}
                  className="w-full"
                >
                  {createCategoryMutation.isPending ? <LoaderCircle size={16} className="animate-spin" /> : 'Ajouter la catégorie'}
                </Button>
              </div>
            </>
          ) : null}

          {categoryError ? (
            <List inset strong>
              <ListItem className="!text-red-700" title={categoryError} />
            </List>
          ) : null}

          {createCategoryMutation.isError ? (
            <List inset strong>
              <ListItem title="Impossible de créer la catégorie" footer={createCategoryMutation.error?.message} />
            </List>
          ) : null}

          {!isEdit && selectedCategoryIds.length === 0 ? (
            <List inset strong>
              <ListItem title="Aucune catégorie sélectionnée" footer="Le backend tentera une détection automatique." />
            </List>
          ) : null}

          <BlockTitle>Saisonnalité (optionnel)</BlockTitle>
          <List strongIos outlineIos>
            {SEASONS.map((season) => {
              const checked = selectedSeasons.includes(season.value)

              return (
                <ListItem
                  key={season.id}
                  title={season.label}
                  className={checked ? '!bg-blue-50' : ''}
                  onClick={() => toggleSeason(season.value)}
                  after={
                    <input
                      type="checkbox"
                      checked={checked}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => toggleSeason(season.value)}
                    />
                  }
                />
              )
            })}

            <ListInput
              type="text"
              label="Ajouter une saison personnalisée"
              value={customSeason}
              onChange={(event) => setCustomSeason(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addCustomSeason()
                }
              }}
              placeholder="Ex: printemps tardif"
            />
          </List>

          <div className="space-y-3 px-4 pt-2">
            <Button tonal type="button" onClick={addCustomSeason} disabled={!canAddCustomSeason} className="w-full">
              Ajouter la saison
            </Button>

            {normalizedCustomSeason !== '' && !canAddCustomSeason ? (
              <p className="text-xs text-sage-700">Cette saison est deja selectionnee.</p>
            ) : null}

            {selectedSeasons.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedSeasons.map((season) => {
                  const isPredefined = SEASONS.some((item) => item.value === season)
                  const label = isPredefined ? SEASONS.find((item) => item.value === season)?.label : season

                  return (
                    <Chip
                      key={season}
                      className="!bg-blue-100 !text-blue-800"
                      media={
                        <button
                          type="button"
                          onClick={() => removeCustomSeason(season)}
                          className="inline-flex h-4 w-4 items-center justify-center text-blue-800"
                          aria-label={`Retirer ${label}`}
                        >
                          <X size={12} />
                        </button>
                      }
                    >
                      {label}
                    </Chip>
                  )
                })}
              </div>
            ) : null}
          </div>

          <Block className="grid grid-cols-2 gap-2">
            <Button tonal type="button" large disabled={saveMutation.isPending} onClick={() => navigate(isEdit ? `/recipes/${id}` : '/recipes')}>
              Annuler
            </Button>
            <Button type="submit" large disabled={saveMutation.isPending}>
              <span className="inline-flex items-center gap-2">
                {saveMutation.isPending ? <LoaderCircle size={16} className="animate-spin" /> : null}
                {isEdit ? 'Enregistrer' : 'Créer'}
              </span>
            </Button>
          </Block>
        </form>
      ) : null}

      {saveMutation.isError ? (
        <List inset strong>
          <ListItem title="Impossible d’enregistrer la recette" footer={saveMutation.error?.message} />
        </List>
      ) : null}
    </Page>
  )
}
