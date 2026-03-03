"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users, DollarSign, Zap, BarChart3, PieChart as PieChartIcon, Activity } from "lucide-react";

export default function AnalyticsPage() {
    const stats = [
        { label: "Total Rides Optimized", value: "1,248", icon: Activity, trend: "+14%" },
        { label: "AI Fare Savings", value: "$4,821", icon: DollarSign, trend: "+22%" },
        { label: "Active Clusters", value: "42", icon: Zap, trend: "+5%" },
        { label: "Total Passengers", value: "3,109", icon: Users, trend: "+18%" }
    ];

    return (
        <div className="min-h-screen bg-background p-6 lg:p-12 space-y-12">
            <header>
                <h1 className="text-6xl font-black uppercase tracking-tighter">System <span className="text-primary italic">Intelligence.</span></h1>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-2">Real-time Performance Metrics & AI Insights</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-8 brutalist-border bg-zinc-900/40 relative overflow-hidden group"
                    >
                        <stat.icon className="absolute -right-4 -bottom-4 h-24 w-24 text-primary/5 group-hover:text-primary/10 transition-colors" />
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">{stat.label}</div>
                            <div className="flex items-baseline justify-between">
                                <div className="text-4xl font-black italic">{stat.value}</div>
                                <div className="text-[10px] font-black text-green-500">{stat.trend}</div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Placeholder */}
                <div className="lg:col-span-2 p-8 brutalist-border bg-zinc-900/50 space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest flex items-center space-x-2">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            <span>Demand vs. Supply Optimization</span>
                        </h3>
                        <div className="flex space-x-2">
                            {['1H', '1D', '1W'].map(t => (
                                <button key={t} className={`px-3 py-1 text-[8px] font-black brutalist-border ${t === '1D' ? 'bg-primary text-black' : 'bg-zinc-800'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-64 w-full flex items-end justify-between space-x-2">
                        {[40, 60, 45, 90, 65, 80, 55, 70, 85, 40, 95, 60].map((h, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ delay: i * 0.05 }}
                                className="flex-1 bg-zinc-800 brutalist-border border-zinc-700 hover:bg-primary transition-colors cursor-help"
                            />
                        ))}
                    </div>
                </div>

                {/* AI Health */}
                <div className="p-8 brutalist-border bg-zinc-900/50 space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center space-x-2">
                        <PieChartIcon className="h-4 w-4 text-primary" />
                        <span>ML Model Health</span>
                    </h3>

                    <div className="space-y-6">
                        {[
                            { name: "Fare Regressor", accuracy: "96.4%", status: "OPTIMIZED" },
                            { name: "Clustering Engine", accuracy: "88.2%", status: "STABLE" },
                            { name: "Driver Ranker", accuracy: "92.1%", status: "LEARNING" }
                        ].map((model) => (
                            <div key={model.name} className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-zinc-400">{model.name}</span>
                                    <span className="text-primary">{model.accuracy}</span>
                                </div>
                                <div className="h-1 bg-zinc-800 w-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: model.accuracy }}
                                        className="h-full bg-primary"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-6 border-t border-zinc-800">
                        <div className="p-4 bg-primary/10 brutalist-border border-primary/30 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Zap className="h-4 w-4 text-primary fill-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest">AI Multiplier</span>
                            </div>
                            <span className="text-lg font-black italic">1.4x</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
