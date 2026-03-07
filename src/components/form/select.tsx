"use client"

import * as SelectPrimitive from "@radix-ui/react-select"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/cn"

interface Option {
  label: string
  value: string
}

interface Props {
  value?: string
  onChange?: (value: string) => void
  options: Option[]
  placeholder?: string
  className?: string
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  className
}: Props) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange}>
      <SelectPrimitive.Trigger
        className={cn(
          "flex items-center justify-between px-3 py-2 rounded-lg border text-sm w-full",
          "bg-white hover:bg-gray-50",
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown size={16} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="bg-white border rounded-lg shadow-md">
          <SelectPrimitive.Viewport className="p-1">
            {options.map((o) => (
              <SelectPrimitive.Item
                key={o.value}
                value={o.value}
                className="flex items-center justify-between px-3 py-2 text-sm rounded cursor-pointer hover:bg-gray-100"
              >
                <SelectPrimitive.ItemText>
                  {o.label}
                </SelectPrimitive.ItemText>

                <SelectPrimitive.ItemIndicator>
                  <Check size={14} />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}