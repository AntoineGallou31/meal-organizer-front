import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, LoaderCircle } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Block,
  Button,
  List,
  ListInput,
  ListItem,
  Navbar,
  Page,
  Preloader,
} from '../components/ui'
import { api } from '../lib/api'

function formatMissingFieldLabel(field) {
  switch (field) {
    case 'title':
      return 'Titre'
    case 'image':
      return 'Photo'
    case 'ingredients':
      return 'Ingrédients'
    case 'steps':
      return 'Préparation'
    default:
      return field
  }
}

export default function ImportRecipePage() {
  const [searchParams] = useSearchParams()
  const initialUrl = searchParams.get('url') ?? ''
  const shouldAutoImport = searchParams.get('autoImport') === '1' && initialUrl.length > 0
  const [url, setUrl] = useState(initialUrl)
  const [importBlocked, setImportBlocked] = useState(null)
  const [importIssue, setImportIssue] = useState(null)
  const [duplicateRecipe, setDuplicateRecipe] = useState(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const hasAutoImported = useRef(false)

  const importMutation = useMutation({
    mutationFn: ({ importUrl, forceImport = false }) =>
      api.importRecipe(importUrl, { forceImport }),
    onSuccess: (recipe) => {
      setImportBlocked(null)
      setImportIssue(null)
      setDuplicateRecipe(null)
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      navigate(`/recipes/${recipe.id}`)
    },
    onError: (error) => {
      if (error?.status === 409 && error?.details?.code === 'DUPLICATE_IMPORTED_RECIPE') {
        setDuplicateRecipe(error.details.details)
        return
      }
      if (error?.status === 422 && error?.details?.code === 'IMPORT_BLOCKED') {
        setImportBlocked(error.details)
        return
      }
      if (error?.status === 422 && error?.details?.code === 'IMPORT_VALIDATION_FAILED') {
        setImportIssue(error.details)
      }
    },
  })

  useEffect(() => {
    if (shouldAutoImport && !hasAutoImported.current) {
      hasAutoImported.current = true
      importMutation.mutate({ importUrl: initialUrl })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoImport, initialUrl])

  const handleSubmit = (event) => {
    event.preventDefault()
    setImportBlocked(null)
    setImportIssue(null)
    setDuplicateRecipe(null)
    importMutation.mutate({ importUrl: url })
  }

  const handleForceImport = () => {
    if (!importIssue) return
    const importUrl = importIssue?.recipePreview?.sourceUrl || url
    if (!importUrl) return
    importMutation.mutate({ importUrl, forceImport: true })
  }

  const handleCancelImportIssue = () => {
    setImportIssue(null)
  }

  const handleCancelImportBlocked = () => {
    setImportBlocked(null)
  }

  const handleCancelDuplicate = () => {
    setDuplicateRecipe(null)
  }

  const preview = importIssue?.recipePreview ?? null
  const missingFields = importIssue?.missingFields ?? []
  const blockedMissingFields = importBlocked?.missingFields ?? []

  return (
    <Page>
      <Navbar
        title="Importer une recette"
        left={
          <Button clear small onClick={() => navigate('/recipes/new')} title="Retour">
            <ChevronLeft size={30} />
          </Button>
        }
      />

      <Block className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-cream-200">
        <p className="text-sm font-semibold text-sage-900">Import par URL</p>
        <p className="mt-1 text-sm text-sage-700">
          {shouldAutoImport
            ? 'Import du lien partagé en cours...'
            : "Collez l'adresse de la recette complète. Le lien peut pointer vers un site de cuisine, un blog ou une page article contenant une vraie recette."}
        </p>


      <form onSubmit={handleSubmit}>
          <ListInput
            type="url"
            required
            placeholder="https://..."
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />

        <div className="mt-3">
          <Button type="submit" large className="w-full" disabled={importMutation.isPending}>
            <span className="inline-flex items-center gap-2">
              {importMutation.isPending ? <LoaderCircle size={16} className="animate-spin" /> : null}
              Importer
            </span>
          </Button>
        </div>
      </form>
    </Block>

      {duplicateRecipe ? (
        <Block className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-amber-900">Recette déjà importée</p>
            <p className="text-sm text-amber-800">
              Cette URL a déjà été importée sous le titre « {duplicateRecipe.title} ».
            </p>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <Button tonal type="button" onClick={handleCancelDuplicate}>
              Fermer
            </Button>
            <Button type="button" onClick={() => navigate(`/recipes/${duplicateRecipe.existingRecipeId}`)}>
              Voir la recette
            </Button>
          </div>
        </Block>
      ) : null}

      {importBlocked ? (
        <Block className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-200">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-red-900">Importation impossible</p>
            <p className="text-sm text-red-800">
              Le titre et la photo sont indispensables pour importer une recette, et n'ont pas pu être récupérés sur cette page ({blockedMissingFields.map(formatMissingFieldLabel).join(', ')}). Essayez avec une autre URL.
            </p>
          </div>

          <div className="mt-4">
            <Button type="button" onClick={handleCancelImportBlocked} className="w-full">
              Fermer
            </Button>
          </div>
        </Block>
      ) : null}

      {importIssue ? (
        <Block className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-amber-900">Certaines informations n'ont pas été trouvées</p>
            <p className="text-sm text-amber-800">
              Les ingrédients ou les étapes n'ont pas pu être récupérés sur cette page. Vous pouvez annuler l'import, ou importer quand même la recette : sa fiche renverra alors vers la page source au lieu d'afficher le contenu.
            </p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[120px_1fr]">
            {preview?.imageUrl ? (
              <img
                src={preview.imageUrl}
                alt={preview.title || 'Aperçu importation'}
                className="h-28 w-full rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-28 items-center justify-center rounded-2xl bg-amber-100 text-sm font-semibold text-amber-800">
                Pas de photo
              </div>
            )}

            <List  >
              <ListItem title="Titre" after={preview?.title || 'Titre introuvable'} />
              <ListItem
                title="Champs manquants"
                after={missingFields.length ? missingFields.map(formatMissingFieldLabel).join(', ') : 'Aucun'}
              />
            </List>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <Button tonal type="button" onClick={handleCancelImportIssue} disabled={importMutation.isPending}>
              Annuler l'import
            </Button>
            <Button type="button" onClick={handleForceImport} disabled={importMutation.isPending}>
              Importer quand même
            </Button>
          </div>
        </Block>
      ) : null}

      {importMutation.isError &&
      importMutation.error?.details?.code !== 'IMPORT_BLOCKED' &&
      importMutation.error?.details?.code !== 'IMPORT_VALIDATION_FAILED' &&
      importMutation.error?.details?.code !== 'DUPLICATE_IMPORTED_RECIPE' ? (
        <List inset strong>
          <ListItem title="Impossible d'importer la recette" footer={importMutation.error.message} />
        </List>
      ) : null}
    </Page>
  )
}
