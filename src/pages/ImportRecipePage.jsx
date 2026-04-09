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

function extractUrlsFromText(text) {
  if (!text || typeof text !== 'string') return []

  if (text.includes('Board Name:') && text.includes('Canonical Link:')) {
    const canonicalUrls = []
    const pinBlocks = text.split(/https:\/\/www\.pinterest\.com\/pin\/\d+\//)

    for (let i = 1; i < pinBlocks.length; i += 1) {
      const block = pinBlocks[i]
      const boardNameMatch = block.match(/Board Name:\s*([^<\n]+)/)
      const boardName = boardNameMatch ? boardNameMatch[1].trim() : ''

      if (boardName !== 'Recettes') {
        continue
      }

      const canonicalMatch = block.match(/Canonical Link:\s*<a\s+href="([^"]+)"/)
      const url = canonicalMatch ? canonicalMatch[1] : null

      if (url && url.startsWith('http') && !url.includes('pinterest.com')) {
        canonicalUrls.push(url)
      }
    }

    if (canonicalUrls.length > 0) {
      return [...new Set(canonicalUrls)]
    }
  }

  const matches = text.match(/https?:\/\/[^\s"'<>]+/g) || []
  const urls = [...new Set(matches.map((url) => url.trim()).filter(Boolean))]

  return urls.filter((url) => !url.includes('pinterest.com'))
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
    default:
      return field
  }
}

export default function ImportRecipePage() {
  const [mode, setMode] = useState('url')
  const [url, setUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [extractedUrls, setExtractedUrls] = useState([])
  const [importJob, setImportJob] = useState(null)
  const [importStatus, setImportStatus] = useState(null)
  const [titleVerificationPrompt, setTitleVerificationPrompt] = useState(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const importMutation = useMutation({
    mutationFn: ({ importUrl, forceImportUnverifiedTitle = false }) =>
      api.importRecipe(importUrl, { forceImportUnverifiedTitle }),
    onSuccess: (recipe) => {
      setTitleVerificationPrompt(null)
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      navigate(`/recipes/${recipe.id}`)
    },
    onError: (error) => {
      if (error?.status === 422 && error?.details?.code === 'TITLE_NEEDS_VERIFICATION') {
        setTitleVerificationPrompt(error.details)
      }
    },
  })

  const importPinterestMutation = useMutation({
    mutationFn: api.importPinterestExport,
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
    const text = await file.text()
    setExtractedUrls(extractUrlsFromText(text))
  }

  const handlePinterestImport = () => {
    if (!extractedUrls.length) return
    setImportStatus(null)
    setImportJob(null)
    importPinterestMutation.mutate({ urls: extractedUrls })
  }

  const refreshImportStatus = () => {
    if (!importJob?.id) return
    importStatusMutation.mutate(importJob.id)
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

  const handleConfirmUnverifiedTitleImport = () => {
    const importUrl = titleVerificationPrompt?.recipePreview?.sourceUrl || url
    if (!importUrl) return
    importMutation.mutate({
      importUrl,
      forceImportUnverifiedTitle: true,
    })
  }

  const handleCancelUnverifiedTitleImport = () => {
    setTitleVerificationPrompt(null)
  }

  const preview = titleVerificationPrompt?.recipePreview ?? null
  const missingFields = titleVerificationPrompt?.missingFields ?? []
  const matchedKeywords = titleVerificationPrompt?.titleKeywordsMatched ?? []

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
        <Block className="!m-0 p-0">
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
              Fichier Pinterest
            </Button>
          </div>
        </Block>

        {mode === 'url' ? (
          <form onSubmit={handleSubmit}>
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
            <BlockTitle>Fichier Pinterest</BlockTitle>
            <List strongIos outlineIos>
              <ListItem
                title="Sélectionner un export Pinterest"
                text="Fichiers .txt, .html ou .csv"
                after={
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-sage-300 px-3 py-2 text-xs font-semibold text-sage-700 transition hover:bg-cream-100">
                    <input
                      type="file"
                      accept=".txt,.html,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    Parcourir
                  </label>
                }
              />
            </List>

            {fileName ? (
              <Block className="text-xs text-sage-700">Fichier charge: {fileName}</Block>
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
                  footer="Vérifiez que le fichier est bien une export Pinterest."
                />
              </List>
            ) : null}

            <div className="mt-3">
              <Button
                type="button"
                large
                className="w-full"
                disabled={importPinterestMutation.isPending || extractedUrls.length === 0}
                onClick={handlePinterestImport}
              >
                <span className="inline-flex items-center gap-2">
                  {importPinterestMutation.isPending ? <LoaderCircle size={16} className="animate-spin" /> : null}
                  Lancer l'import Pinterest
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
                      className="!bg-red-600"
                      onClick={() => cancelImportMutation.mutate(importJob.id)}
                      disabled={cancelImportMutation.isPending || !importStatus || importStatus.status !== 'running'}
                    >
                      {cancelImportMutation.isPending ? 'Annulation...' : 'Annuler'}
                    </Button>
                  </div>
                </div>

                {importStatus ? (
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
                ) : null}
              </Block>
            ) : null}
          </section>
        )}

        {titleVerificationPrompt?.code === 'TITLE_NEEDS_VERIFICATION' ? (
          <Block className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-amber-900">Titre a confirmer avant import</p>
              <p className="text-sm text-amber-800">
                Le titre extrait ne contient pas de mot reconnu dans le dictionnaire. Vous pouvez annuler ou importer la recette avec le statut "à completer".
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
                  title="Champs manquants"
                  after={missingFields.length ? missingFields.map(formatMissingFieldLabel).join(', ') : 'Aucun'}
                />
              </List>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button tonal type="button" onClick={handleCancelUnverifiedTitleImport} disabled={importMutation.isPending}>
                Annuler
              </Button>
              <Button type="button" onClick={handleConfirmUnverifiedTitleImport} disabled={importMutation.isPending}>
                Importer quand même
              </Button>
            </div>
          </Block>
        ) : null}

        {importMutation.isError && importMutation.error?.details?.code !== 'TITLE_NEEDS_VERIFICATION' ? (
          <List inset strong>
            <ListItem title="Impossible d'importer la recette" footer={importMutation.error.message} />
          </List>
        ) : null}

        {importPinterestMutation.isError ? (
          <List inset strong>
            <ListItem title="Impossible de lancer l'import Pinterest" footer={importPinterestMutation.error.message} />
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
