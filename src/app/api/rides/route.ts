import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getClusterPrediction, getFarePrediction } from "@/lib/ml";

export async function POST(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { pickup_lat, pickup_lng, drop_lat, drop_lng, pickup_address, drop_address } = body;

        // 1. Calculate approximate distance (Haversine)
        const R = 6371; // Earth radius in km
        const dLat = ((drop_lat - pickup_lat) * Math.PI) / 180;
        const dLon = ((drop_lng - pickup_lng) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((pickup_lat * Math.PI) / 180) *
            Math.cos((drop_lat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance_km = R * c;

        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay();
        const isPeak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);

        // 2. Call ML Microservice for intelligence
        const [clusterData, fareData] = await Promise.all([
            getClusterPrediction({ pickup_lat, pickup_lng, hour_of_day: hour }),
            getFarePrediction({
                distance_km,
                is_peak_hour: isPeak,
                day_of_week: day,
                cluster_size: 1, // Start with solo prediction
            }),
        ]);

        // 3. Create Ride record in Supabase
        const { data: ride, error: rideError } = await supabase
            .from("rides")
            .insert({
                rider_id: user.id,
                pickup_lat,
                pickup_lng,
                drop_lat,
                drop_lng,
                pickup_address,
                drop_address,
                status: "requested",
                distance_km,
                predicted_fare: fareData.predicted_solo_fare,
                cluster_id: clusterData.cluster_id,
            })
            .select()
            .single();

        if (rideError) throw rideError;

        // 4. Store ML metadata (async)
        await Promise.all([
            supabase.from("cluster_results").insert({
                ride_id: ride.id,
                cluster_id: clusterData.cluster_id,
                algorithm: clusterData.algorithm,
                silhouette_score: clusterData.silhouette_score,
            }),
            supabase.from("fare_predictions").insert({
                ride_id: ride.id,
                predicted_solo_fare: fareData.predicted_solo_fare,
                predicted_shared_fare: fareData.predicted_shared_fare,
                savings_pct: fareData.savings_pct,
                model_used: fareData.model_used,
            }),
        ]);

        return NextResponse.json(ride);
    } catch (error: any) {
        console.error("Ride creation failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch rides where user is rider or driver
    const { data: rides, error } = await supabase
        .from("rides")
        .select("*, rider:profiles!rides_rider_id_fkey(*), driver:profiles!rides_driver_id_fkey(*)")
        .or(`rider_id.eq.${user.id},driver_id.in.(SELECT id FROM drivers WHERE user_id = '${user.id}')`)
        .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(rides);
}
