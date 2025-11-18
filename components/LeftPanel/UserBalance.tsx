import { useEffect, useState } from "react"
import { useSession } from "@supabase/auth-helpers-react"
import { supabase } from "../../lib/supabaseClient"

export default function UserBalance() {
  const session = useSession()
  const userId = session?.user?.id
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchBalance() {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single()
    if (!error && data) setBalance(Number(data.balance))
    setLoading(false)
  }

  useEffect(() => {
    fetchBalance()
    // (Facoltativo) aggiorna ogni N secondi per real-time
    const timer = setInterval(fetchBalance, 5000)
    return () => clearInterval(timer)
  }, [userId])

  if (!userId) return null

  return (
    <div className="mb-4 w-full flex items-center gap-3 liquid-glass px-4 py-3 border shadow max-w-md">
      <span className="text-lg font-bold text-indigo-600">Saldo</span>
      {loading ? (
        <span className="animate-pulse text-gray-500">...</span>
      ) : (
        <span className="font-mono text-2xl">{balance?.toLocaleString('it-IT')} <span className="text-amber-500">💸</span></span>
      )}
    </div>
  )
}
