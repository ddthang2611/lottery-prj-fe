import { cn } from "@/lib/cn";
import { MouseEventHandler } from "react";

type BadgeNumberProps = {
    value: number;
    selected?: boolean;
    winning?: boolean;
    disabled?: boolean;
    size?: "sm" | "md" | "lg";
    onClick?: MouseEventHandler<HTMLButtonElement>;
};

export function BadgeNumber({
    value,
    selected = false,
    winning = false,
    disabled = false,
    size = "md",
    onClick,
}: BadgeNumberProps) {
    const sizeStyle = {
        sm: "w-8 h-8 text-sm",
        md: "w-10 h-10 text-sm",
        lg: "w-12 h-12 text-base",
    };

    const stateStyle = winning
        ? "bg-green-100 text-green-700 border-green-300"
        : selected
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white hover:bg-gray-100";

    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "flex items-center justify-center rounded-lg border font-medium transition cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none",
                sizeStyle[size],
                stateStyle,
            )}
        >
            {value}
        </button>
    );
}
