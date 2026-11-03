import clsx from 'clsx'
import { Clock, Leaf } from 'lucide-react'
import { FOCUS_RING } from './styles'

const FILTER_CHIPS = {
  saison: { label: 'De saison', icon: Leaf },
  rapide: { label: 'Moins de 30 min', icon: Clock },
  jamais: { label: 'Jamais faites' },
}

function FilterChip({ pressed, onClick, icon, children }) {
  const Icon = icon

  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={clsx(
        'flex h-11 flex-none items-center gap-1.5 rounded-[22px] border px-3.5 text-[13px] font-medium transition',
        pressed
          ? 'border-sage-900 bg-sage-900 text-white'
          : 'border-sage-200 bg-white text-sage-700 hover:border-sage-300',
        FOCUS_RING,
        'focus-visible:ring-offset-2',
      )}
    >
      {Icon ? <Icon size={14} aria-hidden="true" /> : null}
      {children}
    </button>
  )
}

// Rangée défilante : les filtres disponibles (`filterIds`), puis le tri « Les plus faites »
export default function FolderFilters({ filterIds, active, onToggle, popular, onTogglePopular }) {
  return (
    <div role="group" aria-label="Filtres" className="flex gap-2 overflow-x-auto px-4 pt-3 pb-1 whitespace-nowrap">
      {filterIds.map((id) => (
        <FilterChip key={id} pressed={active.has(id)} onClick={() => onToggle(id)} icon={FILTER_CHIPS[id].icon}>
          {FILTER_CHIPS[id].label}
        </FilterChip>
      ))}
      <FilterChip pressed={popular} onClick={onTogglePopular}>
        Les plus faites
      </FilterChip>
    </div>
  )
}
