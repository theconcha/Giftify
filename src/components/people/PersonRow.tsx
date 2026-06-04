import { Link } from 'react-router-dom'
import type { Person } from '../../types'
import { MONTH_SHORT } from '../../lib/constants'
import PersonAvatar from './PersonAvatar'

export default function PersonRow({ person }: { person: Person }) {
  const birthday = person.birthday_month && person.birthday_day
    ? `${MONTH_SHORT[person.birthday_month - 1]} ${person.birthday_day}${person.birthday_year ? `, ${person.birthday_year}` : ''}`
    : '—'

  return (
    <Link
      to={`/people/${person.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F3EE] transition-colors border-b border-[#E8E0D8] last:border-0"
    >
      <PersonAvatar person={person} size={36} />
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-[#2D2420] text-sm">
          {person.first_name} {person.last_name}
        </span>
        {person.is_archived && (
          <span className="ml-2 text-[10px] bg-[#F0E8E0] text-[#8B7355] px-2 py-0.5 rounded-full font-medium">
            Archived
          </span>
        )}
      </div>
      <span className="text-sm text-[#8B7355] hidden sm:block shrink-0">{birthday}</span>
    </Link>
  )
}
