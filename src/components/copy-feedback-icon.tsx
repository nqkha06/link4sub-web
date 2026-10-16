"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Copy } from "lucide-react"

/**
 * Icon sao chép tự đổi sang dấu tích trong giây lát khi nút chứa nó được bấm.
 * Chỉ lắng nghe click trên nút cha gần nhất, nên không phải sửa logic copy ở
 * từng nơi dùng.
 */
export function CopyFeedbackIcon({
  className,
  duration = 1500,
}: {
  className?: string
  duration?: number
}) {
  const hostRef = useRef<HTMLSpanElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const control = hostRef.current?.closest("button, a, [role='menuitem']")
    if (!control) return

    let timer: number | undefined
    const handleClick = () => {
      setCopied(true)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setCopied(false), duration)
    }

    control.addEventListener("click", handleClick)
    return () => {
      control.removeEventListener("click", handleClick)
      window.clearTimeout(timer)
    }
  }, [duration])

  const Icon = copied ? Check : Copy
  return (
    <span ref={hostRef} className="contents">
      <Icon className={className} aria-hidden="true" />
    </span>
  )
}
