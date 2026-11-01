import { useState } from 'react'
import dayjs from 'dayjs'
import { X } from 'lucide-react'
import { Sheet } from '../ui'
import { formatDayLong, getSlotLabel } from '../../lib/mealPlan'

const SHEET_SURFACE =
  'flex h-[min(760px,92dvh)] flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_-8px_30px_rgba(15,23,42,0.12)]'

export default function MealSheet({ target, onClose }) {
  // Garde le dernier créneau affiché pour que le contenu reste visible pendant l'animation de fermeture
  const [shownTarget, setShownTarget] = useState(target)
  if (target && (target.date !== shownTarget?.date || target.slot !== shownTarget?.slot)) {
    setShownTarget(target)
  }

  const current = target ?? shownTarget
  const isToday = current ? dayjs(current.date).isSame(dayjs(), 'day') : false
  const dayLabel = current ? formatDayLong(current.date) : ''
  const slotLabel = current ? getSlotLabel(current.slot) : ''

  return (
    <Sheet
      opened={Boolean(target)}
      onBackdropClick={onClose}
      title={`${dayLabel}, ${slotLabel.toLowerCase()}`}
      surfaceClassName={SHEET_SURFACE}
      className="mx-auto max-w-xl"
    >
      <div className="flex flex-none flex-col gap-4 px-5 pt-2">
        <div aria-hidden="true" className="h-[5px] w-10 self-center rounded-[3px] bg-sage-300" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-xs font-semibold uppercase tracking-[0.04em] text-terracotta-700">
              {dayLabel}
              {isToday ? " · Aujourd'hui" : null}
            </p>
            <h2 className="text-[22px]/[30px] font-semibold tracking-[-0.01em] text-sage-900">{slotLabel}</h2>
          </div>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="flex size-11 flex-none items-center justify-center rounded-full bg-sage-100 text-sage-700 transition hover:bg-sage-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-700"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-4" />

      <div className="flex-none px-5 pt-4 pb-6">
        <button
          type="button"
          onClick={onClose}
          className="h-[52px] w-full rounded-[14px] bg-terracotta-700 text-base font-semibold text-white transition hover:bg-terracotta-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-700 focus-visible:ring-offset-2"
        >
          Terminé
        </button>
      </div>
    </Sheet>
  )
}
