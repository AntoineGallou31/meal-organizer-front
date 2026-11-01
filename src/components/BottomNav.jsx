import { useEffect, useRef } from 'react'
import { CalendarDays, SquareMenu } from 'lucide-react'
import clsx from 'clsx'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Planning', icon: CalendarDays },
  { to: '/recipes', label: 'Recettes', icon: SquareMenu },
]

export default function BottomNav() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const lastVisitedRef = useRef({ '/': '/', '/recipes': '/recipes' })

  useEffect(() => {
    // Only remember the exact list route (e.g. "/recipes"), not sub-routes
    // like "/recipes/:id" or "/recipes/new" — those aren't the tab's landing page.
    // Also skip the recipe-picker mode (?mode=select, opened from the planning
    // tab to attach a recipe to a slot) — it's a transient picker, not a state
    // of the recipes list the user would want to land back on via the tab.
    const isRecipePickerMode = new URLSearchParams(search).get('mode') === 'select'
    const item = navItems.find((candidate) => candidate.to === pathname)
    if (item && !isRecipePickerMode) {
      lastVisitedRef.current[item.to] = `${pathname}${search}`
    }
  }, [pathname, search])

  // An inactive tab brings back the last visited state of that tab. The ref is
  // read here rather than during render, so the link's href stays the tab root.
  const handleClick = (event, item, isActive) => {
    if (isActive || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(lastVisitedRef.current[item.to])
  }

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-30 grid h-[calc(64px+max(20px,env(safe-area-inset-bottom)))] grid-cols-2 gap-2 border-t border-sage-200 bg-white px-6 pt-2 pb-[max(20px,env(safe-area-inset-bottom))]"
    >
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)

        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={(event) => handleClick(event, item, isActive)}
            aria-current={isActive ? 'page' : undefined}
            className={clsx(
              'flex flex-col items-center justify-center gap-1 rounded-2xl text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-700',
              isActive ? 'font-semibold text-terracotta-700' : 'font-medium text-sage-500 hover:text-sage-700',
            )}
          >
            <span
              className={clsx(
                'flex h-[30px] w-14 items-center justify-center rounded-[15px]',
                isActive && 'bg-terracotta-100',
              )}
            >
              <Icon size={20} aria-hidden="true" />
            </span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
