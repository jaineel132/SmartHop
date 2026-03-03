"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import RideRequestForm from "@/components/dashboard/RideRequestForm";
import { motion } from "framer-motion";
import { Zap, Clock, Map as MapIcon, ShieldCheck } from "lucide-react";

// Dynamically import the map to avoid SSR issues with Leaflet
const RiderMap = dynamic(() => import("@/components/dashboard/RiderMap"), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-zinc-900 animate-pulse flex items-center justify-center">
            <span className="font-black uppercase tracking-widest text-zinc-700">Loading Map Satellite...</span>
        </div>
    ),
});

export default function DashboardPage() {
    const [activeRide, setActiveRide] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    return (
        <div className="min-h-[calc(100-4rem)] bg-background">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[calc(100vh-4rem)]">

                {/* Sidebar / Controls */}
                <aside className="lg:col-span-4 border-r-2 border-foreground p-8 space-y-8 bg-background relative z-10 overflow-y-auto">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Rider <span className="text-primary italic">Console.</span></h1>
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Intelligent Mobility Orchestration</p>
                    </div>

                    <RideRequestForm
                        onEstimate={(data) => setActiveRide(data)}
                        loading={loading}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 brutalist-border bg-zinc-900/50 space-y-2">
                            <Clock className="h-5 w-5 text-primary" />
                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Estimated Wait</div>
                            <div className="text-xl font-black tracking-tighter">4-6 MIN</div>
                        </div>
                        <div className="p-4 brutalist-border bg-zinc-900/50 space-y-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Safety Status</div>
                            <div className="text-xl font-black tracking-tighter text-green-500">ACTIVE</div>
                        </div>
                    </div>

                    <div className="p-6 brutalist-border border-zinc-800 bg-zinc-900/30">
                        <h3 className="text-xs font-black uppercase tracking-widest mb-4">Live Traffic Insights</h3>
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider py-2 border-b border-zinc-800 last:border-0">
                                    <span className="text-zinc-400">Sector {i} Congestion</span>
                                    <span className={i === 2 ? "text-red-500" : "text-green-500"}>{i === 2 ? "HIGH" : "LOW"}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Map Area */}
                <main className="lg:col-span-8 bg-zinc-900 relative">
                    <RiderMap
                        pickup={activeRide ? [activeRide.pickup_lat, activeRide.pickup_lng] : undefined}
                        drop={activeRide ? [activeRide.drop_lat, activeRide.drop_lng] : undefined}
                    />

                    {/* Overlay Stats */}
                    <div className="absolute top-6 right-6 z-10 flex space-x-4">
                        <div className="bg-background brutalist-border p-3 flex items-center space-x-3 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">32 Drivers Active</span>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
