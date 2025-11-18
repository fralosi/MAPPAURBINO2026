import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useSession } from '@supabase/auth-helpers-react'
import { supabase } from '../lib/supabaseClient'

import Layout from '../components/Layout'
import Timer from '../components/LeftPanel/Timer'
import UserBalance from '../components/LeftPanel/UserBalance'
import ClaimProfits from '../components/LeftPanel/ClaimProfits'
import Leaderboard from '../components/RightPanel/Leaderboard'
import UserList from '../components/RightPanel/UserList'
import InteractionBox from '../components/RightPanel/InteractionBox'

const Map = dynamic(() => import('../components/Map'), { ssr: false })

type Asset = {
  id: string
  type: string
  name: string
  base_price: number
  hourly_yield: number
  location_geojson: {
    type: string
    coordinates: any
  }
  owned?: boolean
  purchases?: { user_id: string }[]
}

type User = {
  id: string
  display_name: string
  balance: number
  share_location: boolean
  location?: [number, number]
}

type Message = {
  id: string
  from_user: string
  from_name: string
  message: string
  created_at: string
}

export default function Home() {
  const session = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)

  // Mock dati per utenti e messaggi finché non carichi i veri
  const [mockUsers, setMockUsers] = useState<User[]>([])
  const [mockMessages, setMockMessages] = useState<Message[]>([])

  useEffect(() => {
    if (session?.user) fetchEverything()
  }, [session])

  async function fetchEverything() {
    if (!session?.user) return
    setLoading(true)

    // Dati utente
    const { data: uData } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (uData) setUser(uData)

    // Dati asset con acquisti
    const { data: aData } = await supabase
      .from('assets')
      .select('*, purchases(user_id)')

    if (aData) {
      const mappedAssets = aData.map(asset => ({
        ...asset,
        owned: asset.purchases?.some((p: any) => p.user_id === session.user?.id)
      }))
      setAssets(mappedAssets)
    }

    // Mock utenti online (per UserList)
    const { data: allUsers } = await supabase.from('users').select('*')
    if (allUsers) setMockUsers(allUsers)

    // Mock messaggi chat 
    const { data: messages } = await supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(30)
    if (messages) setMockMessages(messages)

    setLoading(false)
  }

  async function handleSendMessage(message: string) {
    if (!session?.user) return

    await supabase.from('messages').insert({
      from_user: session.user.id,
      from_name: user?.display_name || '',
      message
    })

    fetchEverything()
  }

  if (!session) return <div className="p-8">Effettua il login per giocare.</div>

  return (
    <Layout
      leftPanel={
        <>
          <Timer />
          <UserBalance />
          <ClaimProfits assets={assets} onClaimSuccess={fetchEverything} />
        </>
      }
      rightPanel={
        <>
          <Leaderboard />
          <UserList users={mockUsers} currentUserId={session.user.id} />
          <InteractionBox
            currentUserId={session.user.id}
            messages={mockMessages}
            onSendMessage={handleSendMessage}
          />
        </>
      }
    >
      <Map assets={assets} userPosition={user?.share_location ? user?.location : null} />
      {loading && (
        <div className="absolute left-4 top-4 bg-white/90 px-4 py-2 rounded-xl shadow z-50 border font-semibold">
          ⏳ Caricamento...
        </div>
      )}
    </Layout>
  )
}
