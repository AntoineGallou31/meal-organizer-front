import { getWriteErrorMessage } from '../../lib/recipes'

// Erreur d'ajout au planning, affichée en bas de l'écran (la barre de navigation y est masquée)
export default function PickErrorToast({ error }) {
  if (!error) return null

  return (
    <div
      role="alert"
      className="fixed inset-x-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-30 mx-auto max-w-lg rounded-2xl bg-sage-900 px-4 py-3 text-sm text-white shadow-[0_12px_32px_rgba(15,23,42,0.24)]"
    >
      <div className="font-semibold">Impossible d’ajouter la recette au planning</div>
      <div className="text-sage-300">{getWriteErrorMessage(error)}</div>
    </div>
  )
}
