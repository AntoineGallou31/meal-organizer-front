import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import PageFrame from '../components/PageFrame'
import { api } from '../lib/api'

export default function ImportRecipePage() {
  const [url, setUrl] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const importMutation = useMutation({
    mutationFn: api.importRecipe,
    onSuccess: (recipe) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      navigate(`/recipes/${recipe.id}`)
    },
  })

  const handleSubmit = (event) => {
    event.preventDefault()
    importMutation.mutate(url)
  }

  return (
    <PageFrame
      title="Importer une recette"
      subtitle="Collez un lien Marmiton, 750g ou blog culinaire."
      action={
        <Link
          to="/recipes"
          className="inline-flex items-center gap-2 rounded-xl border border-sage-300 px-3 py-2 text-xs font-semibold text-sage-700 transition hover:bg-cream-100 dark:border-sage-700 dark:text-cream-300 dark:hover:bg-charcoal-800"
        >
          <ArrowLeft size={14} /> Retour
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-sage-800 dark:text-cream-200">URL de la recette</span>
          <input
            type="url"
            required
            placeholder="https://..."
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="w-full rounded-2xl border border-cream-300 bg-white px-4 py-3 text-sm text-sage-900 outline-none transition focus:border-sage-500 dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-cream-100"
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
      </form>

      {importMutation.isError ? (
        <p className="mt-4 text-sm text-red-700 dark:text-red-300">{importMutation.error.message}</p>
      ) : null}
    </PageFrame>
  )
}
