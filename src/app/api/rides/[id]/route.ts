import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getDriverRankings } from "@/lib/ml";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id } = await params;

    const { data: ride, error } = await supabase
        .from("rides")
        .select("*, rider:profiles!rides_rider_id_fkey(*), driver:profiles!rides_driver_id_fkey(*)")
        .eq("id", id)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(ride);
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id } = await params;
    const { status, driver_id } = await request.json();

    try {
        // If status is 'finding_driver', we triggers the ML ranking
        if (status === "finding_driver") {
            const { data: ride } = await supabase.from("rides").select("*").eq("id", id).single();
            const { data: availableDrivers } = await supabase
                .from("drivers")
                .select("id, user_id, rating, acceptance_rate, profiles(location_lat, location_lng)")
                .eq("is_available", true);

            if (ride && availableDrivers && availableDrivers.length > 0) {
                // Prepare drivers for ML ranking
                const formattedDrivers = availableDrivers.map((d: any) => ({
                    driver_id: d.id,
                    lat: d.profiles.location_lat || 0,
                    lng: d.profiles.location_lng || 0,
                    rating: d.rating || 5.0,
                    acceptance_rate: d.acceptance_rate || 100,
                }));

                const rankingData = await getDriverRankings({
                    ride_lat: ride.pickup_lat,
                    ride_lng: ride.pickup_lng,
                    drivers: formattedDrivers,
                });

                // Potentially store rankings or just return them
                // For now, we update the ride status
            }
        }

        const { data, error } = await supabase
            .from("rides")
            .update({ status, driver_id })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
