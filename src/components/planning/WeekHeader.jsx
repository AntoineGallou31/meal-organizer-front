import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatWeekRange } from '../../lib/week'

const roundButton =
  'flex size-11 flex-none items-center justify-center rounded-full border border-sage-200 bg-white text-sage-700 transition hover:bg-sage-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-700 focus-visible:ring-offset-2'

export default function WeekHeader({ week, isCurrentWeek, onPrevious, onNext, onToday }) {
  return (
    <header className="flex items-center justify-between gap-2 px-4 pt-4">
      <button type="button" aria-label="Semaine précédente" onClick={onPrevious} className={roundButton}>
        <ChevronLeft size={20} aria-hidden="true" />
      </button>

      <div className="flex min-w-0 flex-col items-center gap-0.5 text-center">
        <h1 className="text-[19px]/[26px] font-semibold tracking-[-0.01em] text-sage-900">{formatWeekRange(week)}</h1>
        <p className="text-xs text-sage-500">
          Semaine {week.isoWeek()} ·{' '}
          {isCurrentWeek ? (
            'cette semaine'
          ) : (
            <button
              type="button"
              onClick={onToday}
              className="relative font-medium text-terracotta-700 after:absolute after:-inset-x-2 after:-inset-y-3.5 after:content-[''] hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-700"
            >
              Revenir à cette semaine
            </button>
          )}
        </p>
      </div>

      <button type="button" aria-label="Semaine suivante" onClick={onNext} className={roundButton}>
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </header>
  )
}
