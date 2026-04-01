import { CalendarDays, ScrollText } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Calendrier', icon: CalendarDays },
  { to: '/recipes', label: 'Recettes', icon: ScrollText },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-sage-200/70 bg-cream-50/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
      <ul className="mx-auto flex max-w-lg items-center justify-around gap-3">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex w-full flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-sage-500 text-cream-50 shadow-soft'
                      : 'text-sage-700 hover:bg-cream-100'
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
