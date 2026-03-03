"use client";

import { Navbar } from "@/components/shared/Navbar";
import { motion } from "framer-motion";

export default function DriverDashboard() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="mx-auto max-w-7xl px-6 pt-32 pb-20">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="brutalist-card border-primary"
                >
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Driver <span className="text-primary italic">Command</span></h1>
                    <p className="mt-4 font-bold uppercase tracking-widest text-zinc-500">Ready for incoming requests.</p>

                    <div className="mt-12 flex h-64 items-center justify-center border-2 border-dashed border-primary/20 italic text-zinc-500">
                        Incoming Requests System Coming Soon in Phase 5...
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
