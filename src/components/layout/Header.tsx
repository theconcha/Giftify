import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Header() {
  const { user } = useAuth()
  const displayName = user?.user_metadata?.display_name as string | undefined
  const initial = (displayName?.trim()?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-[#E8E0D8] bg-[#FAF6F1] sticky top-0 z-10">
      <Link to="/" className="text-xl font-extrabold text-[#2D2420] tracking-tight">
        Giftify
      </Link>
      <div className="flex items-center gap-3">
        <button className="text-[#2D2420] hover:text-[#C2714F] transition-colors" aria-label="Notifications">
          <Bell size={22} />
        </button>
        <Link
          to="/settings"
          className="w-8 h-8 rounded-full bg-[#C2714F] text-white text-sm font-bold flex items-center justify-center hover:bg-[#A85E3E] transition-colors"
          aria-label="Settings"
        >
          {initial}
        </Link>
      </div>
    </header>
  )
}
