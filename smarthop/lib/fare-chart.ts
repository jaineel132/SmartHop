import { MUMBAI_METRO_STATIONS } from './stations';

/**
 * Mumbai Metro fare structure: base ₹10, +₹5 per station hop, max ₹40.
 */
export function getMetroFare(fromId: string, toId: string): number {
  if (fromId === toId) return 0;

  const fromStation = MUMBAI_METRO_STATIONS.find((s) => s.id === fromId);
  const toStation = MUMBAI_METRO_STATIONS.find((s) => s.id === toId);

  if (!fromStation || !toStation) return 0;

  // Simple hop calculation: index difference within the same line
  // For simplicity across lines, we'll use a straight hop count or a small penalty for interchange
  // Real world: Line 1/2A/7 are connected at specific points. 
  // Let's implement a simplified version based on index difference for this pilot.

  const fromIndex = MUMBAI_METRO_STATIONS.indexOf(fromStation);
  const toIndex = MUMBAI_METRO_STATIONS.indexOf(toStation);

  const hops = Math.abs(toIndex - fromIndex);
  const fare = 10 + (hops * 5);

  return Math.min(fare, 40);
}

export const METRO_FARE_CHART = {
  base: 10,
  per_hop: 5,
  max: 40,
};
