import type { Metadata } from "next"

import { MemberShell } from "@/components/member/member-shell"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getMemberCurrencyPreferences } from "@/features/currencies/api/currencies.server"
import { MemberCurrencyProvider } from "@/features/currencies/components/member-currency-provider"
import { AuthUserProvider } from "@/features/auth/components/auth-user-provider"
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server"
import { requireMember } from "@/lib/auth/server-access"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings()
  return {
    title: {
      default: `Bảng điều khiển | ${settings.siteName}`,
      template: `%s | ${settings.siteName}`,
    },
    description: `Quản lý liên kết và tài khoản ${settings.siteName}.`,
  }
}

export default async function MemberLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { currentUser } = await requireMember("/member")
  const currencyPreferences = await getMemberCurrencyPreferences()

  return (
    <AuthUserProvider user={currentUser}>
      <MemberCurrencyProvider initialPreferences={currencyPreferences}>
        <TooltipProvider delayDuration={300}>
          <MemberShell>{children}</MemberShell>
        </TooltipProvider>
      </MemberCurrencyProvider>
    </AuthUserProvider>
  )
}
