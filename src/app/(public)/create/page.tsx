import type { Metadata } from "next"
import { getLocale } from "next-intl/server"

import { CreateLinkPage } from "@/components/landing-v2/create-page"
import { getPublicMenus } from "@/features/admin-menus/api/public-menus.server"
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server"
import { getDashboardHref } from "@/lib/auth/redirects"
import { getServerUser } from "@/lib/auth/server-session"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings()
  const title = `Tạo link miễn phí — ${settings.siteName}`
  const description =
    "Soạn một link Link4Sub ngay — chọn hành động cần hoàn thành, nền, alias — không cần tài khoản cho đến khi bạn xuất bản."

  return {
    title,
    description,
    openGraph: { title, description },
  }
}

export default async function CreateRoute() {
  const locale = await getLocale()
  const [settings, currentUser, menus] = await Promise.all([
    getPublicSiteSettings(),
    getServerUser({ callbackUrl: "/create", mode: "optional" }),
    getPublicMenus(locale),
  ])

  return (
    <CreateLinkPage
      settings={settings}
      dashboardHref={currentUser ? getDashboardHref(currentUser) : null}
      menus={menus}
    />
  )
}
