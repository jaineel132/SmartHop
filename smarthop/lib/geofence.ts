import { haversineDistance } from '@/lib/utils'

export class GeofenceService {
  private watchId: number | null = null
  private triggered = false

  constructor(
    private targetLat: number, 
    private targetLng: number, 
    private radiusMeters = 500
  ) {}

  start(onEnter: () => void): void {
    if (!navigator.geolocation) return
    this.triggered = false
    
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const dist = haversineDistance(
          pos.coords.latitude, pos.coords.longitude,
          this.targetLat, this.targetLng
        )
        if (dist < this.radiusMeters && !this.triggered) {
          this.triggered = true
          onEnter()
        }
      }, 
      (err) => console.warn('Geofence error:', err),
      { enableHighAccuracy: true, maximumAge: 10000 }
    )
  }

  stop(): void {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
  }

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator
  }
}
