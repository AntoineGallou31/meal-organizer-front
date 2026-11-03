import clsx from 'clsx'
import dayjs from 'dayjs'
import { formatDayShort, getSlotItems, SLOTS } from '../../lib/mealPlan'
import { getDayLabel } from '../../lib/week'
import MealCell from './MealCell'

const ROW_GRID = 'grid grid-cols-[44px_minmax(0,1fr)_minmax(0,1fr)] gap-2'

export default function WeekGrid({ days, loading = false, onOpenSlot }) {
  const today = dayjs()

  return (
    <section aria-label="Repas de la semaine" aria-busy={loading} className="flex flex-col gap-1 px-4 pt-3.5">
      <div className={clsx(ROW_GRID, 'px-1.5 pb-0.5')}>
        <span />
        {SLOTS.map((slot) => (
          <span key={slot.key} className="text-[11px]/4 font-semibold uppercase tracking-[0.06em] text-sage-500">
            {slot.label}
          </span>
        ))}
      </div>

      {days.map((day) => {
        const date = dayjs(day.date)
        const isToday = date.isSame(today, 'day')
        const isPast = date.isBefore(today, 'day')

        return (
          <div
            key={day.date}
            aria-current={isToday ? 'date' : undefined}
            className={clsx(ROW_GRID, 'items-stretch rounded-[18px] px-1.5 py-[5px]', isToday && 'bg-terracotta-50')}
          >
            <div className="flex flex-col items-center justify-center gap-0.5">
              <span className={clsx('text-[11px]/[14px] font-medium', isToday ? 'text-terracotta-700' : 'text-sage-500')}>
                {getDayLabel(day.date)}
              </span>
              {isToday ? (
                <span className="flex size-8 items-center justify-center rounded-full bg-terracotta-700 text-base font-semibold text-white">
                  {date.format('D')}
                </span>
              ) : (
                <span className={clsx('flex h-8 items-center text-lg font-semibold', isPast ? 'text-sage-500' : 'text-sage-900')}>
                  {date.format('D')}
                </span>
              )}
            </div>

            {SLOTS.map((slot) => (
              <div key={slot.key} className="flex min-w-0">
                {loading ? (
                  <div aria-hidden="true" className="min-h-14 w-full animate-pulse rounded-[14px] bg-sage-100" />
                ) : (
                  <MealCell
                    items={getSlotItems(day, slot.key)}
                    label={`${formatDayShort(day.date)}, ${slot.label.toLowerCase()}`}
                    onOpen={() => onOpenSlot(day.date, slot.key)}
                  />
                )}
              </div>
            ))}
          </div>
        )
      })}
    </section>
  )
}
