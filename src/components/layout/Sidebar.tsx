import { NavLink } from 'react-router-dom'
import { Home, Users, Calendar, Gift, Package, Settings } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Home', icon: <Home size={20} />, end: true },
  { to: '/people', label: 'People', icon: <Users size={20} />, end: false },
  { to: '/occasions', label: 'Occasions', icon: <Calendar size={20} />, end: false },
  { to: '/gifts', label: 'Gifts', icon: <Gift size={20} />, end: false },
  { to: '/products', label: 'Products', icon: <Package size={20} />, end: false },
]

export default function Sidebar() {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 flex-col bg-[#FAF6F1] border-r border-[#E8E0D8] z-20">
      <div className="h-14 flex items-center px-5 border-b border-[#E8E0D8]">
        <span className="text-xl font-extrabold text-[#2D2420] tracking-tight">Giftify</span>
      </div>

      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {navItems.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-[#C2714F] text-white'
                  : 'text-[#2D2420] hover:bg-[#F0E8E0]'
              }`
            }
          >
            {icon}
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-[#E8E0D8]">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isActive ? 'bg-[#C2714F] text-white' : 'text-[#2D2420] hover:bg-[#F0E8E0]'
            }`
          }
        >
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  )
}
