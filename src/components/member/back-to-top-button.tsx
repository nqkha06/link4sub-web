"use client"

import { ArrowUp } from "lucide-react"
import { useEffect, useState, type RefObject } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const SHOW_THRESHOLD = 320

export function BackToTopButton({
  containerRef,
}: {
  containerRef: RefObject<HTMLElement | null>
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = containerRef.current

    // The container scrolls on desktop; on mobile the document scrolls.
    const handleScroll = () => {
      const offset = Math.max(node?.scrollTop ?? 0, window.scrollY)
      setVisible(offset > SHOW_THRESHOLD)
    }

    handleScroll()
    node?.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      node?.removeEventListener("scroll", handleScroll)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [containerRef])

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={scrollToTop}
      aria-label="Lên đầu trang"
      title="Lên đầu trang"
      tabIndex={visible ? 0 : -1}
      className={cn(
        "fixed bottom-5 right-4 z-30 lg:absolute size-10 rounded-full border-border bg-background/90 text-muted-foreground shadow-lg backdrop-blur transition-all duration-200 hover:bg-accent hover:text-foreground sm:bottom-6 sm:right-6",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0",
      )}
    >
      <ArrowUp className="size-4" />
    </Button>
  )
}
