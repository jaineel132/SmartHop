import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-14 w-full border-2 border-foreground bg-background px-4 py-3 text-lg font-bold ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground placeholder:uppercase placeholder:tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] transition-all disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

export { Input };
