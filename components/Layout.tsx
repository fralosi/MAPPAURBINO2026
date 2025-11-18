import React, { ReactNode } from 'react'

type LayoutProps = {
  children: ReactNode
  leftPanel?: ReactNode
  rightPanel?: ReactNode
}

export default function Layout({ leftPanel, rightPanel, children }: LayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-primary relative">
      {/* Pannello sinistro: Focus, Pomodoro, Statistiche */}
      {leftPanel && (
        <aside
          className="z-30 hidden md:flex flex-col w-[340px] p-4 liquid-glass m-4 shadow-xl"
          aria-label="Pannello produttività"
        >
          {leftPanel}
        </aside>
      )}

      {/* Mappa centrale */}
      <main className="flex-1 h-full flex items-stretch justify-stretch relative">
        {children}
      </main>

      {/* Pannello destro: Lista utenti, Chat, Notifiche */}
      {rightPanel && (
        <aside
          className="z-30 hidden md:flex flex-col w-[320px] p-4 liquid-glass m-4 shadow-xl"
          aria-label="Pannello sociale"
        >
          {rightPanel}
        </aside>
      )}

      {/* Mobile: overlay/slide panel (da implementare) */}
      {/* 
      <MobilePanels 
        leftPanel={leftPanel}
        rightPanel={rightPanel}
      />
      */}
    </div>
  )
}
