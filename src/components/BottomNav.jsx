import { CalendarDays, SquareMenu } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Planning', icon: CalendarDays },
  { to: '/recipes', label: 'Recettes', icon: SquareMenu },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <nav className="flex w-full items-center gap-2 border-t border-slate-200 bg-white/90 px-4 py-2 shadow-soft backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)

          return (
            <Link
              key={item.to}
              to={item.to}
              className={[
                'flex flex-col h-16 w-16 flex-1 items-center justify-center rounded-full transition',
                isActive
                  ? 'text-terracotta-500'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
              ].join(' ')}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              title={item.label}
            >
              <Icon size={18} className={isActive ? 'text-terracotta-500' : 'text-slate-600'} />
              <span className="mt-1 text-xs">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
