import type { Metadata } from "next"
import { Geist, Inter } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getLocale } from "next-intl/server"

import { AppProviders } from "@/components/providers/app-providers"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import NextTopLoader from "nextjs-toploader";
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server"
import { getPublicLanguageDirection } from "@/features/languages/api/languages.server"
import { LOCAL_SITE_ICON_FILES } from "@/lib/branding/local-site-icon-pipeline"
import { getLocalSiteIconInfo, localSiteIconUrl } from "@/lib/branding/local-site-icons"

import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
})

export async function generateMetadata(): Promise<Metadata> {
  const [settings, siteIcon] = await Promise.all([
    getPublicSiteSettings(),
    getLocalSiteIconInfo(),
  ])
  const title = settings.siteTagline
    ? `${settings.siteName} — ${settings.siteTagline}`
    : settings.siteName
  const ogImage =
    settings.siteUrl && settings.branding.defaultOgImage
      ? new URL(
          settings.branding.defaultOgImage.downloadUrl,
          settings.siteUrl,
        ).toString()
      : undefined

  return {
    metadataBase: settings.siteUrl ? new URL(settings.siteUrl) : undefined,
    title,
    description: settings.siteDescription || undefined,
    applicationName: settings.siteName,
    icons: siteIcons(siteIcon?.version),
    manifest: "/manifest.webmanifest",
    openGraph: {
      title,
      description: settings.siteDescription || undefined,
      siteName: settings.siteName,
      type: "website",
      url: settings.siteUrl || undefined,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  }
}

/** Cùng bộ file local với manifest và các route icon cố định. */
function siteIcons(version?: string): Metadata["icons"] {
  if (!version) return undefined
  return {
    icon: [
      {
        url: localSiteIconUrl(LOCAL_SITE_ICON_FILES.favicon32, version),
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: localSiteIconUrl(LOCAL_SITE_ICON_FILES.favicon48, version),
        type: "image/png",
        sizes: "48x48",
      },
    ],
    shortcut: [
      {
        url: localSiteIconUrl(LOCAL_SITE_ICON_FILES.faviconIco, version),
        type: "image/x-icon",
      },
    ],
    apple: [
      {
        url: localSiteIconUrl(LOCAL_SITE_ICON_FILES.appleTouchIcon, version),
        type: "image/png",
        sizes: "180x180",
      },
    ],
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const [settings, direction] = await Promise.all([
    getPublicSiteSettings(),
    getPublicLanguageDirection(locale),
  ])

  return (
    <html
      lang={locale}
      dir={direction}
      className={cn("font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body className={cn(inter.variable, "antialiased")}>
        <NextTopLoader
          color="var(--primary)"
          height={3}
          showSpinner={false}
          shadow={false}
          initialPosition={0.08}
          crawlSpeed={200}
          speed={200}
          zIndex={9999}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          themes={["light", "dark"]}
          disableTransitionOnChange
        >
          <NextIntlClientProvider>
            <AppProviders settings={settings}>{children}</AppProviders>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
