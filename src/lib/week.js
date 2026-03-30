import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import 'dayjs/locale/fr'

dayjs.extend(isoWeek)
dayjs.locale('fr')

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function getWeekKey(date) {
  const current = dayjs(date)
  const week = String(current.isoWeek()).padStart(2, '0')
  return `${current.isoWeekYear()}-W${week}`
}

export function getWeekDays(date) {
  const start = dayjs(date).startOf('isoWeek')

  return Array.from({ length: 7 }).map((_, index) => {
    const day = start.add(index, 'day')
    return {
      date: day.format('YYYY-MM-DD'),
      dayLabel: DAY_LABELS[index],
      dayNumber: day.format('D'),
      monthLabel: day.format('MMM'),
    }
  })
}

export function formatWeekLabel(date) {
  const start = dayjs(date).startOf('isoWeek')
  const end = start.add(6, 'day')

  return `Semaine du ${start.format('D MMM')} au ${end.format('D MMM')}`
}

export function getUpcomingDays(count = 14) {
  return Array.from({ length: count }).map((_, index) => {
    const day = dayjs().add(index, 'day')
    return {
      value: day.format('YYYY-MM-DD'),
      label: `${day.format('ddd D MMM')}`,
    }
  })
}
