import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('INR', '₹').trim();
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getCurrentHour(): number {
  return new Date().getHours();
}

export function getCurrentDayOfWeek(): number {
  // JS is 0=Sunday, Step 3 asks for 0=Monday
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

export function isRushHour(): boolean {
  const hour = getCurrentHour();
  return (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 21);
}

export function getDemandLevel(hour: number, dayOfWeek: number): number {
  const isWeekend = dayOfWeek >= 5;
  const isRush = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 21);

  if (!isWeekend && isRush) return 0.9;
  if (!isWeekend && !isRush) return 0.5;
  if (isWeekend && isRush) return 0.7;
  return 0.3;
}
