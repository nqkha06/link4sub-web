import type { LucideIcon } from "lucide-react"
import {
  Bell,
  CircleHelp,
  Code2,
  FileCode2,
  FileText,
  Folder,
  Gauge,
  Library,
  Link2,
  Medal,
  Trophy,
  User,
  Users,
  Wallet,
} from "lucide-react"

export type NavigationTitleKey =
  | "nav.overview"
  | "nav.links"
  | "nav.library"
  | "nav.files"
  | "nav.snippets"
  | "nav.bio"
  | "nav.withdraw"
  | "nav.referrals"
  | "nav.loyalty"
  | "nav.leaderboard"
  | "nav.account"
  | "nav.support"
  | "nav.announcements"
  | "nav.api"

export type NavigationItem = {
  titleKey: NavigationTitleKey
  href: string
  icon: LucideIcon
  permission?: string
  activePrefixes?: string[]
  badge?: string
}

export type NavigationParent = {
  titleKey: NavigationTitleKey
  icon: LucideIcon
  permission?: string
  children: NavigationItem[]
}

export type NavigationEntry = NavigationItem | NavigationParent

export type NavigationGroup = {
  labelKey: "groups.overview" | "groups.content" | "groups.monetization" | "groups.community" | "groups.system"
  items: NavigationEntry[]
}

export function isNavigationParent(entry: NavigationEntry): entry is NavigationParent {
  return "children" in entry
}

export const navigationGroups: NavigationGroup[] = [
  {
    labelKey: "groups.overview",
    items: [{ titleKey: "nav.overview", href: "/member", icon: Gauge }],
  },
  {
    labelKey: "groups.content",
    items: [
      {
        titleKey: "nav.links",
        href: "/member/links",
        icon: Link2,
        activePrefixes: ["/member/links", "/member/create"],
      },
      {
        titleKey: "nav.library",
        icon: Library,
        children: [
          { titleKey: "nav.files", href: "/member/files", icon: Folder },
          { titleKey: "nav.snippets", href: "/member/snippets", icon: FileCode2 },
        ],
      },
      { titleKey: "nav.bio", href: "/member/bio", icon: FileText },
    ],
  },
  {
    labelKey: "groups.monetization",
    items: [
      { titleKey: "nav.withdraw", href: "/member/withdraw", icon: Wallet },
    ],
  },
  {
    labelKey: "groups.community",
    items: [
      { titleKey: "nav.referrals", href: "/member/referrals", icon: Users },
      { titleKey: "nav.loyalty", href: "/member/loyalty", icon: Trophy },
      { titleKey: "nav.leaderboard", href: "/member/leaderboard", icon: Medal },
    ],
  },
  {
    labelKey: "groups.system",
    items: [
      { titleKey: "nav.announcements", href: "/member/announcements", icon: Bell },
      { titleKey: "nav.account", href: "/member/account", icon: User },
      { titleKey: "nav.api", href: "/member/api", icon: Code2 },
      { titleKey: "nav.support", href: "/member/support", icon: CircleHelp },
    ],
  },
]

export function isNavigationItemActive(pathname: string, item: NavigationItem) {
  if (item.href === "/member") return pathname === "/member"

  const prefixes = item.activePrefixes ?? [item.href]
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function isNavigationParentActive(pathname: string, parent: NavigationParent) {
  return parent.children.some((child) => isNavigationItemActive(pathname, child))
}

export function getVisibleNavigationGroups(canAccess?: (permission: string) => boolean) {
  const allowed = (permission?: string) => !permission || !canAccess || canAccess(permission)

  return navigationGroups
    .map((group) => ({
      ...group,
      items: group.items
        .map((entry) => {
          if (isNavigationParent(entry)) {
            const children = entry.children.filter((child) => allowed(child.permission))
            if (!children.length || !allowed(entry.permission)) return null
            return { ...entry, children }
          }
          return allowed(entry.permission) ? entry : null
        })
        .filter((entry): entry is NavigationEntry => entry !== null),
    }))
    .filter((group) => group.items.length > 0)
}
