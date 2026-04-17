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
        <section className="h-full w-full overflow-hidden bg-cream-50 p-4 shadow-2xl animate-sheet-up">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl text-sage-900">{title}</h3>
            <button
              type="button"
              className="rounded-full p-2 text-sage-700 hover:bg-cream-100"
              onClick={onClose}
            >
              <X size={30} />
            </button>
          </div>

          {loading ? <p className="text-sm text-sage-700">Chargement des recettes...</p> : null}

          {error ? (
            <p className="text-sm text-red-700">Impossible de charger les recettes.</p>
          ) : null}

          <ul className="space-y-2 overflow-y-auto max-h-[calc(100dvh-8rem)] pr-1">
            {recipes.map((recipe) => (
              <li key={recipe.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-2xl border border-cream-200 bg-white px-4 py-3 text-left transition hover:border-sage-300"
                  onClick={() => onPick(recipe)}
                >
                  <span className="font-semibold text-sage-900">{recipe.title}</span>
                  <span className="text-xs text-sage-700">
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
