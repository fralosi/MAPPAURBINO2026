import React, { useState, useRef, useEffect } from 'react'

type Message = {
  id: string
  from_user: string
  from_name: string
  message: string
  created_at: string
  local?: boolean // indica messaggio locale/temporaneo
}

type InteractionBoxProps = {
  messages: Message[]
  currentUserId: string
  onSendMessage: (text: string) => void
  onSendRequest?: (type: "break" | "study-group", toUserId?: string) => void
}

export default function InteractionBox({
  messages = [],
  currentUserId,
  onSendMessage,
  onSendRequest
}: InteractionBoxProps) {
  const [input, setInput] = useState('')
  const msgEndRef = useRef<HTMLDivElement>(null)

  // Scrolla in fondo se arrivano nuovi messaggi
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (input.trim()) {
      onSendMessage(input)
      setInput('')
    }
  }

  return (
    <section className="w-full mt-3 flex flex-col">
      <h2 className="text-lg font-bold mb-2">Chat locale / Interazioni</h2>
      <div
        className="bg-blur/70 rounded-xl flex-1 px-3 py-2 overflow-y-auto border min-h-[180px] max-h-[250px]"
        style={{ boxShadow: '0 1px 4px rgba(45,60,130,0.06)' }}
        aria-label="Chat locale"
      >
        <ul className="flex flex-col gap-1 text-sm">
          {messages.length === 0 && <li className="text-gray-400 italic">Nessun messaggio...</li>}
          {messages.map(msg => (
            <li key={msg.id}
              className={`flex gap-2 items-center ${msg.from_user === currentUserId ? 'justify-end' : ''}`}
            >
              <span
                className={`rounded px-2 py-1 ${msg.from_user === currentUserId ? 'bg-primary' : 'bg-secondary'} shadow-sm`}
                title={msg.from_name}
              >
                <b>{msg.from_user === currentUserId ? "Tu" : msg.from_name}:</b> {msg.message}
              </span>
              <time className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</time>
            </li>
          ))}
        </ul>
        <div ref={msgEndRef} />
      </div>

      <form className="flex mt-2 gap-2" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 rounded-lg border px-3 py-1 focus:ring-2 focus:border-accent bg-white/80"
          placeholder="Scrivi un messaggio…"
          maxLength={240}
          aria-label="Scrivi messaggio in chat"
        />
        <button type="submit" className="btn bg-primary px-3 py-1 rounded-lg font-bold">Invia</button>
        {onSendRequest && (
          // Esempio: richiesta pausa/gruppo studio
          <>
            <button
              type="button"
              title="Chiedi pausa insieme"
              className="btn bg-accent px-2 py-1 rounded-lg text-xs"
              onClick={() => onSendRequest("break")}
            >
              ☕ Pausa
            </button>
            <button
              type="button"
              title="Crea gruppo studio"
              className="btn bg-secondary px-2 py-1 rounded-lg text-xs"
              onClick={() => onSendRequest("study-group")}
            >
              👥 Studio
            </button>
          </>
        )}
      </form>
    </section>
  )
}
