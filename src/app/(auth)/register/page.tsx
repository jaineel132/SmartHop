"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Zap, ArrowLeft, Loader2, User, Car } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [role, setRole] = useState<"rider" | "driver">("rider");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    role,
                },
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            // Role-aware redirection
            if (role === 'driver') {
                router.push("/driver");
            } else {
                router.push("/dashboard");
            }
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6 py-20">
            <Link href="/" className="absolute left-6 top-8 flex items-center space-x-2 font-bold uppercase tracking-widest hover:text-primary transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center bg-foreground text-background brutalist-border">
                        <Zap className="h-8 w-8 fill-current" />
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Join the <span className="text-primary italic">Hop.</span></h1>
                    <p className="mt-2 font-bold uppercase tracking-widest text-zinc-500">Create your smart mobility identity</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-6">
                    {error && (
                        <div className="bg-destructive/10 border-2 border-destructive p-4 text-sm font-bold uppercase text-destructive tracking-widest">
                            {error}
                        </div>
                    )}

                    {/* Role Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Choose your role</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setRole("rider")}
                                className={cn(
                                    "flex flex-col items-center justify-center space-y-2 p-4 border-2 transition-all",
                                    role === "rider"
                                        ? "bg-foreground text-background border-foreground shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
                                        : "bg-background text-foreground border-foreground/20 hover:border-foreground"
                                )}
                            >
                                <User className="h-6 w-6" />
                                <span className="text-xs font-black uppercase tracking-widest">Rider</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole("driver")}
                                className={cn(
                                    "flex flex-col items-center justify-center space-y-2 p-4 border-2 transition-all",
                                    role === "driver"
                                        ? "bg-foreground text-background border-foreground shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
                                        : "bg-background text-foreground border-foreground/20 hover:border-foreground"
                                )}
                            >
                                <Car className="h-6 w-6" />
                                <span className="text-xs font-black uppercase tracking-widest">Driver</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Full Name</label>
                        <Input
                            type="text"
                            placeholder="JOHN DOE"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Email Address</label>
                        <Input
                            type="email"
                            placeholder="YOUR@EMAIL.COM"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Password</label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <Button type="submit" size="lg" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "CREATE ACCOUNT"}
                    </Button>
                </form>

                <p className="mt-8 text-center text-sm font-bold uppercase tracking-widest text-zinc-500">
                    Already a hopper?{" "}
                    <Link href="/login" className="text-foreground hover:text-primary transition-colors">
                        Log In
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
