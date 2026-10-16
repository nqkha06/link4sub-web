"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { ArrowLeftRight, LogOut, Moon, Settings, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { logoutAndRedirect } from "@/features/auth/api/auth.client"
import { useAuthUser } from "@/features/auth/components/auth-user-provider"
import { cn } from "@/lib/utils"

export function AdminHeader() {
  const t = useTranslations("Admin.shell.header")

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex min-w-0 flex-1 items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 border border-border" />

        <Link
          href="/member"
          aria-label={t("memberArea")}
          className="group/member relative inline-flex h-9 items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-primary to-primary/75 px-2.5 text-sm font-medium text-primary-foreground shadow-md shadow-primary/25 ring-1 ring-inset ring-white/15 transition-all duration-300 hover:shadow-lg hover:shadow-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] sm:pl-3 sm:pr-3.5"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover/member:translate-x-[400%] motion-reduce:hidden"
          />
          <ArrowLeftRight
            className="relative size-4"
            aria-hidden="true"
          />
          <span className="relative max-sm:hidden">
            {t("memberArea")}
          </span>
        </Link>
      </div>

      <AdminHeaderActions className="px-4 lg:px-6" />
    </header>
  )
}

export function AdminHeaderActions({
  className,
}: {
  className?: string
}) {
  const t = useTranslations("Admin.shell.header")
  const tShell = useTranslations("Admin.shell")
  const tCommon = useTranslations("Admin.common")
  const currentUser = useAuthUser()
  const userName = currentUser.name || tShell("defaultAdminName")
  const avatarFallback = userName
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  const { setTheme } = useTheme()

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative bg-transparent hover:bg-muted rounded-full">
              <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              <span className="sr-only">{t("toggleTheme")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              {tCommon("theme.light")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              {tCommon("theme.dark")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              {tCommon("theme.system")}
            </DropdownMenuItem>
          </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>

          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 rounded-lg p-0"
              aria-label={t("accountMenu")}
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage
                  src={currentUser.avatar || undefined}
                  alt={userName}
                />
                <AvatarFallback className="rounded-lg">{avatarFallback || "AD"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-64 rounded-xl p-1.5 shadow-lg"
          >
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar className="size-9 rounded-lg">
                <AvatarImage
                  src={currentUser.avatar || undefined}
                  alt={userName}
                />
                <AvatarFallback className="rounded-lg">{avatarFallback || "AD"}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {userName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {currentUser.email}
                </p>
              </div>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild className="cursor-pointer gap-2 rounded-lg">
              <Link href="/member/account">
                <Settings className="size-4 text-muted-foreground" />
                <span>{t("accountSettings")}</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer gap-2 rounded-lg"
              onSelect={() => void logoutAndRedirect("/login")}
            >
              <LogOut className="size-4" />
              <span>{t("logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
