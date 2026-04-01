import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import PageFrame from '../components/PageFrame'
import IncompleteRecipeModal from '../components/IncompleteRecipeModal'
import { api } from '../lib/api'

export default function ImportRecipePage() {
  const [url, setUrl] = useState('')
  const [incompleteRecipe, setIncompleteRecipe] = useState(null)
  const [missingFields, setMissingFields] = useState([])
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const importMutation = useMutation({
    mutationFn: api.importRecipe,
    onSuccess: (recipe) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      
      // Check if the recipe is incomplete
      if (recipe.incomplete) {
        setIncompleteRecipe(recipe)
        setMissingFields(recipe.missingFields)
      } else {
        navigate(`/recipes/${recipe.id}`)
      }
    },
  })

  const completeRecipeMutation = useMutation({
    mutationFn: (recipe) => api.updateRecipe(recipe.id, recipe),
    onSuccess: (recipe) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      navigate(`/recipes/${recipe.id}`)
    },
  })

  const handleSubmit = (event) => {
    event.preventDefault()
    importMutation.mutate(url)
  }

  const handleConfirmIncompleteRecipe = (completedRecipe) => {
    completeRecipeMutation.mutate(completedRecipe)
  }

  const handleCancelIncompleteRecipe = () => {
    setIncompleteRecipe(null)
    setMissingFields([])
  }

  return (
    <PageFrame
      title="Importer une recette"
      subtitle="Collez un lien Marmiton, 750g ou blog culinaire."
      action={
        <Link
          to="/recipes"
          className="inline-flex items-center gap-2 rounded-xl border border-sage-300 px-3 py-2 text-xs font-semibold text-sage-700 transition hover:bg-cream-100"
        >
          <ArrowLeft size={14} /> Retour
        </Link>
      }
    >
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
      </form>

      {importMutation.isError ? (
        <p className="mt-4 text-sm text-red-700">{importMutation.error.message}</p>
      ) : null}

      {incompleteRecipe && (
        <IncompleteRecipeModal
          recipe={incompleteRecipe}
          missingFields={missingFields}
          isLoading={completeRecipeMutation.isPending}
          onConfirm={handleConfirmIncompleteRecipe}
          onCancel={handleCancelIncompleteRecipe}
        />
      )}
    </PageFrame>
  )
}
