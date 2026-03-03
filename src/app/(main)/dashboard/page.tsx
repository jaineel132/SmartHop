"use client";

import { Navbar } from "@/components/shared/Navbar";
import { motion } from "framer-motion";

export default function RiderDashboard() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="mx-auto max-w-7xl px-6 pt-32 pb-20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="brutalist-card"
                >
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Rider <span className="text-primary italic">Dashboard</span></h1>
                    <p className="mt-4 font-bold uppercase tracking-widest text-zinc-500">Your next hop is just a click away.</p>

                    <div className="mt-12 flex h-64 items-center justify-center border-2 border-dashed border-foreground/20 italic text-zinc-500">
                        Ride Request System Coming Soon in Phase 5...
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
