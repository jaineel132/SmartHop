'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Waypoint } from '@/types'
import 'leaflet/dist/leaflet.css'

interface LiveTrackingMapProps {
  driverLat: number | null
  driverLng: number | null
  riderLat: number | null
  riderLng: number | null
  waypoints: Waypoint[]
  currentStopIndex: number
}

function DriverLayer({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    const driverIcon = L.divIcon({
      html: `
        <div style="position:relative;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(59,130,246,0.25);animation:driverPulse 2s ease-in-out infinite;"></div>
          <div style="width:34px;height:34px;background:#1e40af;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:17px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🚗</div>
        </div>
      `,
      className: '',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    })

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    } else {
      markerRef.current = L.marker([lat, lng], { icon: driverIcon }).addTo(map)
      markerRef.current.bindPopup('Driver')
    }

    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current)
        markerRef.current = null
      }
    }
  }, [lat, lng, map])

  return null
}

function WaypointMarkers({ waypoints, currentStopIndex }: { waypoints: Waypoint[]; currentStopIndex: number }) {
  const map = useMap()
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []

    waypoints.forEach((wp, i) => {
      let bg = '#94a3b8'
      let content = `${i + 1}`
      if (i < currentStopIndex) {
        bg = '#22c55e'
        content = '✓'
      } else if (i === currentStopIndex) {
        bg = '#3b82f6'
      }

      const icon = L.divIcon({
        html: `<div style="width:26px;height:26px;border-radius:50%;background:${bg};color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.25);">${content}</div>`,
        className: '',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      })

      const marker = L.marker([wp.lat, wp.lng], { icon }).addTo(map)
      marker.bindPopup(`<b>${wp.label || `Stop ${i + 1}`}</b><br/>${wp.address || ''}`)
      markersRef.current.push(marker)
    })

    return () => {
      markersRef.current.forEach(m => map.removeLayer(m))
      markersRef.current = []
    }
  }, [waypoints, currentStopIndex, map])

  return null
}

// Auto-fit bounds when data changes
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()

  useEffect(() => {
    if (points.length >= 2) {
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    } else if (points.length === 1) {
      map.setView(points[0], 14)
    }
  }, [points, map])

  return null
}

export default function LiveTrackingMap({
  driverLat,
  driverLng,
  riderLat,
  riderLng,
  waypoints,
  currentStopIndex,
}: LiveTrackingMapProps) {
  const center: [number, number] = driverLat && driverLng
    ? [driverLat, driverLng]
    : riderLat && riderLng
      ? [riderLat, riderLng]
      : [19.076, 72.8777]

  // Build full route polyline: driver → waypoints
  const routePoints: [number, number][] = []
  if (driverLat && driverLng) {
    routePoints.push([driverLat, driverLng])
  }
  waypoints.forEach(wp => routePoints.push([wp.lat, wp.lng]))

  // All points for bounds fitting
  const allPoints: [number, number][] = [...routePoints]
  if (riderLat && riderLng) {
    allPoints.push([riderLat, riderLng])
  }

  return (
    <>
      <style>{`
        @keyframes driverPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: '55vh', minHeight: '280px', width: '100%' }}
        className="rounded-b-none"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Auto-fit bounds */}
        <FitBounds points={allPoints.length > 0 ? allPoints : [center]} />

        {/* Rider pin */}
        {riderLat && riderLng && (
          <CircleMarker
            center={[riderLat, riderLng]}
            radius={8}
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.9, weight: 3 }}
          >
            <Popup>You</Popup>
          </CircleMarker>
        )}

        {/* Driver layer */}
        {driverLat && driverLng && (
          <DriverLayer lat={driverLat} lng={driverLng} />
        )}

        {/* Waypoint markers */}
        <WaypointMarkers waypoints={waypoints} currentStopIndex={currentStopIndex} />

        {/* Route polyline: driver → all waypoints */}
        {routePoints.length >= 2 && (
          <Polyline
            positions={routePoints}
            pathOptions={{ color: '#3b82f6', weight: 4, dashArray: '8 6', opacity: 0.8 }}
          />
        )}

        {/* Dashed line from rider to driver (if both exist) */}
        {riderLat && riderLng && driverLat && driverLng && (
          <Polyline
            positions={[[riderLat, riderLng], [driverLat, driverLng]]}
            pathOptions={{ color: '#10b981', weight: 2, dashArray: '4 8', opacity: 0.5 }}
          />
        )}
      </MapContainer>
    </>
  )
}
