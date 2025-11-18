import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

type LeaderboardEntry = {
  user_id: string
  display_name: string
  balance: number
  assets_value: number
  total_wealth: number
}

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  async function fetchLeaderboard() {
    setLoading(true)
    
    // Fetch tutti gli utenti
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name, balance')
    
    if (!users) {
      setLoading(false)
      return
    }

    // Per ogni utente, calcola il valore degli asset posseduti
    const leadersData: LeaderboardEntry[] = []
    
    for (const user of users) {
      // Fetch asset posseduti dall'utente
      const { data: purchases } = await supabase
        .from('purchases')
        .select('asset_id')
        .eq('user_id', user.id)
      
      let assetsValue = 0
      
      if (purchases && purchases.length > 0) {
        const assetIds = purchases.map(p => p.asset_id)
        
        // Fetch prezzi degli asset
        const { data: assets } = await supabase
          .from('assets')
          .select('id, base_price')
          .in('id', assetIds)
        
        if (assets) {
          assetsValue = assets.reduce((sum, asset) => sum + asset.base_price, 0)
        }
      }
      
      leadersData.push({
        user_id: user.id,
        display_name: user.display_name || 'Utente',
        balance: user.balance || 0,
        assets_value: assetsValue,
        total_wealth: (user.balance || 0) + assetsValue
      })
    }
    
    // Ordina per patrimonio totale decrescente
    leadersData.sort((a, b) => b.total_wealth - a.total_wealth)
    
    setLeaders(leadersData)
    setLoading(false)
  }

  return (
    <div className="liquid-glass p-4 rounded-xl">
      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
        🏆 Classifica
      </h3>
      
      {loading ? (
        <div className="text-xs text-gray-600">Caricamento...</div>
      ) : (
        <div className="space-y-2">
          {leaders.slice(0, 10).map((leader, index) => (
            <div 
              key={leader.user_id} 
              className={`flex items-center justify-between p-2 rounded-lg ${
                index === 0 ? 'bg-yellow-100 border border-yellow-300' :
                index === 1 ? 'bg-gray-100 border border-gray-300' :
                index === 2 ? 'bg-orange-100 border border-orange-300' :
                'bg-white border border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-bold text-sm text-gray-700">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                </span>
                <span className="text-xs font-semibold text-gray-800 truncate">
                  {leader.display_name}
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-gray-900">
                  {Math.round(leader.total_wealth)} 💰
                </div>
                <div className="text-[10px] text-gray-500">
                  {Math.round(leader.balance)} + {Math.round(leader.assets_value)}
                </div>
              </div>
            </div>
          ))}
          
          {leaders.length === 0 && (
            <div className="text-xs text-gray-500 text-center py-4">
              Nessun giocatore ancora
            </div>
          )}
        </div>
      )}
      
      <button
        onClick={fetchLeaderboard}
        className="mt-3 w-full text-xs bg-blue-500 hover:bg-blue-400 text-white font-semibold py-1.5 rounded-lg transition-colors"
      >
        🔄 Aggiorna
      </button>
    </div>
  )
}
