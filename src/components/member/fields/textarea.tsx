"use client"

import * as React from "react"

import { Textarea as BaseTextarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { MEMBER_FIELD_TEXTAREA } from "./field-styles"

export function Textarea({ className, ...props }: React.ComponentProps<typeof BaseTextarea>) {
  return <BaseTextarea className={cn(MEMBER_FIELD_TEXTAREA, className)} {...props} />
}
