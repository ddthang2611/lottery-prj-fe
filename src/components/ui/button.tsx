import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "danger" | "outline";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ className, variant = "primary", ...props }: Props) {
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    danger: "bg-red-500 text-white hover:bg-red-600",
    outline:
      "bg-transparent border border-slate-300 text-slate-700 hover:bg-slate-50",
  };

  return (
    <button
      className={cn(
        "px-4 py-2 rounded-lg text-sm font-medium transition",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
