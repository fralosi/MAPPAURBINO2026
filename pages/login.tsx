import { useEffect } from 'react'
import { useSession } from '@supabase/auth-helpers-react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function LoginPage() {
  const session = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push('/')
    }
  }, [session, router])

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-primary">
      <div className="liquid-glass p-8 m-4 max-w-md w-full shadow-xl">
        <h1 className="text-2xl font-bold mb-5 text-center">Accedi a Urbino Focus Game</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google', 'github']}
          theme="default"
        />
        <p className="text-xs text-center mt-7 text-gray-500">
          Se hai già un account, accedi.<br />
          Puoi anche usare <strong>Google</strong> o <strong>GitHub</strong>!
        </p>
      </div>
    </div>
  )
}
