import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Clock3, Pencil, Trash2, Users } from 'lucide-react'
import {
  Block,
  BlockTitle,
  Button,
  Chip,
  List,
  ListInput,
  ListItem,
  Navbar,
  Page,
  Preloader,
  Sheet,
} from 'konsta/react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
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
  const restrictedDetail = Boolean(recipe?.restrictedDetail)
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [id])

  useEffect(() => {
    if (!recipe || !restrictedDetail || !recipe.sourceUrl) return
    window.location.assign(recipe.sourceUrl)
  }, [recipe, restrictedDetail])

  return (
    <Page>
      <Navbar
        title="Fiche recette"
        left={
          <Button clear small onClick={() => navigate('/recipes')} title="Retour">
            <ChevronLeft size={30} />
          </Button>
        }
      />

      {recipeQuery.isLoading ? (
        <Block className="flex items-center justify-center gap-2 py-8 text-sm text-gray-600">
          <Preloader />
          <span>Chargement de la recette...</span>
        </Block>
      ) : null}

      {recipeQuery.isError ? (
        <List inset strong>
          <ListItem title="Impossible de charger la recette" footer={recipeQuery.error?.message} />
        </List>
      ) : null}

      {recipe && restrictedDetail ? (
        <Block className="pb-24">
          <Block strong className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-900">
            <div className="space-y-3">
              <h1 className="text-lg font-semibold">Recette importée non cohérente</h1>
              <p className="text-sm">
                Cette recette reste disponible dans vos listes et dans l'agenda, mais la fiche détaillée est bloquée car le contenu importé n'est pas fiable.
              </p>
              {recipe.sourceUrl ? (
                <Button large onClick={() => window.location.assign(recipe.sourceUrl)}>
                  Ouvrir la recette originale
                </Button>
              ) : (
                <p className="text-sm">Aucune URL source disponible.</p>
              )}
            </div>
          </Block>
        </Block>
      ) : null}

      {recipe && !restrictedDetail ? (
        <Block className="space-y-2 pb-24">
          <Block strong className="overflow-hidden rounded-2xl bg-white !p-0">
            {recipe.imageUrl ? (
              <img src={recipe.imageUrl} alt={recipe.title} className="h-52 w-full object-cover" />
            ) : (
              <div className="flex h-52 items-center justify-center bg-gradient-to-br from-sage-200 to-terracotta-200 text-sm font-semibold text-sage-800">
                Aucune photo disponible
              </div>
            )}

            <div className="px-4 pt-4">
              <h1 className="text-xl font-semibold text-sage-900">{recipe.title}</h1>
            </div>

            <div className="flex flex-wrap gap-4 p-4 text-sm text-sage-700">
              <span className="inline-flex items-center gap-2">
                <Clock3 size={15} /> {recipe.prepTime ? `${recipe.prepTime} min` : 'Temps inconnu'}
              </span>
              <span className="inline-flex items-center gap-2">
                <Users size={15} /> {recipe.servings ?? '-'} personnes
              </span>
            </div>

            {(recipe.categories ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-2 px-4 pb-4">
                {recipe.categories.map((category) => (
                  <Chip
                    key={category.id}
                    className="!text-sage-900"
                    style={{ backgroundColor: category.color || '#e5e7eb' }}
                  >
                    {category.name}
                  </Chip>
                ))}
              </div>
            ) : null}
          </Block>

          <BlockTitle>Ingrédients</BlockTitle>
          <List inset strong>
            {Number.isFinite(baseServings) && baseServings > 0 ? (
              <ListInput
                label="Portions"
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
              />
            ) : null}

            {renderedIngredients.length > 0 ? (
              renderedIngredients.map((ingredient, index) => (
                <ListItem key={`${ingredient}-${index}`} title={ingredient} />
              ))
            ) : (
              <ListItem
                title="Ingrédients indisponibles"
                text={
                  recipe.sourceUrl ? (
                    <a
                      href={recipe.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-terracotta-700 underline underline-offset-2 hover:text-terracotta-600"
                    >
                      Voir la recette originale
                    </a>
                  ) : null
                }
              />
            )}
          </List>

          <BlockTitle>Préparation</BlockTitle>
          <List inset strong>
            {(recipe.steps ?? []).length > 0 ? (
              (recipe.steps ?? []).map((step, index) => (
                <ListItem key={`${step}-${index}`} title={`${index + 1}. ${step}`} />
              ))
            ) : (
              <ListItem
                title="Étapes de préparation indisponibles"
                text={
                  recipe.sourceUrl ? (
                    <a
                      href={recipe.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-terracotta-700 underline underline-offset-2 hover:text-terracotta-600"
                    >
                      Voir la recette originale
                    </a>
                  ) : null
                }
              />
            )}
          </List>

          <Block className="space-y-2">
            <Button large className="w-full" onClick={() => setPlannerOpen(true)}>
              Ajouter au calendrier
            </Button>

            <Link to={`/recipes/${id}/edit`} className="block">
              <Button large tonal className="w-full">
                <span className="inline-flex items-center gap-2">
                  <Pencil size={16} /> Modifier
                </span>
              </Button>
            </Link>

            <Button
              large
              tonal
              className="w-full !text-red-700"
              disabled={deleteRecipeMutation.isPending}
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <span className="inline-flex items-center gap-2">
                <Trash2 size={16} /> Supprimer
              </span>
            </Button>
          </Block>

          {assignMealMutation.isError ? (
            <List inset strong>
              <ListItem title="Impossible d’ajouter au planning" footer={assignMealMutation.error?.message} />
            </List>
          ) : null}

          {deleteRecipeMutation.isError ? (
            <List inset strong>
              <ListItem title="Impossible de supprimer la recette" footer={deleteRecipeMutation.error?.message} />
            </List>
          ) : null}

          {(recipe.similarRecipes ?? []).length > 0 ? (
            <>
              <BlockTitle>Recettes similaires</BlockTitle>
              <List inset strong>
                {recipe.similarRecipes.map((similarRecipe) => (
                  <ListItem
                    key={similarRecipe.id}
                    title={similarRecipe.title}
                    onClick={() => navigate(`/recipes/${similarRecipe.id}`)}
                  />
                ))}
              </List>
            </>
          ) : null}
        </Block>
      ) : null}

      <Sheet opened={plannerOpen} onBackdropClick={() => setPlannerOpen(false)}>
        <div className="p-4">
          <div className="mb-3">
            <div className="text-base font-semibold text-sage-900">Planifier ce repas</div>
            <div className="text-sm text-sage-700">Ajoutez la recette dans votre calendrier</div>
          </div>

          <List strongIos outlineIos>
            <ListInput
              label="Jour"
              type="select"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            >
              {upcomingDays.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </ListInput>

            <ListInput
              label="Moment"
              type="select"
              value={selectedSlot}
              onChange={(event) => setSelectedSlot(event.target.value)}
            >
              <option value="lunch">Midi</option>
              <option value="dinner">Soir</option>
            </ListInput>
          </List>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button tonal onClick={() => setPlannerOpen(false)}>
              Annuler
            </Button>
            <Button
              disabled={assignMealMutation.isPending || !recipe}
              onClick={() => {
                if (!recipe) return
                assignMealMutation.mutate({ date: selectedDate, slot: selectedSlot, recipeId: recipe.id })
              }}
            >
              {assignMealMutation.isPending ? 'Ajout en cours...' : 'Confirmer'}
            </Button>
          </div>
        </div>
      </Sheet>

      <Sheet opened={deleteConfirmOpen} onBackdropClick={() => setDeleteConfirmOpen(false)}>
        <div className="p-4">
          <div className="mb-3">
            <div className="text-base font-semibold text-sage-900">Supprimer cette recette ?</div>
            <div className="text-sm text-sage-700">Cette action est définitive et ne peut pas être annulée.</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button tonal onClick={() => setDeleteConfirmOpen(false)}>
              Annuler
            </Button>
            <Button
              className="!bg-red-600"
              disabled={deleteRecipeMutation.isPending || !recipe}
              onClick={() => {
                if (!recipe) return
                setDeleteConfirmOpen(false)
                deleteRecipeMutation.mutate(recipe.id)
              }}
            >
              {deleteRecipeMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </div>
      </Sheet>
    </Page>
  )
}
