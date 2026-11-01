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

  return `${start.format('DD/MM')} au ${end.format('DD/MM')}`
}

// "2 – 8 novembre", ou "28 déc. – 3 janv." quand la semaine chevauche deux mois
export function formatWeekRange(date) {
  const start = dayjs(date).startOf('isoWeek')
  const end = start.add(6, 'day')

  if (start.month() === end.month()) {
    return `${start.format('D')} – ${end.format('D MMMM')}`
  }

  return `${start.format('D MMM')} – ${end.format('D MMM')}`
}

export function getDayLabel(date) {
  return DAY_LABELS[dayjs(date).isoWeekday() - 1]
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
