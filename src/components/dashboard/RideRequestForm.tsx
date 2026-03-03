"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, MapPin, Navigation, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RideRequestFormProps {
    onEstimate: (data: any) => void;
    loading: boolean;
}

export default function RideRequestForm({ onEstimate, loading }: RideRequestFormProps) {
    const [pickup, setPickup] = useState("MUMBAI CENTRAL STATION");
    const [drop, setDrop] = useState("BANDRA KURLA COMPLEX");
    const [estimating, setEstimating] = useState(false);
    const [estimates, setEstimates] = useState<any>(null);

    const handleGetEstimate = async (e: React.FormEvent) => {
        e.preventDefault();
        setEstimating(true);

        // Simulate geo-coding and ML fetch for now
        // In a real app, this would call our /api/rides with mock coords
        try {
            const response = await fetch("/api/rides", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pickup_lat: 19.0760,
                    pickup_lng: 72.8777,
                    drop_lat: 19.1075,
                    drop_lng: 72.8372,
                    pickup_address: pickup,
                    drop_address: drop
                })
            });
            const data = await response.json();
            setEstimates(data);
            onEstimate(data);
        } catch (err) {
            console.error(err);
        } finally {
            setEstimating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 block">Pickup Location</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                        <Input
                            value={pickup}
                            onChange={(e) => setPickup(e.target.value)}
                            className="pl-10 h-12 bg-zinc-900/50"
                            placeholder="ENTER PICKUP"
                        />
                    </div>
                </div>

                <div className="relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 block">Drop Location</label>
                    <div className="relative">
                        <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                            value={drop}
                            onChange={(e) => setDrop(e.target.value)}
                            className="pl-10 h-12 bg-zinc-900/50"
                            placeholder="ENTER DESTINATION"
                        />
                    </div>
                </div>
            </div>

            <Button
                onClick={handleGetEstimate}
                className="w-full h-14 text-lg"
                disabled={estimating || loading}
            >
                {estimating ? <Loader2 className="h-6 w-6 animate-spin" /> : "GET AI ESTIMATE"}
            </Button>

            <AnimatePresence>
                {estimates && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-primary/10 brutalist-border border-primary/50 space-y-3"
                    >
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-widest text-primary">Solo Fare</span>
                            <span className="text-2xl font-black italic">${estimates.predicted_fare}</span>
                        </div>
                        <div className="pt-2 border-t border-primary/20 flex justify-between items-center bg-zinc-900 -mx-4 px-4 py-2">
                            <div className="flex items-center space-x-2">
                                <Zap className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Predicted Cluster ID: {estimates.cluster_id}</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-500">SAVINGS UP TO 40% WITH SHARED</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
