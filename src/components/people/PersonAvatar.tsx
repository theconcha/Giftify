import type { Person } from '../../types'

interface Props {
  person: Person
  size?: number
}

export default function PersonAvatar({ person, size = 48 }: Props) {
  const initials = `${person.first_name[0]}${person.last_name[0]}`.toUpperCase()
  const fontSize = Math.round(size * 0.35)

  if (person.photo_url) {
    return (
      <img
        src={person.photo_url}
        alt={`${person.first_name} ${person.last_name}`}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className="rounded-full bg-[#C2714F] text-white flex items-center justify-center font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize }}
    >
      {initials}
    </div>
  )
}
