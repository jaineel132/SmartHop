"use client";

import Link from "next/link";
import { Navbar } from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Zap, Shield, Users, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen overscroll-none pb-20">
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/5 to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 mx-auto max-w-5xl text-center"
        >
          <div className="mb-8 inline-flex items-center space-x-2 rounded-full border-2 border-foreground bg-accent px-4 py-1.5 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <Zap className="h-4 w-4 fill-current" />
            <span className="text-xs font-black uppercase tracking-widest text-accent-foreground">
              ML-Powered Ride Sharing
            </span>
          </div>

          <h1 className="mb-8 text-6xl font-black leading-none tracking-tighter uppercase sm:text-8xl md:text-9xl">
            THE SMARTER <br />
            <span className="text-primary italic">WAY TO HOP.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg font-medium tracking-tight text-zinc-400 md:text-xl">
            MySmartHop uses real-time clustering and AI fare prediction to make your commute faster, cheaper, and more efficient. No more waiting, just hopping.
          </p>

          <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Join the Hop
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Explore Tech
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Decorative Background Elements */}
        <div className="absolute -bottom-24 left-1/2 -z-10 h-96 w-[120%] -translate-x-1/2 rounded-[100%] border-t-2 border-primary/20 bg-primary/5 blur-3xl" />
      </section>

      {/* Grid Pattern Background */}
      <div className="pointer-events-none fixed inset-0 -z-20 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Features Section */}
      <section id="features" className="relative mx-auto max-w-7xl px-6 py-32">
        <div className="mb-20 text-center">
          <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-6xl">
            POWERED BY <span className="text-primary italic">INTELLIGENCE.</span>
          </h2>
          <div className="mx-auto mt-4 h-1 w-24 bg-primary" />
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Users className="h-8 w-8" />}
            title="Dynamic Clustering"
            description="Our KMeans engine groups riders heading in the same direction, reducing overhead and traffic."
          />
          <FeatureCard
            icon={<MapPin className="h-8 w-8" />}
            title="Route Optimization"
            description="Smart pathfinding identifies the most efficient checkpoints for group pickups and drop-offs."
          />
          <FeatureCard
            icon={<BarChart3 className="h-8 w-8" />}
            title="Fare Prediction"
            description="Real-time regression models predict optimized fares based on demand, distance, and density."
          />
          <FeatureCard
            icon={<Shield className="h-8 w-8" />}
            title="Driver Ranking"
            description="Intelligent scoring filters the best drivers based on proximity, rating, and acceptance history."
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8" />}
            title="Real-time Sync"
            description="Powered by Supabase, witness zero-latency status updates between riders and drivers."
          />
          <div className="flex flex-col items-center justify-center p-8 brutalist-card lg:col-span-1">
            <h3 className="mb-4 text-xl font-black uppercase text-center">Ready to see it in action?</h3>
            <Link href="/register" className="w-full">
              <Button variant="brutalist" className="w-full">Get Started</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-foreground py-12 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
          <span className="text-2xl font-black uppercase tracking-tighter">MySmartHop<span className="text-primary">.</span></span>
          <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-zinc-500">
            <Link href="#" className="hover:text-white">Twitter</Link>
            <Link href="#" className="hover:text-white">GitHub</Link>
            <Link href="#" className="hover:text-white">Legal</Link>
          </div>
          <p className="text-xs font-medium text-zinc-500 italic">Built for the future of urban mobility.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      className="flex flex-col space-y-4 brutalist-card"
    >
      <div className="flex h-12 w-12 items-center justify-center bg-foreground text-background">
        {icon}
      </div>
      <h3 className="text-2xl font-black uppercase tracking-tighter">{title}</h3>
      <p className="font-medium text-zinc-400">{description}</p>
    </motion.div>
  );
}
