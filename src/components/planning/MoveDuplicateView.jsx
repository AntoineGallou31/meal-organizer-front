import { useId } from 'react'
import { ChevronLeft } from 'lucide-react'
import { formatDayLong, getItemLabel, SLOTS } from '../../lib/mealPlan'
import { getUpcomingDays } from '../../lib/week'

const DAY_HINTS = ["Aujourd'hui", 'Demain']

// Sous-vue du panneau : choix du repas de destination parmi les 14 prochains jours
export default function MoveDuplicateView({ mode, item, origin, onBack, onPick }) {
  const titleId = useId()
  const verb = mode === 'move' ? 'Déplacer' : 'Dupliquer'

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Retour au repas"
          autoFocus
          onClick={onBack}
          className="flex size-11 flex-none items-center justify-center rounded-full bg-sage-100 text-sage-700 transition hover:bg-sage-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-700"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <div className="flex min-w-0 flex-col">
          <h3 id={titleId} className="text-[17px]/6 font-semibold text-sage-900">
            Vers quel repas ?
          </h3>
          <p className="truncate text-xs text-sage-500">
            {verb} « {getItemLabel(item)} »
          </p>
        </div>
      </div>

      <ul className="flex flex-col">
        {getUpcomingDays(14).map(({ value }, index) => {
          const dayLabel = formatDayLong(value)
          return (
            <li key={value} className="flex items-center gap-2 border-b border-sage-100 py-2 last:border-b-0">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium text-sage-900">{dayLabel}</span>
                {DAY_HINTS[index] ? <span className="text-xs text-sage-500">{DAY_HINTS[index]}</span> : null}
              </span>
              {SLOTS.map((slot) => {
                const isOrigin = value === origin.date && slot.key === origin.slot
                return (
                  <button
                    key={slot.key}
                    type="button"
                    disabled={isOrigin}
                    aria-label={`${verb} vers ${dayLabel}, ${slot.label.toLowerCase()}${isOrigin ? ' (repas actuel)' : ''}`}
                    onClick={() => onPick(value, slot.key)}
                    className="h-11 w-[72px] flex-none rounded-xl border border-sage-200 bg-white text-sm font-semibold text-sage-700 transition hover:border-terracotta-200 hover:bg-terracotta-50 hover:text-terracotta-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-700 disabled:cursor-default disabled:border-dashed disabled:bg-transparent disabled:text-sage-400"
                  >
                    {slot.label}
                  </button>
                )
              })}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
