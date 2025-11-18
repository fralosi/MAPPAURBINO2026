import React, { useState, useRef, useEffect } from 'react'

type TimerState = 'focus' | 'break' | 'idle'

const POMODORO_DURATION = 25 * 60 // 25 min in secondi
const BREAK_DURATION = 5 * 60     // 5 min in secondi

export default function Timer({
  onStateChange,
  publishState
}: {
  onStateChange?: (state: TimerState) => void
  publishState?: (state: TimerState) => void // pubblica su mappa/stato utente
}) {
  const [seconds, setSeconds] = useState(POMODORO_DURATION)
  const [active, setActive] = useState(false)
  const [mode, setMode] = useState<TimerState>('idle')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [focusStreak, setFocusStreak] = useState(0)
  const [todayFocusMinutes, setTodayFocusMinutes] = useState(0)

  // Gestione timer
  useEffect(() => {
    if (active && mode !== 'idle') {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev > 0) return prev - 1
          else return 0
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current as any)
  }, [active, mode])

  // Cambio stato timer/scadenza
  useEffect(() => {
    if (seconds === 0 && active) {
      if (mode === 'focus') {
        setMode('break')
        setSeconds(BREAK_DURATION)
        setFocusStreak(s => s + 1)
        setTodayFocusMinutes(m => m + POMODORO_DURATION / 60)
      } else if (mode === 'break') {
        setMode('focus')
        setSeconds(POMODORO_DURATION)
      }
      if (onStateChange) onStateChange(mode)
      if (publishState) publishState(mode)
      setActive(false)
    }
    // eslint-disable-next-line
  }, [seconds, active, mode])

  // Aggiorna stato utente (pubblica su realtime/mappa)
  useEffect(() => {
    if (publishState) publishState(mode)
    // eslint-disable-next-line
  }, [mode])

  // Pulsanti azione
  function handleStart() {
    setActive(true)
    setMode('focus')
    setSeconds(POMODORO_DURATION)
  }
  function handlePause() {
    setActive(false)
  }
  function handleReset() {
    setActive(false)
    setMode('idle')
    setSeconds(POMODORO_DURATION)
  }

  // Formattazione tempo
  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <section className="flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">Pomodoro Timer</h2>
      <div className="liquid-glass px-7 py-6 flex flex-col items-center border mb-6">
        <span className="text-4xl font-mono tracking-wide mb-4">{formatTime(seconds)}</span>
        <span className="mb-3 text-lg">{mode === 'focus' ? 'Focus' : mode === 'break' ? 'Pausa' : 'Pronto'}</span>
        <div className="flex gap-3">
          {!active && mode !== 'focus' && (
            <button className="btn bg-primary px-3 py-2 rounded-xl font-bold" onClick={handleStart}>
              Start
            </button>
          )}
          {active && (
            <button className="btn bg-accent px-3 py-2 rounded-xl font-bold" onClick={handlePause}>
              Pausa
            </button>
          )}
          <button className="btn bg-secondary px-3 py-2 rounded-xl" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center mb-2">
        <span>Focus streak oggi: <b>{focusStreak}</b></span>
        <span>Minuti focus oggi: <b>{todayFocusMinutes}</b></span>
      </div>
      <div className="mt-3">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="accent-primary" checked={mode === 'focus'} readOnly />
          <span className="text-sm font-medium">Pubblica stato focus sulla mappa</span>
        </label>
      </div>
    </section>
  )
}
