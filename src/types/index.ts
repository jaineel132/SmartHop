// ============================================
// MySmartHop — Shared TypeScript Types
// ============================================

// ---------- Enums ----------
export type UserRole = "rider" | "driver";
export type RideStatus = "requested" | "accepted" | "ongoing" | "completed" | "cancelled";
export type VehicleType = "car" | "bike" | "auto";

// ---------- Database Row Types ----------
export interface Profile {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: UserRole;
    avatar_url: string | null;
    created_at: string;
}

export interface Driver {
    id: string;
    user_id: string;
    vehicle_type: VehicleType;
    license_plate: string;
    is_available: boolean;
    rating: number;
    total_rides: number;
    acceptance_rate: number;
    created_at: string;
}

export interface Ride {
    id: string;
    rider_id: string;
    driver_id: string | null;
    pickup_lat: number;
    pickup_lng: number;
    drop_lat: number;
    drop_lng: number;
    pickup_address: string;
    drop_address: string;
    status: RideStatus;
    fare: number | null;
    predicted_fare: number | null;
    distance_km: number | null;
    duration_min: number | null;
    cluster_id: number | null;
    created_at: string;
    updated_at: string;
}

export interface Rating {
    id: string;
    ride_id: string;
    from_user_id: string;
    to_user_id: string;
    score: number; // 1-5
    comment: string | null;
    created_at: string;
}

export interface ClusterResult {
    id: string;
    ride_id: string;
    cluster_id: number;
    algorithm: string;
    silhouette_score: number | null;
    created_at: string;
}

export interface FarePrediction {
    id: string;
    ride_id: string;
    predicted_solo_fare: number;
    predicted_shared_fare: number;
    savings_pct: number;
    model_used: string;
    created_at: string;
}

export interface DriverLocation {
    id: string;
    driver_id: string;
    lat: number;
    lng: number;
    updated_at: string;
}

// ---------- Extended Types (with joins) ----------
export interface RideWithDetails extends Ride {
    rider?: Profile;
    driver?: Profile & { driver_details?: Driver };
    rating?: Rating;
    fare_prediction?: FarePrediction;
}

export interface DriverWithProfile extends Driver {
    profile?: Profile;
    location?: DriverLocation;
}

// ---------- API Request/Response Types ----------
export interface CreateRideRequest {
    pickup_lat: number;
    pickup_lng: number;
    drop_lat: number;
    drop_lng: number;
    pickup_address: string;
    drop_address: string;
}

export interface RateRideRequest {
    ride_id: string;
    score: number;
    comment?: string;
}

export interface MLClusterResponse {
    cluster_id: number;
    algorithm: string;
    silhouette_score: number;
    cluster_size: number;
}

export interface MLFareResponse {
    predicted_solo_fare: number;
    predicted_shared_fare: number;
    savings_pct: number;
    model_used: string;
}

export interface MLDriverRankResponse {
    drivers: {
        driver_id: string;
        score: number;
        distance_km: number;
        rating: number;
        acceptance_probability: number;
    }[];
}
