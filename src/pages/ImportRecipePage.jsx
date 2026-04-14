import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, LoaderCircle, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  Block,
  BlockTitle,
  Button,
  List,
  ListInput,
  ListItem,
  Navbar,
  Page,
  Preloader,
} from 'konsta/react'
import { api } from '../lib/api'

function collectUrls(value) {
  if (typeof value === 'string') {
    return [value]
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectUrls(item))
  }

  if (value && typeof value === 'object') {
    return Object.values(value).flatMap((item) => collectUrls(item))
  }

  return []
}

function extractUrlsFromJsonContent(rawText) {
  if (!rawText || typeof rawText !== 'string') return []

  const parsed = JSON.parse(rawText)
  const candidates = collectUrls(parsed)

  return [...new Set(
    candidates
      .map((url) => String(url || '').trim())
      .filter((url) => /^https?:\/\//i.test(url)),
  )]
}

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
  const [mode, setMode] = useState('url')
  const [url, setUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [extractedUrls, setExtractedUrls] = useState([])
  const [fileError, setFileError] = useState('')
  const [importJob, setImportJob] = useState(null)
  const [importStatus, setImportStatus] = useState(null)
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

  const importUrlsMutation = useMutation({
    mutationFn: api.importUrlsJson,
    onSuccess: (job) => {
      setImportJob(job)
      setImportStatus(job)
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })

  const importStatusMutation = useMutation({
    mutationFn: api.getImportStatus,
    onSuccess: (status) => {
      setImportStatus(status)
      if (status.status === 'completed' || status.status === 'failed') {
        queryClient.invalidateQueries({ queryKey: ['recipes'] })
      }
    },
  })

  const cancelImportMutation = useMutation({
    mutationFn: api.cancelImport,
    onSuccess: () => {
      if (importJob?.id) importStatusMutation.mutate(importJob.id)
    },
  })

  const resolveImportIssueMutation = useMutation({
    mutationFn: ({ importUrl, forceImportMode }) =>
      api.importRecipe(importUrl, { forceImportMode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      if (importJob?.id) importStatusMutation.mutate(importJob.id)
    },
  })

  const handleSubmit = (event) => {
    event.preventDefault()
    if (mode !== 'url') return
    setTitleVerificationPrompt(null)
    importMutation.mutate({ importUrl: url })
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setFileError('')

    try {
      const text = await file.text()
      const urls = extractUrlsFromJsonContent(text)
      setExtractedUrls(urls)
      if (!urls.length) {
        setFileError('Aucune URL valide trouvée dans le JSON.')
      }
    } catch {
      setExtractedUrls([])
      setFileError('Le fichier doit être un JSON valide contenant des URLs.')
    }
  }

  const handleUrlsImport = () => {
    if (!extractedUrls.length) return
    setImportStatus(null)
    setImportJob(null)
    importUrlsMutation.mutate({ urls: extractedUrls })
  }

  const refreshImportStatus = () => {
    if (!importJob?.id) return
    importStatusMutation.mutate(importJob.id)
  }

  const handleResolveImportIssue = (errorItem, forceImportMode) => {
    const importUrl =
      errorItem?.details?.scrapedContent?.sourceUrl ||
      errorItem?.url ||
      null

    if (!importUrl) return

    resolveImportIssueMutation.mutate({ importUrl, forceImportMode })
  }

  useEffect(() => {
    if (!importJob?.id) return
    if (!importStatus || importStatus.status === 'running') {
      const intervalId = setInterval(() => {
        importStatusMutation.mutate(importJob.id)
      }, 2000)

      return () => clearInterval(intervalId)
    }
  }, [importJob?.id, importStatus, importStatusMutation])

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
              Vous pouvez importer une recette avec une URL unique, ou charger un fichier JSON contenant une liste d'URLs de recettes.
            </p>
          </div>
        </Block>

        <Block className="m-0! p-0">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-cream-200">
            <Button
              small
              tonal={mode !== 'url'}
              className="w-full"
              onClick={() => setMode('url')}
            >
              URL unique
            </Button>
            <Button
              small
              tonal={mode !== 'pinterest'}
              className="w-full"
              onClick={() => setMode('pinterest')}
            >
              Liste JSON
            </Button>
          </div>
        </Block>

        {mode === 'url' ? (
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
        ) : (
          <section>
            <BlockTitle>Liste JSON d'URLs</BlockTitle>
            <Block className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-cream-200">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-sage-900">Format attendu</p>
                <p className="text-sm text-sage-700">
                  Le fichier doit être un JSON valide. Le plus simple est un objet contenant une clé <span className="font-semibold">urls</span> avec un tableau d'URLs.
                </p>
                <div className="rounded-xl bg-sage-50 p-3 text-xs text-sage-800 ring-1 ring-sage-100">
                  {`{
  "urls": [
    "https://exemple.com/recette-1",
    "https://exemple.com/recette-2"
  ]
}`}
                </div>
                <p className="text-sm text-sage-700">
                  Le contenu peut aussi être imbriqué dans d'autres objets ou tableaux, tant que des chaînes HTTPS/HTTP de recettes sont présentes.
                </p>
              </div>
            </Block>

            <List strongIos outlineIos>
              <ListItem
                title="Sélectionner un fichier JSON de recettes"
                text="Le fichier doit contenir une liste d'URLs de recettes en HTTP ou HTTPS."
                after={
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-sage-300 px-3 py-2 text-xs font-semibold text-sage-700 transition hover:bg-cream-100">
                    <input
                      type="file"
                      accept="application/json,.json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    Parcourir
                  </label>
                }
              />
            </List>

            {fileName ? (
              <Block className="text-xs text-sage-700">Fichier chargé: {fileName}</Block>
            ) : null}

            {fileError ? (
              <List inset strong>
                <ListItem title="Fichier invalide" footer={fileError} />
              </List>
            ) : null}

            {fileName && extractedUrls.length > 0 ? (
              <List inset strong>
                <ListItem
                  title={`URLs détectées (${extractedUrls.length})`}
                  text={extractedUrls.slice(0, 5).map((detectedUrl, index) => `${index + 1}. ${new URL(detectedUrl).hostname}`).join('\n')}
                />
                {extractedUrls.length > 5 ? (
                  <ListItem title={`... et ${extractedUrls.length - 5} autres`} />
                ) : null}
              </List>
            ) : null}

            {fileName && extractedUrls.length === 0 ? (
              <List inset strong>
                <ListItem
                  title="Aucune URL de recette détectée"
                  footer="Vérifiez que le JSON contient une liste d'URLs HTTP/HTTPS."
                />
              </List>
            ) : null}

            <div className="mt-3">
              <Button
                type="button"
                large
                className="w-full"
                disabled={importUrlsMutation.isPending || extractedUrls.length === 0}
                onClick={handleUrlsImport}
              >
                <span className="inline-flex items-center gap-2">
                  {importUrlsMutation.isPending ? <LoaderCircle size={16} className="animate-spin" /> : null}
                  Lancer l'import des recettes
                </span>
              </Button>
            </div>

            {importJob?.id ? (
              <Block className="mt-4 space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-cream-200">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-sage-900">Job: {importJob.id}</div>
                    <div className="text-sm text-sage-700">Suivi de l'import en arrière-plan</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      small
                      tonal
                      onClick={refreshImportStatus}
                      disabled={importStatusMutation.isPending}
                    >
                      {importStatusMutation.isPending ? 'Actualisation...' : 'Actualiser'}
                    </Button>
                    <Button
                      small
                      className="bg-red-600!"
                      onClick={() => cancelImportMutation.mutate(importJob.id)}
                      disabled={cancelImportMutation.isPending || !importStatus || importStatus.status !== 'running'}
                    >
                      {cancelImportMutation.isPending ? 'Annulation...' : 'Annuler'}
                    </Button>
                  </div>
                </div>

                {importStatus ? (
                  <>
                    <List strongIos outlineIos>
                      <ListItem title="Statut" after={<span className="font-semibold">{importStatus.status}</span>} />
                      <ListItem
                        title="Progression"
                        after={`${importStatus.processed ?? 0}/${importStatus.total ?? 0} (${importStatus.progressPercent ?? 0}%)`}
                      />
                      {importStatus.results ? (
                        <ListItem
                          title="Résultats"
                          text={`Succès: ${importStatus.results.success ?? 0} | Échecs: ${importStatus.results.failed ?? 0}`}
                        />
                      ) : null}
                    </List>

                    {Array.isArray(importStatus?.results?.errors) && importStatus.results.errors.length > 0 ? (
                      <List inset strong className="mt-3">
                        {importStatus.results.errors.map((errorItem, index) => {
                          const errorDetails = errorItem?.details ?? null
                          const validationType = errorDetails?.validationType ?? null
                          const canForceIncomplete = Boolean(errorDetails?.canForceIncomplete)
                          const canImportWithoutContent = Boolean(errorDetails?.canImportWithoutContent)
                          const importReasons = Array.isArray(errorDetails?.importValidation?.reasons)
                            ? errorDetails.importValidation.reasons
                            : []
                          const fieldErrorText = Array.isArray(errorDetails?.fieldErrors)
                            ? errorDetails.fieldErrors.map((entry) => `${formatMissingFieldLabel(entry.field)}: ${entry.message}`).join('\n')
                            : ''
                          const debugLines = [
                            errorItem?.code ? `Code: ${errorItem.code}` : null,
                            errorDetails?.importValidation?.score != null
                              ? `Score cohérence: ${errorDetails.importValidation.score}`
                              : null,
                            fieldErrorText || null,
                            importReasons.length ? `Raisons: ${importReasons.join(' | ')}` : null,
                          ].filter(Boolean).join('\n')

                          return (
                            <div key={`${errorItem.url || 'unknown'}-${index}`} className="space-y-2">
                              <ListItem
                                title={errorItem.url || 'URL inconnue'}
                                footer={errorItem.message || 'Erreur d\'import'}
                                text={debugLines || null}
                              />

                              {(canForceIncomplete || canImportWithoutContent) ? (
                                <div className="grid gap-2 md:grid-cols-2">
                                  {canForceIncomplete ? (
                                    <Button
                                      small
                                      type="button"
                                      onClick={() => handleResolveImportIssue(errorItem, 'incomplete')}
                                      disabled={resolveImportIssueMutation.isPending}
                                    >
                                      Importer en "à completer"
                                    </Button>
                                  ) : null}

                                  {(validationType === 'content' || canImportWithoutContent) ? (
                                    <Button
                                      small
                                      type="button"
                                      tonal
                                      onClick={() => handleResolveImportIssue(errorItem, 'contentless')}
                                      disabled={resolveImportIssueMutation.isPending}
                                    >
                                      Importer sans contenu
                                    </Button>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          )
                        })}
                      </List>
                    ) : null}

                    {resolveImportIssueMutation.isError ? (
                      <List inset strong className="mt-3">
                        <ListItem
                          title="Impossible d'appliquer le choix d'import"
                          footer={resolveImportIssueMutation.error?.message}
                        />
                      </List>
                    ) : null}
                  </>
                ) : null}
              </Block>
            ) : null}
          </section>
        )}

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

        {importUrlsMutation.isError ? (
          <List inset strong>
            <ListItem title="Impossible de lancer l'import" footer={importUrlsMutation.error.message} />
          </List>
        ) : null}

        {importStatusMutation.isError ? (
          <List inset strong>
            <ListItem title="Impossible d'actualiser le statut" footer={importStatusMutation.error.message} />
          </List>
        ) : null}

        {!importJob?.id && !titleVerificationPrompt ? (
          <Block className="flex items-center gap-2 rounded-2xl bg-sage-50 p-4 text-sm text-sage-700 ring-1 ring-sage-100">
            <Preloader />
            <span>Choisissez un mode d'import pour commencer.</span>
          </Block>
        ) : null}
      </Block>
    </Page>
  )
}
