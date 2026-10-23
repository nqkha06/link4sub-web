"use client"

import { useRef, useState } from "react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

import {
  formatColor,
  hexToRgba,
  hsvaToRgba,
  parseColor,
  rgbaToHex,
  rgbaToHsva,
  type ColorFormat,
  type Hsva,
} from "./color-math"

const SWATCHES = ["#FFFFFF", "#000000", "#A1A1AA", "#EF4444", "#F97316", "#FACC15", "#22C55E", "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899", "#C98C61"]

/** Nền ô bàn cờ để thấy độ trong suốt. */
const CHECKER = "repeating-conic-gradient(#d4d4d8 0% 25%, #ffffff 0% 50%) 50% / 8px 8px"

function toHsva(value: string): Hsva {
  return rgbaToHsva(hexToRgba(value) ?? { r: 255, g: 255, b: 255, a: 1 })
}

/**
 * Kéo chuột/ngón tay trên một vùng: gọi `onMove` với toạ độ 0–1, tối đa một lần
 * mỗi khung hình (requestAnimationFrame) để kéo mượt.
 */
function useDrag(onMove: (x: number, y: number) => void, onEnd: () => void) {
  const frame = useRef(0)
  const begin = (event: React.PointerEvent<HTMLElement>) => {
    const element = event.currentTarget
    element.setPointerCapture(event.pointerId)
    const move = (clientX: number, clientY: number) => {
      const rect = element.getBoundingClientRect()
      const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height))
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => onMove(x, y))
    }
    move(event.clientX, event.clientY)
    const onPointerMove = (next: PointerEvent) => move(next.clientX, next.clientY)
    const stop = () => {
      element.removeEventListener("pointermove", onPointerMove)
      element.removeEventListener("pointerup", stop)
      element.removeEventListener("pointercancel", stop)
      onEnd()
    }
    element.addEventListener("pointermove", onPointerMove)
    element.addEventListener("pointerup", stop)
    element.addEventListener("pointercancel", stop)
  }
  return begin
}

/**
 * Bộ chọn màu kiểu Coloris: vùng bão hoà/độ sáng, thanh màu (hue), thanh độ trong
 * suốt, ô nhập Hex/RGB/HSL và màu mẫu. Giá trị trả về luôn là hex in hoa
 * (#RRGGBB hoặc #RRGGBBAA khi có độ trong suốt).
 */
export function ColorPicker({ value, onChange, alpha = true }: { value: string; onChange: (value: string) => void; alpha?: boolean }) {
  // Giữ HSV nội bộ (không suy lại từ hex) để không mất hue khi kéo về trắng/đen.
  const [state, setState] = useState(() => ({ value, hsva: toHsva(value) }))
  const [format, setFormat] = useState<ColorFormat>("hex")
  const [text, setText] = useState<string | null>(null)
  if (state.value !== value) {
    // Giá trị đổi từ bên ngoài (hoàn tác, gõ tay ở ô ngoài…) → đồng bộ lại.
    setState({ value, hsva: toHsva(value) })
  }
  const { hsva } = state
  const rgba = hsvaToRgba(hsva)
  const solid = rgbaToHex({ ...rgba, a: 1 })

  const update = (next: Partial<Hsva>) => {
    const hsvaNext = { ...hsva, ...next }
    const hex = rgbaToHex(hsvaToRgba(hsvaNext), alpha)
    setState({ value: hex, hsva: hsvaNext })
    setText(null)
    if (hex !== value) onChange(hex)
  }
  const done = () => undefined
  const dragArea = useDrag((x, y) => update({ s: x, v: 1 - y }), done)
  const dragHue = useDrag((x) => update({ h: x * 360 }), done)
  const dragAlpha = useDrag((x) => update({ a: Math.round(x * 100) / 100 }), done)

  const arrows = (event: React.KeyboardEvent, axis: "area" | "hue" | "alpha") => {
    const step = event.shiftKey ? 0.1 : 0.01
    const dx = event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0
    const dy = event.key === "ArrowUp" ? step : event.key === "ArrowDown" ? -step : 0
    if (!dx && !dy) return
    event.preventDefault()
    const clamp = (n: number) => Math.min(1, Math.max(0, n))
    if (axis === "area") update({ s: clamp(hsva.s + dx), v: clamp(hsva.v + dy) })
    if (axis === "hue") update({ h: Math.min(360, Math.max(0, hsva.h + (dx || dy) * 360)) })
    if (axis === "alpha") update({ a: clamp(hsva.a + (dx || dy)) })
  }

  const commitText = () => {
    if (text === null) return
    const parsed = parseColor(text)
    setText(null)
    if (!parsed) return
    const hex = rgbaToHex(parsed, alpha)
    setState({ value: hex, hsva: rgbaToHsva(parsed) })
    if (hex !== value) onChange(hex)
  }

  return (
    <div className="space-y-3">
      <div
        role="slider"
        tabIndex={0}
        aria-label="Saturation / brightness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsva.s * 100)}
        aria-valuetext={`${Math.round(hsva.s * 100)}%, ${Math.round(hsva.v * 100)}%`}
        onPointerDown={dragArea}
        onKeyDown={(event) => arrows(event, "area")}
        className="relative h-36 cursor-crosshair touch-none rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), hsl(${hsva.h} 100% 50%)` }}
      >
        <span
          className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
          style={{ left: `${hsva.s * 100}%`, top: `${(1 - hsva.v) * 100}%`, background: solid }}
        />
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hsva.h)}
        onPointerDown={dragHue}
        onKeyDown={(event) => arrows(event, "hue")}
        className="relative h-3 cursor-pointer touch-none rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
      >
        <span className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]" style={{ left: `${(hsva.h / 360) * 100}%`, background: `hsl(${hsva.h} 100% 50%)` }} />
      </div>

      {alpha ? (
        <div
          role="slider"
          tabIndex={0}
          aria-label="Opacity"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(hsva.a * 100)}
          onPointerDown={dragAlpha}
          onKeyDown={(event) => arrows(event, "alpha")}
          className="relative h-3 cursor-pointer touch-none rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ background: `linear-gradient(to right, transparent, ${solid}), ${CHECKER}` }}
        >
          <span className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]" style={{ left: `${hsva.a * 100}%`, background: `linear-gradient(${rgbaToHex(rgba)}, ${rgbaToHex(rgba)}), ${CHECKER}` }} />
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <div className="flex shrink-0 rounded-md bg-muted p-0.5 text-[11px] font-medium">
          {(["hex", "rgb", "hsl"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => { setFormat(item); setText(null) }}
              className={cn("rounded px-1.5 py-0.5 uppercase transition", format === item ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {item}
            </button>
          ))}
        </div>
        <input
          aria-label="Color value"
          value={text ?? formatColor(rgba, format, alpha)}
          onChange={(event) => setText(event.target.value)}
          onBlur={commitText}
          onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); commitText() } }}
          spellCheck={false}
          className="h-7 min-w-0 flex-1 rounded-md border border-input bg-background px-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            title={swatch}
            aria-label={swatch}
            onClick={() => {
              const parsed = hexToRgba(swatch)!
              const next = { ...rgbaToHsva(parsed), a: hsva.a }
              update(next)
            }}
            className="aspect-square rounded-md border border-border transition hover:scale-110"
            style={{ background: swatch }}
          />
        ))}
      </div>
    </div>
  )
}

/** Ô màu trong Bio Studio: ô nhập hex + ô màu mở bộ chọn màu dạng popover. */
export function ColorPickerInput({ value, onChange, alpha = true }: { value: string; onChange: (value: string) => void; alpha?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-1.5">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Open color picker"
            className="relative size-8 shrink-0 overflow-hidden rounded-md border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ background: CHECKER }}
          >
            <span className="absolute inset-0" style={{ background: hexToRgba(value) ? value : "transparent" }} />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-3">
          <ColorPicker value={value} onChange={onChange} alpha={alpha} />
        </PopoverContent>
      </Popover>
      <input
        aria-label="Hex color"
        value={value}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        spellCheck={false}
        className="h-8 min-w-0 flex-1 border-0 bg-transparent px-1 font-mono text-xs outline-none"
      />
    </div>
  )
}
