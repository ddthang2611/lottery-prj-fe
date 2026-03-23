import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
}

export function Button({
    className,
    variant = "primary",
    size = "md",
    ...props
}: Props) {
    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        danger: "bg-red-500 text-white hover:bg-red-600",
        outline:
            "bg-transparent border border-slate-300 text-slate-700 hover:bg-slate-50",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-5 py-3 text-base",
    };

    return (
        <button
            className={cn(
                "rounded-lg font-medium transition focus:outline-none focus:ring-2 disabled:opacity-50 disabled:pointer-events-none",
                variants[variant],
                sizes[size],
                className,
            )}
            {...props}
        />
    );
}
