import { X } from 'lucide-react'

export default function RecipePickerSheet({
  open,
  title,
  recipes,
  loading,
  error,
  onClose,
  onPick,
}) {
  if (!open) {
    return null
  }

  return (
    <>
      <button
        type="button"
        aria-label="Fermer"
        className="fixed inset-0 z-40 bg-charcoal-950/45"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50">
        <section className="h-full w-full overflow-hidden bg-cream-50 p-4 shadow-2xl animate-sheet-up dark:bg-charcoal-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl text-sage-900 dark:text-cream-50">{title}</h3>
            <button
              type="button"
              className="rounded-full p-2 text-sage-700 hover:bg-cream-100 dark:text-cream-300 dark:hover:bg-charcoal-800"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>

          {loading ? <p className="text-sm text-sage-700 dark:text-cream-300">Chargement des recettes...</p> : null}

          {error ? (
            <p className="text-sm text-red-700 dark:text-red-300">Impossible de charger les recettes.</p>
          ) : null}

          <ul className="space-y-2 overflow-y-auto max-h-[calc(100dvh-8rem)] pr-1">
            {recipes.map((recipe) => (
              <li key={recipe.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-2xl border border-cream-200 bg-white px-4 py-3 text-left transition hover:border-sage-300 dark:border-charcoal-700 dark:bg-charcoal-800 dark:hover:border-sage-700"
                  onClick={() => onPick(recipe)}
                >
                  <span className="font-semibold text-sage-900 dark:text-cream-50">{recipe.title}</span>
                  <span className="text-xs text-sage-700 dark:text-cream-300">
                    {recipe.prepTime ? `${recipe.prepTime} min` : 'Temps inconnu'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
