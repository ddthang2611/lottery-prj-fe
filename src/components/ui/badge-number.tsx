import { cn } from "@/lib/cn"

type BadgeNumberProps = {
  value: number
  selected?: boolean
  winning?: boolean
  size?: "sm" | "md" | "lg"
  onClick?: () => void
}

export function BadgeNumber({
  value,
  selected = false,
  winning = false,
  size = "md",
  onClick,
}: BadgeNumberProps) {
  const sizeStyle = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-lg border font-medium transition",
        sizeStyle[size],
        selected && "bg-blue-600 text-white border-blue-600",
        winning && "bg-green-100 text-green-700 border-green-300",
        !selected && !winning && "bg-white hover:bg-gray-100"
      )}
    >
      {value}
    </button>
  )
}