"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Fragment } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export type AdminBreadcrumbItem = {
  label: string
  href?: string
}

type Translate = (key: string) => string

const sectionKeys: Record<string, string> = {
  users: "users",
  snippets: "snippets",
  files: "memberFiles",
  "social-links": "socialLinks",
  "stu-access-logs": "stuAccessLogs",
  pages: "pages",
  media: "media",
  menus: "menus",
  "monetization-levels": "monetizationLevels",
  loyalty: "loyalty",
  "payment-methods": "paymentMethods",
  withdrawals: "withdrawals",
  languages: "languages",
  settings: "settings",
  roles: "roles",
  announcements: "announcements",
  support: "support",
  "log-files": "logFiles",
  "ip-reputation": "ipReputation",
  "link-reports": "linkReports",
  "bio-pages": "bioPages",
  emails: "emails",
  "system-logs": "systemLogs",
  "system-cleanup": "systemCleanup",
  "cron-jobs": "cronJobs",
}

const leafKeys: Record<string, string> = {
  create: "create",
  edit: "edit",
  preview: "preview",
  appearance: "appearance",
  currencies: "currencies",
  withdrawals: "withdrawals",
  "access-analysis": "accessAnalysis",
  translations: "translations",
  business: "business",
  links: "links",
  "link-fraud": "linkFraud",
}

export function AdminBreadcrumbs({
  items: providedItems,
}: {
  items?: readonly AdminBreadcrumbItem[]
}) {
  const pathname = usePathname()
  const t = useTranslations("Admin.shell.breadcrumbs")
  const items = providedItems ?? getAdminBreadcrumbs(pathname, t)

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap gap-1.5 overflow-hidden sm:gap-2">
        {items.map((item, index) => {
          const current = index === items.length - 1

          return (
            <Fragment key={`${item.href ?? item.label}-${index}`}>
              {index > 0 ? (
                <BreadcrumbSeparator className="shrink-0" />
              ) : null}
              <BreadcrumbItem
                className={index > 0 ? "min-w-0" : "shrink-0"}
              >
                {current ? (
                  <BreadcrumbPage className="truncate">
                    {item.label}
                  </BreadcrumbPage>
                ) : item.href ? (
                  <BreadcrumbLink asChild>
                    <Link className="truncate" href={item.href}>
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <span className="truncate text-muted-foreground">
                    {item.label}
                  </span>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function getAdminBreadcrumbs(
  pathname: string,
  t: Translate,
): AdminBreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean).slice(1)

  if (segments.length === 0) {
    return [{ label: t("dashboard") }]
  }

  const [section, ...rest] = segments
  const sectionKey = sectionKeys[section]
  const sectionLabel = sectionKey ? t(`sections.${sectionKey}`) : humanize(section)
  const items: AdminBreadcrumbItem[] = [
    { label: t("dashboard"), href: "/admin" },
    {
      label: sectionLabel,
      href: rest.length > 0 ? `/admin/${section}` : undefined,
    },
  ]

  if (rest.length === 0) return items

  let href = `/admin/${section}`

  rest.forEach((segment, index) => {
    href += `/${segment}`
    const current = index === rest.length - 1
    const isIdentifier = /^\d+$/.test(segment)
    const leafKey = leafKeys[segment]

    items.push({
      label: isIdentifier
        ? t("detail")
        : leafKey
          ? t(`leaves.${leafKey}`)
          : humanize(segment),
      href: current ? undefined : href,
    })
  })

  return items
}

function humanize(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}
