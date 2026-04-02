'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { MetroStation } from '@/types'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

interface RideRequestMapProps {
  pickupStation: MetroStation
  destLat: number | null
  destLng: number | null
  onDestinationSet: (lat: number, lng: number, address: string) => void
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}

export default function RideRequestMap({ pickupStation, destLat, destLng, onDestinationSet }: RideRequestMapProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      )
      const data = await res.json()
      onDestinationSet(lat, lng, data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    } catch {
      onDestinationSet(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    }
  }, [onDestinationSet])

  const handleMapClick = useCallback((lat: number, lng: number) => {
    reverseGeocode(lat, lng)
  }, [reverseGeocode])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.length < 3) {
      setSearchResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&countrycodes=in`
        )
        const data: NominatimResult[] = await res.json()
        setSearchResults(data)
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 500)
  }

  const handleSelectResult = (result: NominatimResult) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    onDestinationSet(lat, lng, result.display_name)
    setSearchQuery(result.display_name.split(',')[0])
    setSearchResults([])
  }

  const polylinePositions: [number, number][] = destLat && destLng
    ? [[pickupStation.lat, pickupStation.lng], [destLat, destLng]]
    : []

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search destination address..."
          className="w-full p-3 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        {isSearching && (
          <div className="absolute right-3 top-3.5">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border rounded-xl mt-1 shadow-lg z-[1000] max-h-48 overflow-auto">
            {searchResults.map((r) => (
              <button
                key={r.place_id}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-0 text-sm transition-colors"
                onClick={() => handleSelectResult(r)}
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border shadow-sm" style={{ height: 320 }}>
        <MapContainer
          center={[pickupStation.lat, pickupStation.lng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onClick={handleMapClick} />

          {/* Pickup Station */}
          <Marker position={[pickupStation.lat, pickupStation.lng]} icon={blueIcon}>
            <Popup>{pickupStation.name} (Pickup)</Popup>
          </Marker>

          {/* Destination */}
          {destLat && destLng && (
            <Marker position={[destLat, destLng]} icon={redIcon}>
              <Popup>Your Destination</Popup>
            </Marker>
          )}

          {/* Dashed Polyline */}
          {polylinePositions.length === 2 && (
            <Polyline
              positions={polylinePositions}
              pathOptions={{ color: '#3b82f6', weight: 3, dashArray: '10 6' }}
            />
          )}
        </MapContainer>
      </div>

      <p className="text-xs text-slate-400 text-center">Tap anywhere on the map to set your destination</p>
    </div>
  )
}
