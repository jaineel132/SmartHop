"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Power, MapPin, Navigation, User, Bell, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DriverDashboard() {
    const [isOnline, setIsOnline] = useState(false);
    const [activeRequest, setActiveRequest] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const toggleOnline = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/drivers", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_available: !isOnline }),
            });
            if (res.ok) {
                setIsOnline(!isOnline);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Simulate an incoming request for demo purposes
    useEffect(() => {
        if (isOnline && !activeRequest) {
            const timer = setTimeout(() => {
                setActiveRequest({
                    id: "ride_123",
                    rider_name: "John Doe",
                    pickup: "Mumbai Central",
                    drop: "Bandra West",
                    fare: 18.50,
                    dist: "4.2 km"
                });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, activeRequest]);

    return (
        <div className="min-h-screen bg-background p-6 lg:p-12">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-5xl font-black uppercase tracking-tighter">Command <span className="text-primary italic">Center.</span></h1>
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-2">Driver Operations Hub v1.0</p>
                    </div>

                    <button
                        onClick={toggleOnline}
                        disabled={loading}
                        className={`
              h-20 px-10 brutalist-border transition-all flex items-center space-x-4
              ${isOnline
                                ? "bg-green-500 text-black shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
                                : "bg-zinc-900 text-zinc-500 border-zinc-800"}
            `}
                    >
                        <Power className={`h-8 w-8 ${isOnline ? "animate-pulse" : ""}`} />
                        <div className="text-left">
                            <div className="text-xs font-black uppercase tracking-widest">System Status</div>
                            <div className="text-2xl font-black">{isOnline ? "ONLINE" : "OFFLINE"}</div>
                        </div>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Stats Column */}
                    <div className="space-y-6">
                        <div className="p-8 brutalist-border bg-zinc-900/50 space-y-4">
                            <div className="flex items-center space-x-3 text-primary">
                                <Shield className="h-5 w-5" />
                                <span className="text-xs font-black uppercase tracking-widest">Daily Revenue</span>
                            </div>
                            <div className="text-5xl font-black italic">$142.00</div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">+12% from yesterday</p>
                        </div>

                        <div className="p-8 brutalist-border bg-zinc-900/50 space-y-4">
                            <div className="flex items-center space-x-3 text-primary">
                                <User className="h-5 w-5" />
                                <span className="text-xs font-black uppercase tracking-widest">Driver Rating</span>
                            </div>
                            <div className="text-5xl font-black italic">4.92</div>
                            <div className="flex space-x-1">
                                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-1.5 w-6 bg-primary" />)}
                            </div>
                        </div>
                    </div>

                    {/* Main Action Area */}
                    <div className="lg:col-span-2">
                        <AnimatePresence mode="wait">
                            {activeRequest ? (
                                <motion.div
                                    key="request"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="h-full brutalist-border border-primary p-10 bg-primary/5 flex flex-col justify-between relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4">
                                        <div className="bg-primary text-black text-[10px] font-black px-3 py-1 uppercase tracking-widest animate-bounce">
                                            New Request
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="flex items-center space-x-6">
                                            <div className="h-20 w-20 bg-foreground text-background brutalist-border flex items-center justify-center">
                                                <User className="h-10 w-10" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-black uppercase tracking-widest text-primary">Passenger</div>
                                                <div className="text-4xl font-black uppercase tracking-tighter">{activeRequest.rider_name}</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pickup</div>
                                                <div className="flex items-center space-x-2">
                                                    <MapPin className="h-4 w-4 text-primary" />
                                                    <span className="font-bold uppercase">{activeRequest.pickup}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Destination</div>
                                                <div className="flex items-center space-x-2">
                                                    <Navigation className="h-4 w-4 text-zinc-400" />
                                                    <span className="font-bold uppercase">{activeRequest.drop}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-12 flex flex-col sm:flex-row gap-4">
                                        <Button
                                            size="lg"
                                            className="flex-1 h-20 text-2xl"
                                            onClick={() => setActiveRequest(null)}
                                        >
                                            ACCEPT RIDE
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="flex-1 h-20 text-2xl border-foreground/20 hover:bg-red-500 hover:text-black hover:border-red-500"
                                            onClick={() => setActiveRequest(null)}
                                        >
                                            DECLINE
                                        </Button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full min-h-[400px] brutalist-border border-dashed border-zinc-800 flex flex-col items-center justify-center text-center p-10"
                                >
                                    <div className={`p-6 bg-zinc-900 rounded-full mb-6 ${isOnline ? "animate-pulse" : ""}`}>
                                        <Bell className={`h-12 w-12 ${isOnline ? "text-primary" : "text-zinc-700"}`} />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">
                                        {isOnline ? "Scanning for Smart Requests..." : "System is Offline"}
                                    </h3>
                                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 max-w-xs">
                                        {isOnline
                                            ? "AI is analyzing passenger clusters in your sector."
                                            : "Go online to start receiving intelligent ride matching."}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
