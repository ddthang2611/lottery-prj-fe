"use client"

import * as SelectPrimitive from "@radix-ui/react-select"
import { ChevronDown, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/cn"

export interface Option {
  label: string
  value: string
}

interface Props {
  value?: string
  onChange?: (value: string) => void
  options: Option[]
  placeholder?: string
  className?: string
  disabled?: boolean
  isLoading?: boolean
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled = false,
  isLoading = false
}: Props) {
  return (
    <SelectPrimitive.Root 
      value={value} 
      onValueChange={onChange} 
      disabled={disabled || isLoading}
    >
      <SelectPrimitive.Trigger
        className={cn(
          "flex items-center justify-between px-3 py-3 rounded-lg border text-sm w-full outline-none transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "bg-white hover:bg-gray-50 data-[disabled]:opacity-60 data-[disabled]:cursor-not-allowed",
          className
        )}
      >
        <div className="truncate pr-2 flex-1 text-left">
          {isLoading ? (
            <span className="text-gray-400">Đang tải danh sách...</span>
          ) : (
            <SelectPrimitive.Value placeholder={placeholder} />
          )}
        </div>
        <SelectPrimitive.Icon>
          {isLoading ? (
            <Loader2 size={16} className="animate-spin text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-500" />
          )}
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content 
          position="popper" 
          sideOffset={4}
          className="bg-white border rounded-lg shadow-lg w-[var(--radix-select-trigger-width)] max-h-60 overflow-hidden z-50"
        >
          <SelectPrimitive.Viewport className="p-1 overflow-y-auto">
            {options.length === 0 && !isLoading ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                Không có dữ liệu
              </div>
            ) : (
              options.map((o) => (
                <SelectPrimitive.Item
                  key={o.value}
                  value={o.value}
                  className="flex items-center justify-between px-3 py-2.5 text-sm rounded cursor-pointer outline-none focus:bg-gray-100 data-[state=checked]:bg-blue-50 data-[state=checked]:text-blue-700 data-[state=checked]:font-medium"
                >
                  <SelectPrimitive.ItemText>
                    {o.label}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator>
                    <Check size={16} className="text-blue-600" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))
            )}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}