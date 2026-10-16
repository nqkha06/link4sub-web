"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconAdjustments,
  IconAward,
  IconBell,
  IconCashBanknote,
  IconChartBar,
  IconClockPlay,
  IconCode,
  IconCreditCardPay,
  IconDashboard,
  IconFiles,
  IconFingerprint,
  IconFlag,
  IconId,
  IconLanguage,
  IconLifebuoy,
  IconLink,
  IconLockAccess,
  IconLogs,
  IconMail,
  IconMenu2,
  IconPhoto,
  IconShieldSearch,
  IconTerminal2,
  IconTrash,
  IconUser,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react"
import { SiteBrandMark, SiteBrandName } from "@/components/site-brand"
import { ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

type NavItem = {
  titleKey: string
  url?: string
  icon?: React.ElementType
  permission?: string
  permissions?: string[]
  items?: NavItem[]
}

type NavSection = {
  titleKey?: string
  items: NavItem[]
}

const navigation: NavSection[] = [
  {
    items: [
      {
        titleKey: "overview",
        url: "/admin",
        icon: IconDashboard,
        permission: "admin.access",
      },
    ],
  },

  {
    titleKey: "members",
    items: [
      {
        titleKey: "memberManagement",
        icon: IconUsers,
        items: [
          {
            titleKey: "users",
            url: "/admin/users",
            icon: IconUser,
            permission: "users.read",
          },
          {
            titleKey: "loyalty",
            url: "/admin/loyalty",
            icon: IconAward,
            permission: "loyalty-tiers.read",
          },
        ],
      },
      {
        titleKey: "memberSupport",
        url: "/admin/support",
        icon: IconLifebuoy,
        permission: "support.read",
      },
    ],
  },

  {
    titleKey: "content",
    items: [
      {
        titleKey: "socialLinks",
        url: "/admin/social-links",
        icon: IconLink,
        permission: "links.read",
      },
      {
        titleKey: "snippets",
        url: "/admin/snippets",
        icon: IconCode,
        permission: "snippets.read",
      },
      {
        titleKey: "memberFiles",
        url: "/admin/files",
        icon: IconFiles,
        permission: "member-files.read",
      },
      {
        titleKey: "website",
        icon: IconWorld,
        items: [
          {
            titleKey: "pages",
            url: "/admin/pages",
            icon: IconFiles,
            permission: "pages.read",
          },
          {
            titleKey: "menus",
            url: "/admin/menus",
            icon: IconMenu2,
            permission: "menus.read",
          },
        ],
      },
      {
        titleKey: "media",
        url: "/admin/media",
        icon: IconPhoto,
        permission: "admin-media.read",
      },
      {
        titleKey: "announcements",
        url: "/admin/announcements",
        icon: IconBell,
        permission: "announcements.view",
      },
    ],
  },

  {
    titleKey: "monetization",
    items: [
      {
        titleKey: "monetizationConfig",
        icon: IconChartBar,
        items: [
          {
            titleKey: "monetizationLevels",
            url: "/admin/monetization-levels",
            icon: IconChartBar,
            permission: "monetization-levels.read",
          },
          {
            titleKey: "paymentMethods",
            url: "/admin/payment-methods",
            icon: IconCreditCardPay,
            permission: "payment-methods.read",
          },
        ],
      },
      {
        titleKey: "withdrawals",
        url: "/admin/withdrawals",
        icon: IconCashBanknote,
        permission: "withdrawals.read",
      },
    ],
  },

  {
    titleKey: "risk",
    items: [
      {
        titleKey: "fraudIp",
        icon: IconShieldSearch,
        items: [
          {
            titleKey: "accessLogs",
            url: "/admin/stu-access-logs",
            icon: IconLogs,
            permission: "stu_access_logs.view",
          },
          {
            titleKey: "ipReputation",
            url: "/admin/ip-reputation",
            icon: IconFingerprint,
            permission: "ip_reputation.view",
          },
        ],
      },
      {
        titleKey: "linkReports",
        url: "/admin/link-reports",
        icon: IconFlag,
        permission: "link-reports.read",
      },
      {
        titleKey: "bioPages",
        url: "/admin/bio-pages",
        icon: IconId,
        permission: "bio-pages.read",
      },
      {
        titleKey: "roles",
        url: "/admin/roles",
        icon: IconLockAccess,
        permission: "roles.read",
      },
    ],
  },

  {
    titleKey: "system",
    items: [
      {
        titleKey: "email",
        url: "/admin/emails",
        icon: IconMail,
        permission: "emails.read",
        permissions: [
          "emails.read",
          "emails.templates.read",
          "emails.logs.read",
          "emails.settings.update",
          "emails.senders.manage",
          "emails.preferences.manage",
        ],
      },
      {
        titleKey: "systemLogs",
        url: "/admin/system-logs",
        icon: IconLogs,
        permission: "system_logs.view",
      },
      {
        titleKey: "queueWorkerLogs",
        url: "/admin/log-files",
        icon: IconTerminal2,
        permission: "system_logs.view",
      },
      {
        titleKey: "systemCleanup",
        url: "/admin/system-cleanup",
        icon: IconTrash,
        permission: "system_logs.view",
      },
      {
        titleKey: "cronJobs",
        url: "/admin/cron-jobs",
        icon: IconClockPlay,
        permission: "cron_jobs.view",
      },
      {
        titleKey: "languages",
        url: "/admin/languages",
        icon: IconLanguage,
        permission: "languages.read",
      },
      {
        titleKey: "settings",
        url: "/admin/settings",
        icon: IconAdjustments,
        permission: "settings.read",
        permissions: ["settings.read", "currencies.read"],
      },
    ],
  },
]

function hasPermission(
  item: NavItem,
  userPermissions: readonly string[],
): boolean {
  const requiredPermissions = [
    ...(item.permission ? [item.permission] : []),
    ...(item.permissions ?? []),
  ]

  return (
    requiredPermissions.length === 0 ||
    requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    )
  )
}

function filterNavItems(
  items: NavItem[],
  userPermissions: readonly string[],
): NavItem[] {
  return items.reduce<NavItem[]>((result, item) => {
    if (item.items?.length) {
      const allowedChildren = filterNavItems(
        item.items,
        userPermissions,
      )

      if (allowedChildren.length > 0) {
        result.push({
          ...item,
          items: allowedChildren,
        })
      }

      return result
    }

    if (hasPermission(item, userPermissions)) {
      result.push(item)
    }

    return result
  }, [])
}

function filterNavigation(
  sections: NavSection[],
  userPermissions: readonly string[],
): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: filterNavItems(section.items, userPermissions),
    }))
    .filter((section) => section.items.length > 0)
}

export function AdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const permissions = useAdminPermissions()
  const pathname = usePathname()

  const filteredNavigation = React.useMemo(
    () => filterNavigation(navigation, permissions),
    [permissions],
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-(--header-height) shrink-0 justify-center py-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="h-10 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0!"
            >
              <Link href="/admin">
                <SiteBrandMark className="size-8 border-0 bg-sidebar-primary text-sidebar-primary-foreground" />

                <div className="flex min-w-0 flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                  <SiteBrandName className="truncate font-semibold" />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="dashboard-sidebar-scroll py-2">
        <AdminNavigation
          sections={filteredNavigation}
          pathname={pathname}
        />
      </SidebarContent>
    </Sidebar>
  )
}

function AdminNavigation({
  sections,
  pathname,
}: {
  sections: NavSection[]
  pathname: string
}) {
  const t = useTranslations("Admin.shell.sidebar")

  return (
    <>
      {sections.map((section, sectionIndex) => (
        <SidebarGroup
          key={section.titleKey ?? `section-${sectionIndex}`}
          className="py-2"
        >
          {section.titleKey ? (
            <SidebarGroupLabel className="mb-1 px-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70">
              {t(`sections.${section.titleKey}`)}
            </SidebarGroupLabel>
          ) : null}

          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => (
                <NavigationItem
                  key={item.url ?? item.titleKey}
                  item={item}
                  pathname={pathname}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}

function NavigationItem({
  item,
  pathname,
}: {
  item: NavItem
  pathname: string
}) {
  const t = useTranslations("Admin.shell.sidebar.items")
  const Icon = item.icon

  if (item.items?.length) {
    const isGroupActive = item.items.some((child) =>
      isNavItemActive(pathname, child),
    )

    return (
      <Collapsible
        asChild
        defaultOpen={isGroupActive}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={t(item.titleKey)}
              isActive={isGroupActive}
              className="
                h-9
                gap-3
                rounded-lg
                px-2.5
                text-sidebar-foreground/80
                transition-colors
                hover:bg-sidebar-accent
                hover:text-sidebar-accent-foreground
                data-[active=true]:bg-sidebar-accent/70
                data-[active=true]:font-medium
                data-[active=true]:text-sidebar-accent-foreground
              "
            >
              {Icon ? (
                <Icon className="size-[18px] shrink-0" />
              ) : null}

              <span className="truncate">
                {t(item.titleKey)}
              </span>

              <ChevronRight className="ml-auto size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <SidebarMenuSub className="my-1 border-l-0">
              {item.items.map((child) => {
                if (!child.url) return null

                const ChildIcon = child.icon
                const isActive = isPathActive(
                  pathname,
                  child.url,
                )

                return (
                  <SidebarMenuSubItem key={child.url}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={isActive}
                      className="
                        h-8
                        gap-2.5
                        rounded-md
                        data-[active=true]:font-medium
                      "
                    >
                      <Link
                        href={child.url}
                        aria-current={
                          isActive ? "page" : undefined
                        }
                      >
                        {ChildIcon ? (
                          <ChildIcon className="size-4 shrink-0" />
                        ) : null}

                        <span className="truncate">
                          {t(child.titleKey)}
                        </span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    )
  }

  if (!item.url) return null

  const isActive = isPathActive(pathname, item.url)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={t(item.titleKey)}
        isActive={isActive}
        className="
          h-9
          gap-3
          rounded-lg
          px-2.5
          text-sidebar-foreground/80
          transition-colors
          hover:bg-sidebar-accent
          hover:text-sidebar-accent-foreground
          data-[active=true]:bg-sidebar-accent
          data-[active=true]:font-medium
          data-[active=true]:text-sidebar-accent-foreground
        "
      >
        <Link
          href={item.url}
          aria-current={isActive ? "page" : undefined}
        >
          {Icon ? (
            <Icon className="size-[18px] shrink-0" />
          ) : null}

          <span className="truncate">
            {t(item.titleKey)}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function isNavItemActive(
  pathname: string,
  item: NavItem,
): boolean {
  if (item.url && isPathActive(pathname, item.url)) {
    return true
  }

  return (
    item.items?.some((child) =>
      isNavItemActive(pathname, child),
    ) ?? false
  )
}

function isPathActive(
  pathname: string,
  url?: string,
): boolean {
  if (!url) return false

  return (
    pathname === url ||
    (url !== "/admin" &&
      pathname.startsWith(`${url}/`))
  )
}
