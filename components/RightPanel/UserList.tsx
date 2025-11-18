import React from 'react'

type User = {
  id: string
  display_name: string
  avatar_url?: string
  isOnline: boolean
  isFocus: boolean
  distance?: number // km, opzionale
  share_location: boolean
  highlighted?: boolean
}

type UserListProps = {
  users: User[]
  currentUserId: string
  onFollow?: (userId: string) => void
  onHighlight?: (userId: string) => void
}

export default function UserList({
  users,
  currentUserId,
  onFollow,
  onHighlight
}: UserListProps) {
  return (
    <section aria-label="Utenti online" className="flex flex-col gap-2">
      <h2 className="text-xl font-bold mb-3">Utenti Online</h2>
      <ul className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: '65vh' }}>
        {users.length === 0 && (
          <li className="text-gray-500 text-sm">Nessun utente online</li>
        )}
        {users.map(u => (
          <li
            key={u.id}
            className={
              `flex items-center gap-3 px-3 py-2 rounded-xl transition focus:outline-none
              ${u.highlighted ? 'ring-2 ring-accent' : ''}
              ${u.isOnline ? '' : 'opacity-50'}`
            }
            tabIndex={0}
            aria-current={u.id === currentUserId}
          >
            {/* Avatar */}
            <img
              src={u.avatar_url || 'https://avatars.dicebear.com/api/initials/' + (u.display_name || 'U') + '.svg'}
              alt={`Avatar ${u.display_name}`}
              className="w-8 h-8 rounded-full border border-white/60 bg-gray-200"
            />

            {/* Nome e stato */}
            <div className="flex-1 flex flex-col">
              <span className="font-semibold">{u.display_name}{u.id === currentUserId && " (Tu)"}</span>
              <span className="flex gap-2 items-center text-xs text-gray-600">
                {u.isFocus ? (
                  <span className="text-green-600 font-bold">Focus</span>
                ) : (
                  <span className="text-yellow-600">Pausa</span>
                )}
                {!u.share_location && (
                  <span className="italic text-gray-400">[anonimo]</span>
                )}
                {u.distance !== undefined && u.id !== currentUserId && (
                  <span className="">{Math.round(u.distance * 10) / 10} km</span>
                )}
              </span>
            </div>

            {/* Azioni */}
            {u.id !== currentUserId && (
              <div className="flex gap-2">
                {onFollow && (
                  <button
                    title="Segui utente"
                    className="btn bg-primary rounded-lg px-2 py-1 text-xs"
                    onClick={() => onFollow(u.id)}
                  >
                    Segui
                  </button>
                )}
                {onHighlight && (
                  <button
                    title="Metti in primo piano"
                    className="btn bg-accent rounded-lg px-2 py-1 text-xs"
                    onClick={() => onHighlight(u.id)}
                  >
                    Evidenzia
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
