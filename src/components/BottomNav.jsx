import { CalendarDays, ScrollText } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Planning', icon: CalendarDays },
  { to: '/recipes', label: 'Recettes', icon: ScrollText },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <nav className="mx-auto flex max-w-md items-center gap-2 rounded-full border border-white/70 bg-white/88 p-2 shadow-soft backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)

          return (
            <Link
              key={item.to}
              to={item.to}
              className={[
                'flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition',
                isActive
                  ? 'bg-sage-700 text-white shadow-soft'
                  : 'text-charcoal-600 hover:bg-cream-100 hover:text-sage-900',
              ].join(' ')}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-sage-600'} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
