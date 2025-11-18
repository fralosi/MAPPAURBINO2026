import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Polygon, Popup, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useSession } from '@supabase/auth-helpers-react'
import { supabase } from '../lib/supabaseClient'

// Fix marker icon per Leaflet in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png'
})

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
}

type MapProps = {
  assets?: Asset[]
  userPosition?: [number, number] | null
  children?: React.ReactNode
}

export default function Map({
  assets: assetsProp = [],
  userPosition,
  children
}: MapProps) {
  const session = useSession()
  const [assets, setAssets] = useState<Asset[]>(assetsProp)
  const [loading, setLoading] = useState(false)
  const userId = session?.user?.id

  // Aggiorna poligoni/asset da parent
  useEffect(() => {
    setAssets(assetsProp)
  }, [assetsProp])

  // Stile poligoni (dark + minimal + distinguibile)
  const getPolygonStyle = (owned?: boolean) => ({
    fillColor: owned ? '#22c55e' : '#eab308',
    color: owned ? '#16a34a' : '#fde047',
    weight: 2,
    fillOpacity: owned ? 0.36 : 0.5,
    opacity: 1,
    dashArray: owned ? '6' : '0'
  })

  // Funzione acquisto asset
  async function handlePurchase(assetId: string) {
    if (!session || !userId) {
      alert('Devi essere autenticato per comprare!')
      return
    }
    setLoading(true)
    const res = await fetch('/api/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        asset_id: assetId
      })
    })
    const result = await res.json()
    setLoading(false)
    if (result.success) {
      alert('Acquisto effettuato!')
      window.location.reload()
    } else {
      alert('Errore acquisto: ' + (result.error || 'Impossibile completare'))
    }
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[43.7265, 12.6366]}
        zoom={15}
        minZoom={14}
        maxZoom={18}
        scrollWheelZoom
        style={{ height: '100%', width: '100%', zIndex: 1, borderRadius: 0 }}
        attributionControl
      >
        {/* MAPPA DARK: CartoDB basemap */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Asset come poligoni */}
        {assets.map(asset => (
          asset.location_geojson.type === 'Polygon' ? (
            <Polygon
              key={asset.id}
              positions={asset.location_geojson.coordinates[0].map(
                ([lng, lat]: [number, number]) => [lat, lng]
              )}
              pathOptions={getPolygonStyle(asset.owned)}
              eventHandlers={{
                click: (e) => { e.target.openPopup() }
              }}
            >
              <Popup closeButton={true}>
                <div className="font-semibold text-base">
                  {asset.name}
                </div>
                <div className="text-xs text-gray-200">Tipo: {asset.type}</div>
                <div className="text-xs text-gray-200">
                  Prezzo: <span className="font-mono">{asset.base_price} 💸</span><br />
                  Rendimento: <span className="font-mono">{asset.hourly_yield}/h</span>
                </div>
                <hr className="my-2 border-gray-600"/>
                {asset.owned ? (
                  <span className="text-green-400 font-bold">Tuo</span>
                ) : (
                  session && (
                    <button
                      className="btn btn-sm mt-1 bg-amber-500 hover:bg-amber-400 rounded px-3 py-1.5 font-bold text-sm"
                      onClick={() => handlePurchase(asset.id)}
                      disabled={loading}
                    >
                      {loading ? "Acquisto..." : "Compra"}
                    </button>
                  )
                )}
              </Popup>
            </Polygon>
          ) : asset.location_geojson.type === 'Point' ? (
            <Marker
              key={asset.id}
              position={[asset.location_geojson.coordinates[1], asset.location_geojson.coordinates[0]]}
            >
              <Popup closeButton={true}>
                <div className="font-semibold text-base">
                  {asset.name}
                </div>
                <div className="text-xs text-gray-200">Tipo: {asset.type}</div>
                <div className="text-xs text-gray-200">
                  Prezzo: <span className="font-mono">{asset.base_price} 💸</span><br />
                  Rendimento: <span className="font-mono">{asset.hourly_yield}/h</span>
                </div>
                <hr className="my-2 border-gray-600"/>
                {asset.owned ? (
                  <span className="text-green-400 font-bold">Tuo</span>
                ) : (
                  session && (
                    <button
                      className="btn btn-sm mt-1 bg-amber-500 hover:bg-amber-400 rounded px-3 py-1.5 font-bold text-sm"
                      onClick={() => handlePurchase(asset.id)}
                      disabled={loading}
                    >
                      {loading ? "Acquisto..." : "Compra"}
                    </button>
                  )
                )}
              </Popup>
            </Marker>
          ) : null
        ))}

        {/* Marker e popup posizione utente */}
        {userPosition && (
          <Marker
            position={userPosition}
            icon={L.icon({
              iconUrl: 'https://avatars.dicebear.com/api/personas/you.svg',
              iconSize: [36, 36]
            })}
          >
            <Popup>
              <b>Tu sei qui</b>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      {children}
      {loading && (
        <div className="absolute left-4 top-4 bg-blur px-4 py-2 rounded-xl shadow text-base text-primary z-50 border font-semibold">Caricamento...</div>
      )}
    </div>
  )
}
