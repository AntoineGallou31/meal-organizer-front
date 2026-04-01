import { LoaderCircle } from 'lucide-react'

export default function LoadingState({ label = 'Chargement...' }) {
  return (
    <div className="flex min-h-28 items-center justify-center gap-2 rounded-2xl border border-cream-200 bg-cream-100/70 text-sage-700">
      <LoaderCircle className="animate-spin" size={18} />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}
