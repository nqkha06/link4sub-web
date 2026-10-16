"use client"

import * as React from "react"

import { InputGroup as BaseInputGroup } from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

import { MEMBER_FIELD_CONTROL } from "./field-styles"

export * from "@/components/ui/input-group"

export function InputGroup({ className, ...props }: React.ComponentProps<typeof BaseInputGroup>) {
  return <BaseInputGroup className={cn(MEMBER_FIELD_CONTROL, className)} {...props} />
}
