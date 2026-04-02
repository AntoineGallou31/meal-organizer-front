import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import PageFrame from '../components/PageFrame'
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
    <PageFrame
      title="Importer une recette"
      subtitle="Importez via URL unique ou fichier Pinterest export."
      action={
        <Link
          to="/recipes"
          className="inline-flex items-center gap-2 rounded-xl border border-sage-300 px-3 py-2 text-xs font-semibold text-sage-700 transition hover:bg-cream-100"
        >
          <ArrowLeft size={14} /> Retour
        </Link>
      }
    >
      <div className="mb-4 inline-flex rounded-2xl border border-cream-300 bg-white p-1">
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
            mode === 'url' ? 'bg-sage-600 text-white' : 'text-sage-700 hover:bg-cream-100'
          }`}
        >
          URL unique
        </button>
        <button
          type="button"
          onClick={() => setMode('pinterest')}
          className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
            mode === 'pinterest' ? 'bg-sage-600 text-white' : 'text-sage-700 hover:bg-cream-100'
          }`}
        >
          Fichier Pinterest
        </button>
      </div>

      {mode === 'url' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-sage-800">URL de la recette</span>
            <input
              type="url"
              required
              placeholder="https://..."
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="w-full rounded-2xl border border-cream-300 bg-white px-4 py-3 text-sm text-sage-900 outline-none transition focus:border-sage-500"
            />
          </label>

          <button
            type="submit"
            disabled={importMutation.isPending}
            className="inline-flex items-center gap-2 rounded-2xl bg-sage-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sage-500 disabled:cursor-not-allowed disabled:opacity-80"
          >
            {importMutation.isPending ? <LoaderCircle size={16} className="animate-spin" /> : null}
            Importer
          </button>

          {titleVerificationPrompt?.code === 'TITLE_NEEDS_VERIFICATION' ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-amber-900">Titre a confirmer avant import</p>
                <p className="text-sm text-amber-800">
                  Le titre extrait ne contient pas de mot reconnu dans le dictionnaire. Vous pouvez annuler ou importer la recette avec le statut "à completer".
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-[120px_1fr]">
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

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Infos d'importation</p>
                  <div className="space-y-1 text-sm text-sage-800">
                    <p>
                      <span className="font-semibold">Titre :</span> {preview?.title || 'Titre introuvable'}
                    </p>
                    <p>
                      <span className="font-semibold">Source :</span>{' '}
                      {preview?.sourceUrl ? (
                        <a
                          href={preview.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-sage-700 underline decoration-sage-400 underline-offset-2"
                        >
                          {preview.sourceUrl}
                        </a>
                      ) : (
                        'Source introuvable'
                      )}
                    </p>
                    <p>
                      <span className="font-semibold">Mots reconnus :</span> {matchedKeywords.length ? matchedKeywords.join(', ') : 'Aucun'}
                    </p>
                    <p>
                      <span className="font-semibold">Champs manquants :</span> {missingFields.length ? missingFields.map(formatMissingFieldLabel).join(', ') : 'Aucun'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCancelUnverifiedTitleImport}
                  disabled={importMutation.isPending}
                  className="rounded-xl border border-amber-300 px-4 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-70"
                >
                  Annuler l'import
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUnverifiedTitleImport}
                  disabled={importMutation.isPending}
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:opacity-70"
                >
                  Importer avec statut "à completer"
                </button>
              </div>
            </div>
          ) : null}
        </form>
      ) : (
        <section className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-sage-800">Fichier export Pinterest</span>
            <input
              type="file"
              accept=".txt,.html,.csv"
              onChange={handleFileUpload}
              className="w-full rounded-2xl border border-cream-300 bg-white px-4 py-3 text-sm text-sage-900 outline-none transition focus:border-sage-500"
            />
          </label>

          {fileName ? (
            <p className="text-xs text-sage-700">Fichier charge: {fileName}</p>
          ) : null}

          {fileName && extractedUrls.length > 0 ? (
            <div className="rounded-xl bg-cream-50 p-3 space-y-2">
              <p className="text-xs font-semibold text-sage-800">URLs détectées ({extractedUrls.length}):</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {extractedUrls.slice(0, 5).map((detectedUrl, idx) => (
                  <p key={idx} className="text-xs text-sage-600 break-all truncate">
                    {idx + 1}. {new URL(detectedUrl).hostname}
                  </p>
                ))}
                {extractedUrls.length > 5 ? (
                  <p className="text-xs text-sage-600 italic">
                    ... et {extractedUrls.length - 5} autres
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {fileName && extractedUrls.length === 0 ? (
            <div className="rounded-xl bg-red-50 p-3">
              <p className="text-xs text-red-700">⚠️ Aucune URL de recette détectée dans ce fichier.</p>
              <p className="mt-1 text-xs text-red-600">Vérifiez que le fichier est bien une export Pinterest.</p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handlePinterestImport}
            disabled={importPinterestMutation.isPending || extractedUrls.length === 0}
            className="inline-flex items-center gap-2 rounded-2xl bg-terracotta-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-terracotta-500 disabled:cursor-not-allowed disabled:opacity-80"
          >
            {importPinterestMutation.isPending ? <LoaderCircle size={16} className="animate-spin" /> : null}
            Lancer l'import Pinterest
          </button>

          {importJob?.id ? (
            <div className="rounded-2xl border border-cream-300 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-sage-900">Job: {importJob.id}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={refreshImportStatus}
                    disabled={importStatusMutation.isPending}
                    className="rounded-xl border border-sage-300 px-3 py-1.5 text-xs font-semibold text-sage-700 hover:bg-cream-100 disabled:opacity-60"
                  >
                    {importStatusMutation.isPending ? 'Actualisation...' : 'Actualiser'}
                  </button>
                  <button
                    type="button"
                    onClick={() => cancelImportMutation.mutate(importJob.id)}
                    disabled={cancelImportMutation.isPending || !importStatus || importStatus.status !== 'running'}
                    className="rounded-xl border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    {cancelImportMutation.isPending ? 'Annulation...' : 'Annuler'}
                  </button>
                </div>
              </div>

              {importStatus ? (
                <>
                  <p className="text-sm text-sage-800">
                    Statut: <span className="font-semibold">{importStatus.status}</span>
                  </p>
                  <p className="text-sm text-sage-800">
                    Progression: {importStatus.processed ?? 0}/{importStatus.total ?? 0} ({importStatus.progressPercent ?? 0}%)
                  </p>
                  {importStatus.results ? (
                    <div className="grid grid-cols-2 gap-2 text-xs text-sage-700">
                      <p>Succes: {importStatus.results.success ?? 0}</p>
                      <p>Echecs: {importStatus.results.failed ?? 0}</p>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : null}
        </section>
      )}

      {importMutation.isError && importMutation.error?.details?.code !== 'TITLE_NEEDS_VERIFICATION' ? (
        <p className="mt-4 text-sm text-red-700">{importMutation.error.message}</p>
      ) : null}

      {importPinterestMutation.isError ? (
        <p className="mt-4 text-sm text-red-700">{importPinterestMutation.error.message}</p>
      ) : null}

      {importStatusMutation.isError ? (
        <p className="mt-4 text-sm text-red-700">{importStatusMutation.error.message}</p>
      ) : null}
    </PageFrame>
  )
}
