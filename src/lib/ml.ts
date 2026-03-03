/**
 * ML Intelligence Helper
 * Communicates with the FastAPI microservice for ride clustering,
 * fare prediction, and driver ranking.
 */

const ML_SERVICE_URL = process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8000';

export async function getClusterPrediction(params: {
    pickup_lat: number;
    pickup_lng: number;
    hour_of_day: number;
}) {
    const res = await fetch(`${ML_SERVICE_URL}/cluster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('ML Cluster prediction failed');
    return res.json();
}

export async function getFarePrediction(params: {
    distance_km: number;
    is_peak_hour: boolean;
    day_of_week: number;
    cluster_size: number;
}) {
    const res = await fetch(`${ML_SERVICE_URL}/predict-fare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('ML Fare prediction failed');
    return res.json();
}

export async function getDriverRankings(params: {
    ride_lat: number;
    ride_lng: number;
    drivers: Array<{
        driver_id: string;
        lat: number;
        lng: number;
        rating: number;
        acceptance_rate: number;
    }>;
}) {
    const res = await fetch(`${ML_SERVICE_URL}/rank-drivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('ML Driver ranking failed');
    return res.json();
}
