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
} from 'konsta/react'
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
    case 'content':
      return 'Cohérence globale'
    default:
      return field
  }
}

export default function ImportRecipePage() {
  const [url, setUrl] = useState('')
  const [titleVerificationPrompt, setTitleVerificationPrompt] = useState(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const importMutation = useMutation({
    mutationFn: ({ importUrl, forceImportMode = null }) =>
      api.importRecipe(importUrl, { forceImportMode }),
    onSuccess: (recipe) => {
      setTitleVerificationPrompt(null)
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      if (recipe?.restrictedDetail && recipe?.sourceUrl) {
        window.location.assign(recipe.sourceUrl)
        return
      }
      navigate(`/recipes/${recipe.id}`)
    },
    onError: (error) => {
      if (error?.status === 422 && (
        error?.details?.code === 'TITLE_NEEDS_VERIFICATION' ||
        error?.details?.code === 'IMPORT_VALIDATION_FAILED'
      )) {
        setTitleVerificationPrompt(error.details)
      }
    },
  })

  const handleSubmit = (event) => {
    event.preventDefault()
    setTitleVerificationPrompt(null)
    importMutation.mutate({ importUrl: url })
  }

  const handleConfirmIncompleteImport = () => {
    if (!titleVerificationPrompt) return
    const importUrl =
      titleVerificationPrompt?.scrapedContent?.sourceUrl ||
      titleVerificationPrompt?.recipePreview?.sourceUrl ||
      url
    if (!importUrl) return
    importMutation.mutate({
      importUrl,
      forceImportMode: 'incomplete',
    })
  }

  const handleConfirmContentlessImport = () => {
    if (!titleVerificationPrompt) return
    const importUrl =
      titleVerificationPrompt?.scrapedContent?.sourceUrl ||
      titleVerificationPrompt?.recipePreview?.sourceUrl ||
      url
    if (!importUrl) return
    importMutation.mutate({
      importUrl,
      forceImportMode: 'contentless',
    })
  }

  const handleCancelUnverifiedTitleImport = () => {
    setTitleVerificationPrompt(null)
  }

  const preview = titleVerificationPrompt?.recipePreview ?? null
  const missingFields = titleVerificationPrompt?.missingFields ?? []
  const matchedKeywords = titleVerificationPrompt?.titleKeywordsMatched ?? []
  const fieldErrors = titleVerificationPrompt?.fieldErrors ?? []
  const scrapedContent = titleVerificationPrompt?.scrapedContent ?? null
  const importValidation = titleVerificationPrompt?.importValidation ?? null
  const validationType = titleVerificationPrompt?.validationType ?? null
  const canForceIncomplete = Boolean(titleVerificationPrompt?.canForceIncomplete)
  const showImportReviewPrompt =
    titleVerificationPrompt?.code === 'IMPORT_VALIDATION_FAILED'
  const isHardValidation = validationType === 'hard'
  const reviewTitle = isHardValidation
    ? 'La récupération de cette recette présente des problèmes'
    : 'L\'importation de cette recette présente des incohérences'
  const reviewDescription = isHardValidation
    ? 'Le titre ou la photo semble incorrect(e). Vous pouvez annuler l\'import, ou importer quand même la recette en statut "à completer".'
    : 'Les ingrédients ou la préparation semblent incohérents. La recette peut être importée, mais sans ses ingrédients ni sa préparation.'

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

      <Block className="space-y-3 pb-24">
        <Block className="rounded-2xl bg-sage-50 p-4 ring-1 ring-sage-100">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-sage-900">Choisissez une méthode d'import</p>
            <p className="text-sm text-sage-700">
              Importez une recette en collant son URL.
            </p>
          </div>
        </Block>

        <form onSubmit={handleSubmit}>
          <Block className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-cream-200">
            <p className="text-sm font-semibold text-sage-900">Import par URL</p>
            <p className="mt-1 text-sm text-sage-700">
              Collez l'adresse de la recette complète. Le lien peut pointer vers un site de cuisine, un blog ou une page article contenant une vraie recette.
            </p>
          </Block>

          <List strongIos outlineIos>
            <ListInput
              type="url"
              label="URL de la recette"
              required
              placeholder="https://..."
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
          </List>

          <div className="mt-3">
            <Button type="submit" large className="w-full" disabled={importMutation.isPending}>
              <span className="inline-flex items-center gap-2">
                {importMutation.isPending ? <LoaderCircle size={16} className="animate-spin" /> : null}
                Importer
              </span>
            </Button>
          </div>
        </form>

        {showImportReviewPrompt ? (
          <Block className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-amber-900">{reviewTitle}</p>
              <p className="text-sm text-amber-800">{reviewDescription}</p>
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

              <List strongIos outlineIos>
                <ListItem title="Titre" after={preview?.title || 'Titre introuvable'} />
                <ListItem
                  title="Source"
                  after={
                    preview?.sourceUrl ? (
                      <a
                        href={preview.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="max-w-48 truncate text-sage-700 underline decoration-sage-400 underline-offset-2"
                      >
                        Ouvrir
                      </a>
                    ) : (
                      'Source introuvable'
                    )
                  }
                />
                <ListItem title="Mots reconnus" after={matchedKeywords.length ? matchedKeywords.join(', ') : 'Aucun'} />
                <ListItem
                  title="Champs concernés"
                  after={missingFields.length ? missingFields.map(formatMissingFieldLabel).join(', ') : 'Aucun'}
                />
                <ListItem
                  title="Score cohérence"
                  after={importValidation?.score ?? '-'}
                />
              </List>
            </div>

            {fieldErrors.length > 0 ? (
              <List inset strong className="mt-3">
                {fieldErrors.map((fieldError, index) => (
                  <ListItem
                    key={`${fieldError.field}-${fieldError.code}-${index}`}
                    title={`${formatMissingFieldLabel(fieldError.field)}`}
                    footer={fieldError.message}
                  />
                ))}
              </List>
            ) : null}

            {importValidation?.reasons?.length ? (
              <List inset strong className="mt-3">
                <ListItem
                  title="Raisons de non cohérence"
                  text={importValidation.reasons.join('\n')}
                />
              </List>
            ) : null}

            {scrapedContent ? (
              <List inset strong className="mt-3">
                <ListItem
                  title="Scraping - ingrédients"
                  text={scrapedContent.ingredients?.length ? scrapedContent.ingredients.join('\n') : 'Aucun ingrédient extrait'}
                />
                <ListItem
                  title="Scraping - préparation"
                  text={scrapedContent.steps?.length ? scrapedContent.steps.join('\n') : 'Aucune étape extraite'}
                />
              </List>
            ) : null}

            <div className="mt-4 grid gap-2 md:grid-cols-2">
              <Button tonal type="button" onClick={handleCancelUnverifiedTitleImport} disabled={importMutation.isPending}>
                Annuler l'import
              </Button>

              {canForceIncomplete ? (
                <Button type="button" onClick={handleConfirmIncompleteImport} disabled={importMutation.isPending}>
                  Importer en "à completer"
                </Button>
              ) : null}

              {validationType === 'content' ? (
                <Button type="button" onClick={handleConfirmContentlessImport} disabled={importMutation.isPending}>
                  Importer sans ingrédients ni préparation
                </Button>
              ) : null}

              {!canForceIncomplete && validationType !== 'content' ? (
                <Button type="button" onClick={handleCancelUnverifiedTitleImport} disabled={importMutation.isPending} className="w-full">
                  Fermer
                </Button>
              ) : null}
            </div>
          </Block>
        ) : null}

        {importMutation.isError &&
        importMutation.error?.details?.code !== 'TITLE_NEEDS_VERIFICATION' &&
        importMutation.error?.details?.code !== 'IMPORT_VALIDATION_FAILED' ? (
          <List inset strong>
            <ListItem title="Impossible d'importer la recette" footer={importMutation.error.message} />
          </List>
        ) : null}

        {!titleVerificationPrompt ? (
          <Block className="flex items-center gap-2 rounded-2xl bg-sage-50 p-4 text-sm text-sage-700 ring-1 ring-sage-100">
            <Preloader />
            <span>Collez une URL pour commencer l'import.</span>
          </Block>
        ) : null}
      </Block>
    </Page>
  )
}
