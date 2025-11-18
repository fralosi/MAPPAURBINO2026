import { useState } from "react"
import { useSession } from "@supabase/auth-helpers-react"

type Asset = {
  id: string
  name: string
  owned?: boolean
}

type Props = {
  assets: Asset[]
  onClaimSuccess?: (earned: number) => void
}

export default function ClaimProfits({ assets, onClaimSuccess }: Props) {
  const session = useSession()
  const userId = session?.user?.id
  const [loading, setLoading] = useState<string | null>(null)
  const [lastEarned, setLastEarned] = useState<number | null>(null)

  async function claimYield(assetId: string) {
    if (!userId) return
    setLoading(assetId)
    const res = await fetch('/api/claim_yield', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, asset_id: assetId }),
    })
    const result = await res.json()
    setLoading(null)
    if (result.earned !== undefined) {
      setLastEarned(result.earned)
      if (onClaimSuccess) onClaimSuccess(result.earned)
      alert(`Hai guadagnato ${result.earned} 💸 da questa proprietà!`)
    } else if (result.error) {
      alert('Errore: ' + result.error)
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2 w-full">
      <h3 className="font-bold text-lg mb-1">Ritira profitti</h3>
      {assets.filter(a => a.owned).length === 0 && (
        <span className="text-gray-400">Non possiedi asset ancora…</span>
      )}
      {assets.filter(a => a.owned).map(a => (
        <button
          key={a.id}
          className="btn bg-primary rounded-xl px-3 py-2 flex justify-between items-center mb-1"
          onClick={() => claimYield(a.id)}
          disabled={loading === a.id}
        >
          <span>{a.name}</span>
          <span>
            {loading === a.id ? "⏳" : "Ritira"}
          </span>
        </button>
      ))}
      {lastEarned !== null && (
        <div className="text-green-700 text-center mt-2 animate-bounce">
          +{lastEarned}💸 ritiro riuscito!
        </div>
      )}
    </div>
  )
}
