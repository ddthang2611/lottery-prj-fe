import { cn } from "@/lib/cn"

type Props = {
  value: number
  selected?: boolean
  onClick?: () => void
}

export function NumberCell({ value, selected, onClick }: Props) {

  return (
    <button
      onClick={onClick}
      className={cn(
        "h-10 rounded-lg border text-sm",
        "flex items-center justify-center",
        selected && "bg-blue-600 text-white"
      )}
    >
      {value}
    </button>
  )
}