import clsx from 'clsx'
import { Plus, Minus } from 'lucide-react'

export default function PortionInput({ label, value, onChange, className, min = 1 }) {
  const numValue = Number(value) || 0
  
  const handleDecrease = () => {
    const newValue = Math.max(numValue - 1, min)
    onChange?.({ target: { value: String(newValue) } })
  }
  
  const handleIncrease = () => {
    const newValue = numValue + 1
    onChange?.({ target: { value: String(newValue) } })
  }

  return (
    <label className={clsx('block border-b border-cream-100 px-4 py-3 last:border-b-0', className)}>
      {label ? <div className="mb-2 text-sm font-semibold text-sage-800">{label}</div> : null}
      <div className="flex items-center justify-between rounded-2xl border border-cream-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={handleDecrease}
          disabled={numValue <= min}
          className="flex items-center justify-center rounded-lg p-2 text-sage-700 transition hover:bg-cream-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Minus size={20} />
        </button>
        
        <span className="min-w-12 text-center text-lg font-semibold text-sage-900">
          {numValue}
        </span>
        
        <button
          type="button"
          onClick={handleIncrease}
          className="flex items-center justify-center rounded-lg p-2 text-sage-700 transition hover:bg-cream-100"
        >
          <Plus size={20} />
        </button>
      </div>
    </label>
  )
}
