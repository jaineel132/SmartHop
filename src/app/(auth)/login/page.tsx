"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Zap, ArrowLeft, Loader2 } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (loginError) {
            setError(loginError.message);
            setLoading(false);
            return;
        }

        if (user) {
            // Fetch profile to determine role
            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (profile?.role === "driver") {
                router.push("/driver");
            } else {
                router.push("/dashboard");
            }
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
            <Link href="/" className="absolute left-6 top-8 flex items-center space-x-2 font-bold uppercase tracking-widest hover:text-primary transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center bg-foreground text-background brutalist-border">
                        <Zap className="h-8 w-8 fill-current" />
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Welcome <span className="text-primary italic">Back.</span></h1>
                    <p className="mt-2 font-bold uppercase tracking-widest text-zinc-500">Log in to your hop portal</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="bg-destructive/10 border-2 border-destructive p-4 text-sm font-bold uppercase text-destructive tracking-widest">
                            {error}
                        </div>
                    )}

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
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "LOG IN"}
                    </Button>
                </form>

                <p className="mt-8 text-center text-sm font-bold uppercase tracking-widest text-zinc-500">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-foreground hover:text-primary transition-colors">
                        Register Here
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
