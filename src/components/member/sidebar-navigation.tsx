"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { ChevronRight } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  getVisibleNavigationGroups,
  isNavigationItemActive,
  isNavigationParent,
  isNavigationParentActive,
  type NavigationItem,
  type NavigationParent,
} from "./navigation"

function NavigationLink({
  item,
  collapsed,
  nested = false,
}: {
  item: NavigationItem
  collapsed: boolean
  nested?: boolean
}) {
  const pathname = usePathname()
  const t = useTranslations("Dashboard")
  const active = isNavigationItemActive(pathname, item)
  const Icon = item.icon

  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-10 items-center rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring motion-reduce:transition-none",
        collapsed ? "justify-center px-0" : "gap-2.5 px-3",
        nested && !collapsed ? "h-9 pl-9" : undefined,
        active
          ? "bg-primary/10 font-semibold text-primary"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className={cn("size-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-accent-foreground")} strokeWidth={active ? 2.15 : 1.9} />
      {collapsed ? <span className="sr-only">{t(item.titleKey)}</span> : <span className="min-w-0 flex-1 truncate">{t(item.titleKey)}</span>}
      {!collapsed && item.badge ? <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{item.badge}</span> : null}
    </Link>
  )

  if (!collapsed) return link

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>{t(item.titleKey)}</TooltipContent>
    </Tooltip>
  )
}

function NavigationParentGroup({
  parent,
  collapsed,
}: {
  parent: NavigationParent
  collapsed: boolean
}) {
  const pathname = usePathname()
  const t = useTranslations("Dashboard")
  const Icon = parent.icon
  const active = isNavigationParentActive(pathname, parent)

  if (collapsed) {
    // No room to expand/collapse in the icon rail — surface the children directly.
    return (
      <>
        {parent.children.map((child) => (
          <NavigationLink key={child.href} item={child} collapsed={collapsed} />
        ))}
      </>
    )
  }

  return (
    <Collapsible defaultOpen={active} className="group/nav-parent">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            "group flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring motion-reduce:transition-none",
            active
              ? "text-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )}
        >
          <Icon className="size-[18px] shrink-0 text-muted-foreground group-hover:text-sidebar-accent-foreground" strokeWidth={1.9} />
          <span className="min-w-0 flex-1 truncate text-left">{t(parent.titleKey)}</span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/nav-parent:rotate-90" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 pt-0.5">
        {parent.children.map((child) => (
          <NavigationLink key={child.href} item={child} collapsed={collapsed} nested />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

export function SidebarNavigation({
  collapsed = false,
  canAccess,
}: {
  collapsed?: boolean
  canAccess?: (permission: string) => boolean
}) {
  const t = useTranslations("Dashboard")
  const groups = getVisibleNavigationGroups(canAccess)

  return (
    <nav className={cn("dashboard-sidebar-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden", collapsed ? "px-2 py-3" : "px-3 py-3")} aria-label={t("sidebar.navigation")}>
      <div className={collapsed ? "space-y-3" : "space-y-5"}>
        {groups.map((group, groupIndex) => (
          <section key={group.labelKey} className={cn(collapsed && groupIndex > 0 ? "border-t border-sidebar-border pt-3" : undefined)}>
            {collapsed ? null : (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">
                {t(group.labelKey)}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((entry) =>
                isNavigationParent(entry) ? (
                  <NavigationParentGroup key={entry.titleKey} parent={entry} collapsed={collapsed} />
                ) : (
                  <NavigationLink key={entry.href} item={entry} collapsed={collapsed} />
                ),
              )}
            </div>
          </section>
        ))}
      </div>
    </nav>
  )
}
