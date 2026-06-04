import { Link } from 'react-router-dom'
import type { Person } from '../../types'
import { MONTH_SHORT } from '../../lib/constants'
import PersonAvatar from './PersonAvatar'

export default function PersonCard({ person }: { person: Person }) {
  const birthday = person.birthday_month && person.birthday_day
    ? `${MONTH_SHORT[person.birthday_month - 1]} ${person.birthday_day}`
    : null

  return (
    <Link
      to={`/people/${person.id}`}
      className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-[#E8E0D8] hover:shadow-md transition-shadow"
    >
      <PersonAvatar person={person} size={52} />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[#2D2420] truncate">
          {person.first_name} {person.last_name}
        </p>
        {birthday && (
          <p className="text-xs text-[#8B7355] mt-0.5">🎂 {birthday}</p>
        )}
        {person.is_archived && (
          <span className="inline-block mt-1 text-[10px] bg-[#F0E8E0] text-[#8B7355] px-2 py-0.5 rounded-full font-medium">
            Archived
          </span>
        )}
      </div>
    </Link>
  )
}
