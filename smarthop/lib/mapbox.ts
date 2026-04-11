import polyline from '@mapbox/polyline';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export interface MapboxRoute {
  geometry: string;
  duration: number;
  distance: number;
  legs: any[];
}

/**
 * Fetches the fastest route between waypoints using the Mapbox Directions API.
 * Waypoints should be an array of [lat, lng] or simple objects with lat/lng.
 */
export async function getDirections(waypoints: { lat: number; lng: number }[]): Promise<MapboxRoute> {
  if (!MAPBOX_TOKEN) {
    throw new Error('Missing NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN');
  }
  const coords = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=polyline&access_token=${MAPBOX_TOKEN}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.code !== 'Ok') {
    throw new Error(`Mapbox Directions Error: ${data.message}`);
  }

  if (!Array.isArray(data.routes) || data.routes.length === 0 || !data.routes[0]?.geometry) {
    throw new Error('Mapbox Directions Error: No route geometry returned');
  }
  
  return data.routes[0];
}

/**
 * Fetches an optimized route for multiple stops using the Mapbox Optimization API.
 * Useful for carpooling where the order of pick-ups matters.
 */
export async function getOptimizedRoute(waypoints: { lat: number; lng: number }[]): Promise<MapboxRoute> {
  if (!MAPBOX_TOKEN) {
    throw new Error('Missing NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN');
  }
  const coords = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');
  const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coords}?geometries=polyline&access_token=${MAPBOX_TOKEN}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.code !== 'Ok') {
    throw new Error(`Mapbox Optimization Error: ${data.message}`);
  }

  if (!Array.isArray(data.trips) || data.trips.length === 0 || !data.trips[0]?.geometry) {
    throw new Error('Mapbox Optimization Error: No trip geometry returned');
  }
  
  return data.trips[0];
}

/**
 * Decodes a polyline string into an array of [longitude, latitude] coordinates.
 * Note: Decodes from [lat, lng] (standard) to [lng, lat] (GeoJSON format).
 */
export function decodeToGeoJSON(encoded: string): [number, number][] {
  if (!encoded || typeof encoded !== 'string') {
    return [];
  }

  const points = polyline.decode(encoded);
  if (!Array.isArray(points)) {
    return [];
  }

  // Mapbox Polyline is [lat, lng], GeoJSON is [lng, lat]
  return points
    .filter((p): p is [number, number] => Array.isArray(p) && p.length >= 2)
    .map(p => [p[1], p[0]]);
}

/**
 * Creates a GeoJSON LineString object from an encoded polyline.
 */
export function createRouteGeoJSON(encoded: string) {
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: decodeToGeoJSON(encoded),
    },
  };
}
