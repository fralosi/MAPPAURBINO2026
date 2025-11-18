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
  purchases?: { user_id: string }[]
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

  // Stile poligoni con colori chiari e distinti
  const getPolygonStyle = (asset: Asset) => {
    // Verde: posseduto dall'utente loggato
    if (asset.owned) {
      return {
        fillColor: '#10b981',
        color: '#059669',
        weight: 3,
        fillOpacity: 0.6,
        opacity: 1,
        dashArray: '0'
      }
    }
    
    // Rosso: già acquistato da altri
    if (asset.purchases && asset.purchases.length > 0) {
      return {
        fillColor: '#ef4444',
        color: '#dc2626',
        weight: 2,
        fillOpacity: 0.4,
        opacity: 1,
        dashArray: '4'
      }
    }
    
    // Giallo: disponibile per l'acquisto
    return {
      fillColor: '#fbbf24',
      color: '#f59e0b',
      weight: 2,
      fillOpacity: 0.5,
      opacity: 1,
      dashArray: '0'
    }
  }

  // Funzione per icone marker colorate
  const getMarkerIcon = (asset: Asset) => {
    let iconColor = '#fbbf24' // Giallo default (disponibile)
    
    if (asset.owned) {
      iconColor = '#10b981' // Verde (tuo)
    } else if (asset.purchases && asset.purchases.length > 0) {
      iconColor = '#ef4444' // Rosso (già venduto)
    }
    
    return L.divIcon({
      html: `<div style="background-color: ${iconColor}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    })
  }

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

  // Controlla se asset è acquistabile
  const isAvailable = (asset: Asset) => {
    return !asset.owned && (!asset.purchases || asset.purchases.length === 0)
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
              pathOptions={getPolygonStyle(asset)}
              eventHandlers={{
                click: (e) => { e.target.openPopup() }
              }}
            >
              <Popup closeButton={true}>
                <div className="font-semibold text-base text-gray-900">
                  {asset.name}
                </div>
                <div className="text-xs text-gray-700">Tipo: {asset.type}</div>
                <div className="text-xs text-gray-700">
                  Prezzo: <span className="font-mono font-bold">{asset.base_price} 💰</span><br />
                  Rendimento: <span className="font-mono font-bold">+{asset.hourly_yield}/h</span>
                </div>
                <hr className="my-2 border-gray-300"/>
                {asset.owned ? (
                  <div className="bg-green-100 text-green-800 px-3 py-1.5 rounded font-bold text-center">
                    ✅ Tuo
                  </div>
                ) : !isAvailable(asset) ? (
                  <div className="bg-red-100 text-red-800 px-3 py-1.5 rounded font-bold text-center">
                    ❌ Già venduto
                  </div>
                ) : (
                  session && (
                    <button
                      className="w-full mt-1 bg-amber-500 hover:bg-amber-400 rounded px-4 py-2 font-bold text-white text-sm transition-colors"
                      onClick={() => handlePurchase(asset.id)}
                      disabled={loading}
                    >
                      {loading ? "Acquisto..." : "🛒 Compra"}
                    </button>
                  )
                )}
              </Popup>
            </Polygon>
          ) : asset.location_geojson.type === 'Point' ? (
            <Marker
              key={asset.id}
              position={[asset.location_geojson.coordinates[1], asset.location_geojson.coordinates[0]]}
              icon={getMarkerIcon(asset)}
            >
              <Popup closeButton={true}>
                <div className="font-semibold text-base text-gray-900">
                  {asset.name}
                </div>
                <div className="text-xs text-gray-700">Tipo: {asset.type}</div>
                <div className="text-xs text-gray-700">
                  Prezzo: <span className="font-mono font-bold">{asset.base_price} 💰</span><br />
                  Rendimento: <span className="font-mono font-bold">+{asset.hourly_yield}/h</span>
                </div>
                <hr className="my-2 border-gray-300"/>
                {asset.owned ? (
                  <div className="bg-green-100 text-green-800 px-3 py-1.5 rounded font-bold text-center">
                    ✅ Tuo
                  </div>
                ) : !isAvailable(asset) ? (
                  <div className="bg-red-100 text-red-800 px-3 py-1.5 rounded font-bold text-center">
                    ❌ Già venduto
                  </div>
                ) : (
                  session && (
                    <button
                      className="w-full mt-1 bg-amber-500 hover:bg-amber-400 rounded px-4 py-2 font-bold text-white text-sm transition-colors"
                      onClick={() => handlePurchase(asset.id)}
                      disabled={loading}
                    >
                      {loading ? "Acquisto..." : "🛒 Compra"}
                    </button>
                  )
                )}
              </Popup>
            </Marker>
          ) : null
        ))}

        {/* Marker posizione utente */}
        {userPosition && (
          <Marker
            position={userPosition}
            icon={L.icon({
              iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
              iconSize: [32, 32],
              iconAnchor: [16, 32]
            })}
          >
            <Popup>
              <b>📍 Tu sei qui</b>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Legenda */}
      <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 z-[1000] border-2 border-gray-200">
        <h3 className="font-bold text-sm text-gray-900 mb-2">Legenda</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
            <span className="text-gray-700 font-semibold">Tuoi immobili</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fbbf24' }}></div>
            <span className="text-gray-700 font-semibold">Disponibili</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
            <span className="text-gray-700 font-semibold">Già venduti</span>
          </div>
        </div>
      </div>

      {children}
      
      {loading && (
        <div className="absolute left-4 top-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg text-base text-gray-900 z-50 border-2 border-amber-400 font-semibold">
          ⏳ Caricamento...
        </div>
      )}
    </div>
  )
}
