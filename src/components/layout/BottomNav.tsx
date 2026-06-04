import { NavLink } from 'react-router-dom'
import { Users, Calendar, Gift, Package } from 'lucide-react'
import GiftifyIcon from '../icons/GiftifyIcon'

const navItems = [
  { to: '/', label: null, icon: <GiftifyIcon size={30} />, end: true },
  { to: '/people', label: 'People', icon: <Users size={22} />, end: false },
  { to: '/occasions', label: 'Occasions', icon: <Calendar size={22} />, end: false },
  { to: '/gifts', label: 'Gifts', icon: <Gift size={22} />, end: false },
  { to: '/products', label: 'Products', icon: <Package size={22} />, end: false },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#FAF6F1] border-t border-[#E8E0D8] flex md:hidden z-20">
      {navItems.map(({ to, label, icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
              isActive ? 'text-[#C2714F]' : 'text-[#8B7355]'
            }`
          }
        >
          {icon}
          {label && <span>{label}</span>}
        </NavLink>
      ))}
    </nav>
  )
}
