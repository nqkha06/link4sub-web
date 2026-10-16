import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { LandingFooter } from "@/components/landing-v2/footer";
import { LandingNavbar } from "@/components/landing-v2/navbar";
import { getPublicMenus } from "@/features/admin-menus/api/public-menus.server";
import { getPublicPage } from "@/features/pages/api/public-pages.server";
import { PublicPageContent } from "@/features/pages/components/public-page-content";
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server";
import { getDashboardHref } from "@/lib/auth/redirects";
import { getServerUser } from "@/lib/auth/server-session";
import { getPublicLinkSettings } from "@/features/link-settings/api/link-settings.server";
import { renderPublicLink } from "../l/[slug]/page";
import { renderPublicBioPage } from "../b/[slug]/page";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "landing") notFound();
  const locale = await getLocale();
  const page = await getPublicPage(slug, locale);
  if (!page) return { robots: { index: false, follow: false } };

  const title = page.seoTitle || page.title;
  const description = page.seoDescription || page.excerpt || undefined;
  const image = page.featuredImage?.url;
  return {
    title,
    description,
    keywords:
      page.seoKeywords
        ?.split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean) || undefined,
    alternates: { canonical: page.canonicalUrl || `/${slug}` },
    robots: {
      index: page.robotsIndex,
      follow: page.robotsFollow,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/${slug}`,
      images: image ? [{ url: image, alt: page.title }] : undefined,
    },
  };
}

export default async function PublicContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === "landing") notFound();
  const locale = await getLocale();
  const [page, linkSettings] = await Promise.all([
    getPublicPage(slug, locale),
    getPublicLinkSettings(),
  ]);
  // Trang nội dung tĩnh giữ quyền ưu tiên để cấu hình prefix rỗng không che
  // các slug CMS đang tồn tại.
  if (!page && !linkSettings.socialPrefix) {
    const linkPage = await renderPublicLink(slug);
    if (linkPage) return linkPage;
  }
  if (!page && !linkSettings.bioPrefix) {
    const bioPage = await renderPublicBioPage(slug);
    if (bioPage) return bioPage;
  }
  if (!page) notFound();

  const [settings, menus, currentUser] = await Promise.all([
    getPublicSiteSettings(),
    getPublicMenus(locale),
    getServerUser({ callbackUrl: `/${slug}`, mode: "optional" }),
  ]);

  return (
    <div className="min-w-[320px] overflow-x-clip bg-background text-foreground" id="top">
      <LandingNavbar
        dashboardHref={currentUser ? getDashboardHref(currentUser) : null}
        menus={menus}
        settings={settings}
      />
      <main>
        <PublicPageContent page={page} />
      </main>
      <LandingFooter menus={menus} settings={settings} />
    </div>
  );
}
