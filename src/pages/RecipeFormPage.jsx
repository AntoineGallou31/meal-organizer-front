import { useMemo, useState } from 'react'
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
} from '../components/ui'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { MONTHS } from '../lib/seasonality'

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

function formToPayload(formData, { categories = [], selectedCategoryIds = [] } = {}) {
  const title = String(formData.get('title') ?? '').trim()
  const imageUrl = String(formData.get('imageUrl') ?? '').trim()
  const prepTime = String(formData.get('prepTime') ?? '').trim()
  const servings = String(formData.get('servings') ?? '').trim()
  const sourceUrl = String(formData.get('sourceUrl') ?? '').trim()
  const ingredientsText = String(formData.get('ingredientsText') ?? '')
  const stepsText = String(formData.get('stepsText') ?? '')

  const primaryCategoryId = selectedCategoryIds[0] ?? null
  const primaryCategory = primaryCategoryId
    ? categories.find((category) => category.id === primaryCategoryId) ?? null
    : null

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
    category: primaryCategory?.name ?? null,
    categories: primaryCategory ? [primaryCategory.name] : [],
    months: [],
  }
}

function RecipeFormFields({
  id,
  isEdit,
  recipe,
  categories,
  categoriesQuery,
  queryClient,
  navigate,
}) {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(() =>
    isEdit ? (recipe?.categories ?? []).map((category) => category.id) : [],
  )
  const [categoryError, setCategoryError] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [selectedMonths, setSelectedMonths] = useState(() =>
    isEdit ? (recipe?.months ?? []).filter((month) => typeof month === 'string') : [],
  )

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

  const defaultValues = recipeToFormDefaults(isEdit ? recipe : null)

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
    const payload = formToPayload(new FormData(event.currentTarget), {
      categories,
      selectedCategoryIds,
    })
    saveMutation.mutate({ ...payload, months: selectedMonths })
  }

  const toggleCategory = (categoryId) => {
    setCategoryError('')
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((selectedId) => selectedId !== categoryId)
        : [...prev, categoryId],
    )
  }

  const addNewCategory = () => {
    const trimmed = newCategoryName.trim()
    if (!trimmed) return
    createCategoryMutation.mutate(trimmed)
  }

  const toggleMonth = (monthValue) => {
    setSelectedMonths((prev) =>
      prev.includes(monthValue)
        ? prev.filter((month) => month !== monthValue)
        : [...prev, monthValue],
    )
  }

  const removeMonth = (month) => {
    setSelectedMonths((prev) => prev.filter((item) => item !== month))
  }

  return (
    <form onSubmit={handleSubmit} className="pb-24">
      <BlockTitle>Informations</BlockTitle>
      <List strongIos outlineIos>
        <ListInput type="text" label="Titre" name="title" required defaultValue={defaultValues.title} />

        <ListInput type="number" label="Temps (min)" name="prepTime" min="1" defaultValue={defaultValues.prepTime} />

        <ListInput type="number" label="Portions" name="servings" min="1" defaultValue={defaultValues.servings} />

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
            {categories.map((category) => {
              const checked = selectedCategoryIds.includes(category.id)

              return (
                <ListItem
                  key={category.id}
                  title={category.name}
                  className={checked ? 'bg-sage-50' : ''}
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
          <ListItem className="text-red-700" title={categoryError} />
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

      <BlockTitle>Mois de disponibilité (optionnel)</BlockTitle>
      <List strongIos outlineIos>
        {MONTHS.map((month) => {
          const checked = selectedMonths.includes(month.value)

          return (
            <ListItem
              key={month.id}
              title={month.label}
                className={checked ? 'bg-blue-50' : ''}
              onClick={() => toggleMonth(month.value)}
              after={
                <input
                  type="checkbox"
                  checked={checked}
                  onClick={(event) => event.stopPropagation()}
                  onChange={() => toggleMonth(month.value)}
                />
              }
            />
          )
        })}
      </List>

      {selectedMonths.length > 0 ? (
        <div className="space-y-3 px-4 pt-2">
          <div className="flex flex-wrap gap-2">
            {selectedMonths.map((month) => {
              const monthData = MONTHS.find((item) => item.value === month)
              const label = monthData ? monthData.label : month

              return (
                <Chip
                  key={month}
                  className="bg-blue-100 text-blue-800"
                  media={
                    <button
                      type="button"
                      onClick={() => removeMonth(month)}
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
        </div>
      ) : null}

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
  )
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

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(false),
  })

  const subtitle = useMemo(
    () => (isEdit ? 'Modifier une recette existante' : 'Créer une recette à la main'),
    [isEdit],
  )

  return (
    <Page>
      <Navbar
        title={isEdit ? 'Modifier la recette' : 'Nouvelle recette'}
        subtitle={subtitle}
        left={
          <Button clear small onClick={() => navigate(isEdit ? `/recipes/${id}` : '/recipes')} title="Retour">
            <ChevronLeft size={30} />
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
            <Upload size={20} />
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
        <RecipeFormFields
          key={isEdit ? recipeQuery.data?.id ?? id : 'new'}
          id={id}
          isEdit={isEdit}
          recipe={recipeQuery.data}
          categories={(categoriesQuery.data ?? [])}
          categoriesQuery={categoriesQuery}
          queryClient={queryClient}
          navigate={navigate}
        />
      ) : null}

    </Page>
  )
}
