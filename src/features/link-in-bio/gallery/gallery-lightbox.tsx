"use client";
/* eslint-disable @next/next/no-img-element */

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useCallback, useEffect, useState } from "react";

import type { BioGalleryImageDto } from "@/lib/api-client";

export function GalleryLightbox({
  images,
  index,
  onIndexChange,
  onClose,
}: {
  images: BioGalleryImageDto[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const [loadedIds, setLoadedIds] = useState<ReadonlySet<string>>(() => new Set());
  const image = images[index];
  const hasMultiple = images.length > 1;
  const loaded = image ? loadedIds.has(image.id) : false;

  const goPrev = useCallback(() => {
    onIndexChange((index - 1 + images.length) % images.length);
  }, [index, images.length, onIndexChange]);

  const goNext = useCallback(() => {
    onIndexChange((index + 1) % images.length);
  }, [index, images.length, onIndexChange]);

  useEffect(() => {
    if (!hasMultiple) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") goPrev();
      else if (event.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goPrev, goNext, hasMultiple]);

  if (!image) return null;

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="
            fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm
            data-[state=closed]:animate-out data-[state=closed]:fade-out-0
            data-[state=open]:animate-in data-[state=open]:fade-in-0
          "
        />
        <DialogPrimitive.Content
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="
            fixed inset-0 z-[70] flex flex-col items-center justify-center
            gap-4 p-4 outline-none
            data-[state=closed]:animate-out data-[state=closed]:fade-out-0
            data-[state=open]:animate-in data-[state=open]:fade-in-0
            sm:p-8
          "
        >
          <DialogPrimitive.Title className="sr-only">
            {image.caption || image.alt || `Ảnh ${index + 1} trong bộ sưu tập`}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Dùng phím mũi tên trái/phải để chuyển ảnh, phím Esc để đóng.
          </DialogPrimitive.Description>

          <DialogPrimitive.Close
            aria-label="Đóng"
            className="
              absolute right-3 top-3 z-10 flex size-10 items-center
              justify-center rounded-full bg-black/40 text-white
              backdrop-blur transition
              hover:bg-black/60
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-white/70
              sm:right-5 sm:top-5
            "
          >
            <X className="size-5" />
          </DialogPrimitive.Close>

          {hasMultiple ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Ảnh trước"
                className="
                  absolute left-2 top-1/2 z-10 flex size-11 -translate-y-1/2
                  items-center justify-center rounded-full bg-black/40
                  text-white backdrop-blur transition
                  hover:bg-black/60
                  focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-white/70
                  sm:left-4
                "
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Ảnh sau"
                className="
                  absolute right-2 top-1/2 z-10 flex size-11 -translate-y-1/2
                  items-center justify-center rounded-full bg-black/40
                  text-white backdrop-blur transition
                  hover:bg-black/60
                  focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-white/70
                  sm:right-4
                "
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          ) : null}

          <div className="relative flex min-h-0 w-full max-w-4xl flex-1 items-center justify-center">
            {!loaded ? (
              <span className="absolute size-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : null}
            <img
              key={image.id}
              src={image.url}
              alt={image.alt || image.caption || ""}
              onLoad={() =>
                setLoadedIds((current) =>
                  current.has(image.id) ? current : new Set(current).add(image.id),
                )
              }
              className="max-h-[78vh] max-w-full rounded-lg object-contain shadow-2xl"
            />
          </div>

          {image.caption || hasMultiple ? (
            <div className="flex flex-col items-center gap-1.5 px-4 text-center text-white">
              {image.caption ? (
                <p className="max-w-lg text-sm font-medium leading-5">{image.caption}</p>
              ) : null}
              {hasMultiple ? (
                <p className="text-xs tabular-nums text-white/70">
                  {index + 1} / {images.length}
                </p>
              ) : null}
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
