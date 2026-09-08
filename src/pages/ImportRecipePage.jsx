import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, LoaderCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
  const [url, setUrl] = useState('')
  const [importBlocked, setImportBlocked] = useState(null)
  const [importIssue, setImportIssue] = useState(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const importMutation = useMutation({
    mutationFn: ({ importUrl, forceImport = false }) =>
      api.importRecipe(importUrl, { forceImport }),
    onSuccess: (recipe) => {
      setImportBlocked(null)
      setImportIssue(null)
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      navigate(`/recipes/${recipe.id}`)
    },
    onError: (error) => {
      if (error?.status === 422 && error?.details?.code === 'IMPORT_BLOCKED') {
        setImportBlocked(error.details)
        return
      }
      if (error?.status === 422 && error?.details?.code === 'IMPORT_VALIDATION_FAILED') {
        setImportIssue(error.details)
      }
    },
  })

  const handleSubmit = (event) => {
    event.preventDefault()
    setImportBlocked(null)
    setImportIssue(null)
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

  const preview = importIssue?.recipePreview ?? null
  const missingFields = importIssue?.missingFields ?? []
  const blockedMissingFields = importBlocked?.missingFields ?? []

  return (
    <Page>
      <Navbar
        title="Importer une recette"
        left={
          <Button clear small onClick={() => navigate('/recipes/new')} title="Retour">
            <ChevronLeft size={20} />
          </Button>
        }
      />

      <Block className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-cream-200">
        <p className="text-sm font-semibold text-sage-900">Import par URL</p>
        <p className="mt-1 text-sm text-sage-700">
          Collez l'adresse de la recette complète. Le lien peut pointer vers un site de cuisine, un blog ou une page article contenant une vraie recette.
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
      importMutation.error?.details?.code !== 'IMPORT_VALIDATION_FAILED' ? (
        <List inset strong>
          <ListItem title="Impossible d'importer la recette" footer={importMutation.error.message} />
        </List>
      ) : null}

      {!importBlocked && !importIssue ? (
        <Block className="flex items-center gap-2 rounded-2xl bg-sage-50 p-4 text-sm text-sage-700 ring-1 ring-sage-100">
          <Preloader />
          <span>Collez une URL pour commencer l'import.</span>
        </Block>
      ) : null}
    </Page>
  )
}
