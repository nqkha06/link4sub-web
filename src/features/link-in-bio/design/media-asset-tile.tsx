"use client"

import { ImageUp, Pencil, X } from "lucide-react"

import { cn } from "@/lib/utils"

/** Đuôi file (".GIF", ".MP4"…) lấy từ URL; không đoán được thì null. */
function extensionOf(url: string | undefined) {
  if (!url) return null
  try {
    const path = new URL(url, "http://local").pathname
    const match = /\.([a-z0-9]{2,5})$/i.exec(path)
    return match ? `.${match[1].toUpperCase()}` : null
  } catch {
    return null
  }
}

/**
 * Ô media kiểu guns.lol: xem trước ảnh/video đang dùng, nhãn đuôi file, nút ✕ để
 * gỡ và bấm vào ô để đổi. Chưa có file thì hiện ô trống để chọn.
 */
export function MediaAssetTile({
  kind,
  url,
  hasAsset,
  chooseLabel,
  changeLabel,
  removeLabel,
  onPick,
  onRemove,
  note,
}: {
  kind: "image" | "video"
  url?: string
  /** Đã chọn file (kể cả khi chưa có URL xem trước). */
  hasAsset: boolean
  chooseLabel: string
  changeLabel: string
  removeLabel: string
  onPick?: () => void
  onRemove?: () => void
  /** Dòng ghi chú nhỏ dưới ô (vd. "file đi kèm template"). */
  note?: string
}) {
  const extension = extensionOf(url)
  const showMedia = hasAsset && url

  return (
    <div className="max-w-md space-y-1.5">
      <div className="group relative">
        <button
          type="button"
          onClick={onPick}
          aria-label={hasAsset ? changeLabel : chooseLabel}
          title={hasAsset ? changeLabel : chooseLabel}
          className={cn(
            "relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border bg-muted/40 text-muted-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            showMedia ? "border-border bg-black" : "border-dashed border-border hover:border-primary/50 hover:text-foreground",
          )}
        >
          {showMedia ? (
            kind === "video" ? (
              <video key={url} src={url} muted loop autoPlay playsInline preload="metadata" className="absolute inset-0 size-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- ảnh xem trước từ thư viện của người dùng
              <img src={url} alt="" className="absolute inset-0 size-full object-cover" />
            )
          ) : (
            <span className="flex flex-col items-center gap-2 text-xs font-medium">
              <ImageUp className="size-6" aria-hidden />
              {chooseLabel}
            </span>
          )}
          {showMedia ? (
            <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black">
                <Pencil className="size-3.5" aria-hidden />
                {changeLabel}
              </span>
            </span>
          ) : null}
        </button>

        {showMedia && extension ? (
          <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/65 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-white backdrop-blur">
            {extension}
          </span>
        ) : null}
        {hasAsset && onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={removeLabel}
            title={removeLabel}
            className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/65 text-white backdrop-blur transition hover:bg-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
      {note ? <p className="text-[11px] leading-4 text-muted-foreground">{note}</p> : null}
    </div>
  )
}
