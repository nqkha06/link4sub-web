"use client"

import * as React from "react"

import { Input as BaseInput } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { MEMBER_FIELD_CONTROL } from "./field-styles"

export function Input({ className, ...props }: React.ComponentProps<typeof BaseInput>) {
  return <BaseInput className={cn(MEMBER_FIELD_CONTROL, className)} {...props} />
}
