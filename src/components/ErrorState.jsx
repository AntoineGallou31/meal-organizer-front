import { AlertCircle } from 'lucide-react'

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
      <div className="flex items-center gap-2">
        <AlertCircle size={30} />
        <p className="text-sm font-semibold">{message ?? 'Une erreur est survenue.'}</p>
      </div>
      {onRetry ? (
        <button
          type="button"
          className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
          onClick={onRetry}
        >
          Réessayer
        </button>
      ) : null}
    </div>
  )
}
