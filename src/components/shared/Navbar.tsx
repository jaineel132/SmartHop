"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export function Navbar() {
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user);
        };
        getUser();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [supabase.auth]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <nav className="fixed top-0 z-50 w-full border-b-2 border-foreground bg-background/80 backdrop-blur-md">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
                <Link href="/" className="flex items-center space-x-2">
                    <span className="text-2xl font-black italic tracking-tighter uppercase">
                        MySmartHop<span className="text-primary">.</span>
                    </span>
                </Link>

                <div className="hidden items-center space-x-8 md:flex">
                    <Link
                        href="/#features"
                        className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors"
                    >
                        Features
                    </Link>
                    <Link
                        href="/#how-it-works"
                        className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors"
                    >
                        How it works
                    </Link>
                    {user && (
                        <Link
                            href="/dashboard"
                            className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors"
                        >
                            Dashboard
                        </Link>
                    )}
                </div>

                <div className="flex items-center space-x-4">
                    {user ? (
                        <Button variant="outline" size="sm" onClick={handleSignOut}>
                            Sign Out
                        </Button>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                                    Log In
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button variant="brutalist" size="sm">
                                    Get Started
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
