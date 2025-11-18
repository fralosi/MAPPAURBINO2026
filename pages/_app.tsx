import type { AppProps } from 'next/app'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { supabase } from '../lib/supabaseClient'
import { useEffect } from 'react'
import '../styles/globals.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    document.body.style.background =
      'linear-gradient(135deg, #EAECF5 0%, #B6C7F3 100%)'
    document.body.style.minHeight = '100vh'
    document.body.style.transition = 'background 0.7s'
    document.body.style.overflowX = 'hidden'
    return () => {
      document.body.style.background = ''
      document.body.style.minHeight = ''
      document.body.style.transition = ''
      document.body.style.overflowX = ''
    }
  }, [])

  return (
    // ❌ TOGLI questo: initialSession={pageProps.initialSession}
    <SessionContextProvider supabaseClient={supabase}>
      <Component {...pageProps} />
    </SessionContextProvider>
  )
}
