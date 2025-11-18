export type Asset = {
  id: string
  type: string
  name: string
  base_price: number
  hourly_yield: number
  location_geojson: {
    type: 'Point' | 'Polygon'
    coordinates: [number, number] | number[][][]
  }
  owned?: boolean
  purchases?: { user_id: string }[]
}

export type User = {
  id: string
  display_name: string
  balance: number
  share_location: boolean
}
