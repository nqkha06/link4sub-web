"use client"

import * as React from "react"

import { SelectTrigger as BaseSelectTrigger } from "@/components/ui/select"
import { cn } from "@/lib/utils"

import { MEMBER_FIELD_CONTROL } from "./field-styles"

export * from "@/components/ui/select"

/** `data-[size=*]:h-10` để thắng `data-[size=default]:h-9` của trigger gốc. */
export function SelectTrigger({ className, ...props }: React.ComponentProps<typeof BaseSelectTrigger>) {
  return (
    <BaseSelectTrigger
      className={cn(MEMBER_FIELD_CONTROL, "data-[size=default]:h-10 data-[size=sm]:h-10", className)}
      {...props}
    />
  )
}
