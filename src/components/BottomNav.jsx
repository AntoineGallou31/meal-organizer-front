import { CalendarDays, ScrollText } from 'lucide-react'
import { Tabbar, TabbarLink, ToolbarPane } from 'konsta/react'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Planning', icon: CalendarDays },
  { to: '/recipes', label: 'Recettes', icon: ScrollText },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 pb-[calc(.55rem+env(safe-area-inset-bottom))]">
      <Tabbar
        labels
        icons
      >
        <ToolbarPane>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)

            return (
              <TabbarLink
                key={item.to}
                component={Link}
                linkProps={{ to: item.to }}
                active={isActive}
                icon={<Icon size={19} className={isActive ? 'text-sage-700' : 'text-charcoal-600'} />}
                label={item.label}
                className="rounded-xl text-charcoal-700"
              />
            )
          })}
        </ToolbarPane>
      </Tabbar>
    </div>
  )
}
