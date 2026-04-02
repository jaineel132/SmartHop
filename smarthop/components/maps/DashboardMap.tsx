'use client'

import React from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { MUMBAI_METRO_STATIONS } from '@/lib/stations'
import { Badge } from '@/components/ui/badge'
import { MetroStation } from '@/types'

const FALLBACK_CENTER: [number, number] = [19.0760, 72.8777]

interface DashboardMapProps {
  centerStation: MetroStation | null
}

export default function DashboardMap({ centerStation }: DashboardMapProps) {
  const getLineColor = (line: string) => {
    switch (line) {
      case 'Line 1': return '#3B82F6' // Blue
      case 'Line 2A': return '#EF4444' // Red
      case 'Line 7': return '#22C55E' // Green
      default: return '#94A3B8'
    }
  }

  const center: [number, number] = centerStation 
    ? [centerStation.lat, centerStation.lng] 
    : FALLBACK_CENTER

  return (
    <div className="w-full h-[260px] md:h-[340px] rounded-xl overflow-hidden border border-slate-200 shadow-inner z-0">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {MUMBAI_METRO_STATIONS.map((station) => {
          const isCenter = centerStation?.id === station.id
          
          return (
            <CircleMarker
              key={station.id}
              center={[station.lat, station.lng]}
              radius={isCenter ? 12 : 7}
              pathOptions={{
                fillColor: getLineColor(station.line),
                color: 'white',
                weight: 2,
                opacity: 1,
                fillOpacity: isCenter ? 1 : 0.8,
              }}
              className={isCenter ? "animate-pulse" : ""}
            >
              <Popup>
                <div className="p-1 space-y-2">
                  <h3 className="font-bold text-slate-900 m-0 flex items-center gap-2">
                    {station.name}
                  </h3>
                  {isCenter && <span className="block text-xs text-blue-600 font-semibold mb-1">Your home station</span>}
                  <Badge 
                    style={{ backgroundColor: getLineColor(station.line) }}
                    className="text-white border-none shrink-0"
                  >
                    {station.line}
                  </Badge>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
