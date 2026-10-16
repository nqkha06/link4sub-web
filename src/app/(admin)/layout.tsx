import type { Metadata } from "next"
import "flag-icons/css/flag-icons.min.css"

import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AdminAuthorizationProvider } from "@/features/admin-authorization/components/admin-authorization-provider"
import { AuthUserProvider } from "@/features/auth/components/auth-user-provider"
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server"
import { requireAdmin } from "@/lib/auth/server-access"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings()

  return {
    title: {
      default: `Quản trị | ${settings.siteName}`,
      template: `%s | ${settings.siteName}`,
    },
    description: `Khu vực vận hành và quản trị hệ thống ${settings.siteName}.`,
  }
}

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { currentUser } = await requireAdmin()

  return (
    <AuthUserProvider user={currentUser}>
      <AdminAuthorizationProvider permissions={currentUser.permissions}>
        <TooltipProvider>
        <div className="min-h-svh bg-background text-foreground">
          <SidebarProvider
            // style={
            //   {
            //     "--sidebar-width": "calc(var(--spacing) * 72)",
            //     "--header-height": "calc(var(--spacing) * 12)",
            //   } as React.CSSProperties
            // }
          >
            <AdminSidebar variant="inset" />
            <SidebarInset className="min-w-0">
              <AdminHeader />
              {children}
            </SidebarInset>
          </SidebarProvider>
        </div>
        </TooltipProvider>
      </AdminAuthorizationProvider>
    </AuthUserProvider>
  )
}
