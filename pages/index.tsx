import Layout from '../components/Layout'
import dynamic from 'next/dynamic'
import Timer from '../components/LeftPanel/Timer'
import UserBalance from '../components/LeftPanel/UserBalance'
import ClaimProfits from '../components/LeftPanel/ClaimProfits'
import UserList from '../components/RightPanel/UserList'
import InteractionBox from '../components/RightPanel/InteractionBox'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useSession } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/router'

// Import dinamico per evitare errori SSR (window is not defined)
const Map = dynamic(() => import('../components/Map'), { ssr: false })

type Asset = {
  id: string
  type: string
  name: string
  base_price: number
  hourly_yield: number
  location_geojson: { type: string; coordinates: [number, number] }
  location: [number, number]
  owned?: boolean
}
type User = {
  id: string
  display_name: string
  isOnline: boolean
  isFocus: boolean
  share_location: boolean
  distance?: number
}

export default function HomePage() {
  const session = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!session) router.push('/login')
  }, [session, router])

  // Stato asset/user
  const [assets, setAssets] = useState<Asset[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Caricamento asset + proprietà
  useEffect(() => {
    if (!session) return

    async function fetchEverything() {
      setLoading(true)
      const { user: sUser } = session
      // Assicurati che user esista
      let { data: uData } = await supabase
        .from('users')
        .select('*')
        .eq('id', sUser.id)
        .single()
      if (!uData) {
        await supabase.from('users').insert({
          id: sUser.id,
          email: sUser.email,
          display_name: sUser.user_metadata?.full_name || sUser.email,
          balance: 1000,
          share_location: false
        })
        uData = { id: sUser.id, display_name: sUser.user_metadata?.full_name || sUser.email, share_location: false }
      }
      setUser({
        id: uData.id,
        display_name: uData.display_name,
        isOnline: true,
        isFocus: false,
        share_location: uData.share_location
      })

      // Carica asset e asset posseduti
      const { data: allAssets } = await supabase
        .from('assets')
        .select('id, type, name, base_price, hourly_yield, location_geojson')
      let ownedAssets: string[] = []
      const { data: userAssets } = await supabase
        .from('user_assets')
        .select('asset_id')
        .eq('user_id', sUser.id)
      if (userAssets) ownedAssets = userAssets.map(a => a.asset_id)
      if (allAssets) {
        setAssets(allAssets.map(a => ({
          ...a,
          location: [a.location_geojson.coordinates[1], a.location_geojson.coordinates[0]],
          owned: ownedAssets.includes(a.id)
        })))
      }
      setLoading(false)
    }
    fetchEverything()
  }, [session, refreshTrigger])

  // Demo users & chat
  const [users, setUsers] = useState<User[]>([])
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      setUsers([
        user,
        { id: '2', display_name: 'Marta', isOnline: true, isFocus: false, share_location: false, distance: 0.8 },
        { id: '3', display_name: 'Luca', isOnline: true, isFocus: true, share_location: true, distance: 0.4 }
      ])
    }
  }, [user])

  useEffect(() => {
    setMessages([
      { id: 'm1', from_user: '2', from_name: 'Marta', message: 'Andiamo in pausa insieme?', created_at: new Date().toISOString() }
    ])
  }, [])

  // Rende facile il refresh dopo acquisto/claim profitti
  function triggerRefresh() {
    setRefreshTrigger(x => x + 1)
  }

  if (!session || !user) {
    return (
      <div className="w-full h-screen flex justify-center items-center text-2xl text-primary">
        Caricamento...
      </div>
    )
  }

  return (
    <Layout
      leftPanel={
        <div>
          <UserBalance />
          <Timer />
          <ClaimProfits assets={assets} onClaimSuccess={triggerRefresh} />
        </div>
      }
      rightPanel={
        <div className="flex flex-col gap-6">
          <UserList users={users} currentUserId={user.id} />
          <InteractionBox
            currentUserId={user.id}
            messages={messages}
            onSendMessage={msg =>
              setMessages(m => [
                ...m,
                {
                  id: `m${m.length + 1}`,
                  from_user: user.id,
                  from_name: user.display_name,
                  message: msg,
                  created_at: new Date().toISOString()
                }
              ])
            }
          />
        </div>
      }
    >
      <Map assets={assets} userPosition={user.share_location ? [43.7265, 12.6366] : undefined} />
      {loading && <div className="absolute left-4 top-4 text-gray-900">Caricamento dati...</div>}
    </Layout>
  )
}
