"use client";

import { Navbar } from "@/components/shared/Navbar";
import { motion } from "framer-motion";

export default function AnalyticsPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="mx-auto max-w-7xl px-6 pt-32 pb-20">
                <div className="mb-12">
                    <h1 className="text-5xl font-black uppercase tracking-tighter">System <span className="text-primary italic">Intelligence.</span></h1>
                    <p className="mt-2 font-bold uppercase tracking-widest text-zinc-500">Live ML performance metrics</p>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                    <div className="brutalist-card">
                        <h3 className="text-xl font-black uppercase mb-4">Clustering Efficiency</h3>
                        <div className="h-48 bg-foreground/5 border-2 border-foreground/10 flex items-center justify-center italic text-zinc-500">
                            Data Visualizations Coming in Phase 6...
                        </div>
                    </div>
                    <div className="brutalist-card">
                        <h3 className="text-xl font-black uppercase mb-4">Fare Accuracy</h3>
                        <div className="h-48 bg-foreground/5 border-2 border-foreground/10 flex items-center justify-center italic text-zinc-500">
                            Data Visualizations Coming in Phase 6...
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
