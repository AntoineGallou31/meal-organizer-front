import clsx from 'clsx'
import { Search, X } from 'lucide-react'

export default function Searchbar({ value, onChange, disableButton, onDisableButtonClick, placeholder = 'Rechercher', className }) {
  return (
    <div className={clsx('flex w-full items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-3 shadow-sm', className)}>
      <Search size={18} className="shrink-0 text-slate-500" />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
      />
      {disableButton ? null : (
        <button
          type="button"
          onClick={onDisableButtonClick}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Effacer la recherche"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}