"use client"

import { useTransition, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useLocale, useTranslations } from "next-intl"
import {
  ArrowUpRight,
  CircleHelp,
  Languages,
  LogOut,
  MonitorCog,
  Moon,
  MoreHorizontal,
  Settings,
  ShieldCheck,
  Sun,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LanguageFlag } from "@/components/language-flag"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { localeCookieName, type AppLocale } from "@/i18n/config"
import { useUiLanguages } from "@/features/languages/hooks/use-ui-languages"
import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider"
import { useAuthUser } from "@/features/auth/components/auth-user-provider"
import { logoutAndRedirect } from "@/features/auth/api/auth.client"
import { cn } from "@/lib/utils"

function useAccount() {
  const brand = useSiteBrand()
  const currentUser = useAuthUser()
  const name = currentUser.name || `Tài khoản ${brand.siteName}`
  const email = currentUser.email
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || brand.siteName.slice(0, 2).toUpperCase()

  return {
    name,
    email,
    image: currentUser.avatar || undefined,
    initials,
    loyaltyTierKey: currentUser.loyaltyTierKey,
  }
}

const loyaltyAvatarFrames: Partial<Record<string, string>> = {
  bronze: "/assets/images/loyalty/avatar-frames/bronze.webp",
  gold: "/assets/images/loyalty/avatar-frames/gold.webp",
  diamond: "/assets/images/loyalty/avatar-frames/diamond.webp",
}

function AccountAvatar({
  className,
  showLoyaltyFrame = false,
}: {
  className?: string
  showLoyaltyFrame?: boolean
}) {
  const account = useAccount()
  const frame = showLoyaltyFrame
    ? loyaltyAvatarFrames.diamond
    : undefined

  if (frame) {
    return (
      <span className={cn("relative isolate block size-10 shrink-0", className)}>
        <Avatar className="absolute inset-[14%] size-[72%]">
          <AvatarImage src={account.image} alt={account.name} />
          <AvatarFallback>{account.initials}</AvatarFallback>
        </Avatar>
        <Image
          src={frame}
          alt=""
          fill
          sizes="46px"
          aria-hidden="true"
          className="pointer-events-none z-10 select-none object-contain object-center"
        />
      </span>
    )
  }

  return (
    <Avatar className={cn("size-8", className)}>
      <AvatarImage src={account.image} alt={account.name} />
      <AvatarFallback>{account.initials}</AvatarFallback>
    </Avatar>
  )
}

/**
 * Kiểu "swap": mặt trời và mặt trăng chồng lên nhau, đổi chỗ bằng xoay + thu
 * nhỏ/hiện mờ. Đặt trong badge có viền, cùng kiểu với ô ngôn ngữ bên dưới.
 */
function ThemeSwap({ dark, label }: { dark: boolean; label: string }) {
  const icon =
    "absolute inset-0 size-3.5 transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none"
  return (
    <span className="flex items-center gap-1.5 rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
      <span aria-hidden="true" className="relative size-3.5">
        <Sun className={cn(icon, dark ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")} />
        <Moon className={cn(icon, dark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0")} />
      </span>
      {label}
    </span>
  )
}

function UserMenuContent() {
  const account = useAccount()
  const currentUser = useAuthUser()
  const t = useTranslations("Dashboard")
  const { theme = "light", setTheme } = useTheme()
  const currentTheme = theme === "dark" ? "dark" : "light"
  const locale = useLocale() as AppLocale
  const [isChangingLocale, startLocaleTransition] = useTransition()
  const uiLanguages = useUiLanguages()
  const { showLanguageFlags } = useSiteBrand()
  const canAccessAdmin = currentUser.permissions.includes("admin.access")

  const currentLanguage = uiLanguages.items.find(
    (item) => item.locale === locale,
  )

  const handleLocaleChange = (value: string) => {
    const nextLocale = uiLanguages.items.find((item) => item.locale === value)?.locale
    if (!nextLocale || nextLocale === locale) return

    document.cookie = [
      `${localeCookieName}=${nextLocale}`,
      "path=/",
      "max-age=31536000",
      "samesite=lax",
    ].join("; ")

    startLocaleTransition(() => window.location.reload())
  }

  return (
    <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-lg p-1.5">
      <DropdownMenuLabel className="px-2 py-2 font-normal">
        <div className="flex min-w-0 items-center gap-3">
          <AccountAvatar className="size-[46px]" showLoyaltyFrame />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{account.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{account.email}</p>
          </div>
        </div>
      </DropdownMenuLabel>

      <DropdownMenuSeparator />
      {canAccessAdmin ? (
        <>
          <DropdownMenuItem
            asChild
            className="bg-primary/[0.06] text-primary focus:bg-primary/10 focus:text-primary"
          >
            <Link href="/admin">
              <ShieldCheck className="size-4" />
              <span className="flex-1">{t("topbar.adminArea")}</span>
              <ArrowUpRight className="size-3.5 opacity-70" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      ) : null}
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href="/member/account">
            <Settings className="size-4" />
            {t("topbar.accountSettings")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuItem
        role="menuitemcheckbox"
        aria-checked={currentTheme === "dark"}
        aria-label={`${t("topbar.theme")}: ${t(`topbar.${currentTheme}`)}`}
        onSelect={(event) => {
          // Giữ menu mở để thấy hiệu ứng swap.
          event.preventDefault()
          setTheme(currentTheme === "dark" ? "light" : "dark")
        }}
      >
        <MonitorCog className="size-4" />
        <span className="flex-1">{t("topbar.theme")}</span>
        <ThemeSwap dark={currentTheme === "dark"} label={t(`topbar.${currentTheme}`)} />
      </DropdownMenuItem>

      <DropdownMenuSub>
        {/* Ẩn mũi tên ">" mặc định của SubTrigger (thẻ svg cuối cùng). */}
        <DropdownMenuSubTrigger disabled={isChangingLocale} className="[&>svg:last-child]:hidden">
          <Languages className="size-4" />
          <span className="flex-1">{t("topbar.language")}</span>
          <span className="flex items-center gap-1.5 rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
            {showLanguageFlags ? (
              <LanguageFlag code={currentLanguage?.flag} />
            ) : null}
            {currentLanguage?.label ?? locale.toUpperCase()}
          </span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-40">
          <DropdownMenuRadioGroup value={locale} onValueChange={handleLocaleChange}>
            {uiLanguages.items.map((item) => (
              <DropdownMenuRadioItem key={item.locale} value={item.locale} disabled={isChangingLocale}>
                {showLanguageFlags ? <LanguageFlag code={item.flag} /> : null}
                {item.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuItem asChild>
        <Link href="/member/support"><CircleHelp className="size-4" />{t("nav.support")}</Link>
      </DropdownMenuItem>

      <DropdownMenuSeparator />
      <DropdownMenuItem
        variant="destructive"
        onSelect={() => void logoutAndRedirect("/login")}
      >
        <LogOut className="size-4" />
        {t("topbar.logout")}
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}

export function UserMenu({ children }: { children?: ReactNode }) {
  const t = useTranslations("Dashboard")
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            {children ?? (
              <Button type="button" variant="ghost" size="icon" className="size-12 rounded-lg p-0" aria-label={t("topbar.userMenu")}>
                <AccountAvatar className="size-[46px]" showLoyaltyFrame />
              </Button>
            )}
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={7}>{t("topbar.userMenu")}</TooltipContent>
      </Tooltip>
      <UserMenuContent />
    </DropdownMenu>
  )
}

export function SidebarAccountMenu({ collapsed = false }: { collapsed?: boolean }) {
  const account = useAccount()
  const trigger = collapsed ? (
    <Button type="button" variant="ghost" size="icon" className="mx-auto size-10 rounded-lg p-0" aria-label="Mở menu tài khoản">
      <AccountAvatar />
    </Button>
  ) : (
    <button type="button" className="flex h-12 w-full items-center gap-2.5 rounded-lg px-2 text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
      <AccountAvatar />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-sidebar-foreground">{account.name}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{account.email}</span>
      </span>
      <MoreHorizontal className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )

  return <UserMenu>{trigger}</UserMenu>
}
