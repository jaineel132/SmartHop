import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient();
    const { data: drivers, error } = await supabase
        .from("drivers")
        .select("*, profile:profiles(*)")
        .eq("is_available", true);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(drivers);
}

export async function PATCH(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { is_available, vehicle_type, license_plate } = await request.json();

        const { data, error } = await supabase
            .from("drivers")
            .update({ is_available, vehicle_type, license_plate })
            .eq("user_id", user.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
