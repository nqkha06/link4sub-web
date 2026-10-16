"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider"
import { MobileBrand } from "./sidebar-brand"
import { SidebarNavigation } from "./sidebar-navigation"

export function MobileSidebar({
  open,
  onOpenChange,
  canAccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  canAccess?: (permission: string) => boolean
}) {
  const t = useTranslations("Dashboard")
  const brand = useSiteBrand()
  const pathname = usePathname()
  const previousPathnameRef = useRef(pathname)

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return
    previousPathnameRef.current = pathname
    if (!open) return

    // usePathname only changes after the new route has committed. Waiting one
    // more frame lets that route paint before starting the drawer close motion.
    const frame = window.requestAnimationFrame(() => onOpenChange(false))
    return () => window.cancelAnimationFrame(frame)
  }, [onOpenChange, open, pathname])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="flex w-[min(300px,86vw)] transform-gpu flex-col gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground shadow-none will-change-transform data-[state=closed]:duration-150 data-[state=open]:duration-200 motion-reduce:duration-0 motion-reduce:will-change-auto"
        showCloseButton
      >
        <SheetHeader className="flex h-[var(--header-height)] justify-center border-b border-sidebar-border px-4 py-0 pr-12 text-left">
          <SheetTitle className="sr-only">{t("sidebar.mobileTitle", { brand: brand.siteName })}</SheetTitle>
          <SheetDescription className="sr-only">{t("sidebar.mobileDescription", { brand: brand.siteName })}</SheetDescription>
          <MobileBrand />
        </SheetHeader>
        <SidebarNavigation canAccess={canAccess} />
      </SheetContent>
    </Sheet>
  )
}
