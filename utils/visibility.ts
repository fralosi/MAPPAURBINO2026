// utils/visibility.ts
// Helper per gestire lo stato di visibilità/tab attivo del browser

export function onVisibilityChange(callback: (visible: boolean) => void) {
  function handler() {
    const visible = document.visibilityState === 'visible'
    callback(visible)
  }
  document.addEventListener('visibilitychange', handler, false)
  // Ritorna funzione di cleanup
  return () => {
    document.removeEventListener('visibilitychange', handler, false)
  }
}

export function isDocumentVisible() {
  return typeof document !== "undefined" && document.visibilityState === 'visible'
}

// Helper per “tab attivo” (puoi unire altre condizioni se vuoi)
export function onFocusChange(callback: (focused: boolean) => void) {
  function handler() {
    callback(document.hasFocus())
  }
  window.addEventListener('focus', handler, false)
  window.addEventListener('blur', () => callback(false), false)
  // Cleanup
  return () => {
    window.removeEventListener('focus', handler, false)
    window.removeEventListener('blur', () => callback(false), false)
  }
}
