'use client'

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Waypoint } from '@/types'
import { Button } from '@/components/ui/button'
import { LocateFixed } from 'lucide-react'

// Fix Leaflet icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

interface RouteMapProps {
  waypoints: Waypoint[]
  driverPos: [number, number] | null
  currentWaypointIndex: number
}

export default function RouteMap({ waypoints, driverPos, currentWaypointIndex }: RouteMapProps) {
  const [map, setMap] = useState<L.Map | null>(null)

  const polylinePositions: [number, number][] = []
  if (driverPos) {
    polylinePositions.push(driverPos)
  }
  waypoints.forEach(wp => polylinePositions.push([wp.lat, wp.lng]))

  const handleRecenter = () => {
    if (!map) return
    if (driverPos) {
      map.setView(driverPos, 16)
    } else if (waypoints.length > 0) {
      const bounds = L.latLngBounds(waypoints.map(wp => [wp.lat, wp.lng]))
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }

  // Effect to automatically center on driver or next waypoint when they change
  useEffect(() => {
    if (map && driverPos && currentWaypointIndex !== -1) {
      // Logic to keep both driver and next waypoint in view or just center on driver
      // For now, let's just stay centered on the driver if they move significantly
    }
  }, [map, driverPos, currentWaypointIndex])

  return (
    <div className="relative w-full h-full">
      <MapContainer 
        center={driverPos || (waypoints[0] ? [waypoints[0].lat, waypoints[0].lng] : [19.076, 72.877])} 
        zoom={15} 
        className="h-full w-full"
        ref={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route Polyline */}
        {polylinePositions.length > 1 && (
          <Polyline 
            positions={polylinePositions} 
            pathOptions={{ color: '#3B82F6', weight: 4, opacity: 0.7, dashArray: '10, 10' }} 
          />
        )}

        {/* Waypoints */}
        {waypoints.map((wp, idx) => {
          const isCompleted = wp.completed
          const isCurrent = idx === currentWaypointIndex

          return (
            <Marker 
              key={idx} 
              position={[wp.lat, wp.lng]}
              icon={new L.DivIcon({
                className: 'custom-div-icon',
                html: `
                  <div class="flex flex-col items-center">
                    <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center font-bold text-white ${
                      isCompleted ? 'bg-slate-400' : isCurrent ? 'bg-blue-600 animate-bounce' : 'bg-blue-500'
                    }">
                      ${idx + 1}
                    </div>
                  </div>
                `,
                iconSize: [32, 32],
                iconAnchor: [16, 32],
              })}
            >
              <Popup>
                <div className="font-bold">{wp.label}</div>
                <div className="text-xs">{wp.address}</div>
              </Popup>
            </Marker>
          )
        })}

        {/* Driver Position */}
        {driverPos && (
          <CircleMarker
            center={driverPos}
            radius={10}
            pathOptions={{
              fillColor: '#2563eb',
              color: 'white',
              weight: 3,
              opacity: 1,
              fillOpacity: 1,
            }}
          >
            <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-25" />
            <Popup>You are here</Popup>
          </CircleMarker>
        )}
      </MapContainer>

      {/* Re-center Button */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute bottom-6 right-6 z-[1000] bg-white text-slate-700 shadow-md hover:bg-slate-50 border border-slate-200"
        onClick={handleRecenter}
      >
        <LocateFixed className="h-5 w-5" />
      </Button>
    </div>
  )
}
