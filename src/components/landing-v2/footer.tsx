"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { SiDiscord, SiFacebook, SiGithub, SiInstagram, SiTelegram, SiTiktok, SiX, SiYoutube, SiZalo } from "@icons-pack/react-simple-icons";
import { IconBrandLinkedin } from "@tabler/icons-react";
import { ArrowUpRight } from "lucide-react";

import { navLinks } from "@/components/landing-v2/data";
import { LandingLogo } from "@/components/landing-v2/logo";
import { menusInArea, resolveMenuHref } from "@/features/admin-menus/public-menu-layout";
import type { PublicMenuItem, PublicMenusResponse } from "@/features/admin-menus/types";
import type { PublicSiteSettings, SocialPlatform } from "@/features/site-settings/types";

type FooterLink = { label: string; href: string; target?: string; rel?: string | null };
type FooterColumnData = { title: string; links: FooterLink[] };

function toLinks(items: PublicMenuItem[], anchorPrefix: string): FooterLink[] {
  return items.flatMap((item) => item.href
    ? [{ label: item.label, href: resolveMenuHref(item.href, anchorPrefix), target: item.target, rel: item.rel }]
    : []);
}

const socialIcons: Record<SocialPlatform, typeof SiFacebook | typeof IconBrandLinkedin> = {
  facebook: SiFacebook,
  instagram: SiInstagram,
  youtube: SiYoutube,
  tiktok: SiTiktok,
  x: SiX,
  discord: SiDiscord,
  telegram: SiTelegram,
  linkedin: IconBrandLinkedin,
  github: SiGithub,
  zalo: SiZalo,
};

const socialLabels: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  x: "X",
  discord: "Discord",
  telegram: "Telegram",
  linkedin: "LinkedIn",
  github: "GitHub",
  zalo: "Zalo",
};

export function LandingFooter({
  settings,
  menus,
}: {
  settings: PublicSiteSettings;
  menus?: PublicMenusResponse;
}) {
  const pathname = usePathname();
  const t = useTranslations("Landing.footer");
  const tNav = useTranslations("Landing.nav");
  const anchorPrefix = pathname === "/" ? "" : "/";
  const configuredColumns = menusInArea(menus, "footer-navigation").flatMap((menu) => {
    const groups = menu.items.filter((item) => item.children.length);
    return groups.length
      ? groups.map((group) => ({ title: group.label, links: toLinks(group.children, anchorPrefix) }))
      : [{ title: menu.title || menu.key, links: toLinks(menu.items, anchorPrefix) }];
  });
  const fallbackColumns: FooterColumnData[] = [
    { title: t("columns.product"), links: [{ label: t("links.createLink"), href: "/member/create" }, { label: t("links.signIn"), href: "/login" }] },
    { title: t("columns.explore"), links: navLinks.map((link) => ({ label: tNav(`links.${link.labelKey}`), href: resolveMenuHref(link.href, anchorPrefix) })) },
    { title: t("columns.support"), links: [{ label: t("links.reportLink"), href: "/report-link" }, { label: t("links.payoutRates"), href: "/payout-rate" }] },
  ];
  const legalColumns = menusInArea(menus, "footer-legal").map((menu) => ({
    title: menu.title || menu.key,
    links: toLinks(menu.items, anchorPrefix),
  }));
  const columns = [...(configuredColumns.length ? configuredColumns : fallbackColumns), ...legalColumns];
  const socialLinks = settings.socialLinks
    .filter((item) => item.isActive)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-8">
        <div className="grid gap-12 py-14 md:py-16 lg:grid-cols-[1.35fr_2fr] lg:gap-20">
          <div>
            <LandingLogo settings={settings} />
            {(settings.siteDescription || settings.siteTagline) && (
              <p className="mt-4 max-w-[330px] text-[14px] leading-6 text-muted-foreground">
                {settings.siteDescription || settings.siteTagline}
              </p>
            )}
            {socialLinks.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {socialLinks.map((social) => {
                  const Icon = socialIcons[social.platform];
                  return (
                    <a key={`${social.platform}-${social.url}`} href={social.url} target="_blank" rel="noopener noreferrer"
                      aria-label={socialLabels[social.platform]} className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                      <Icon size={16} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
            {columns.map((column, index) => <FooterColumn key={`${column.title}-${index}`} {...column} />)}
          </div>
        </div>
        <div className="flex flex-col gap-4 border-t border-border py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">{t("rights", { year: new Date().getFullYear(), site: settings.siteName })}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {t.rich("builtBy", {
              heart: () => <span role="img" aria-label="love" className="text-red-500">❤</span>,
              author: () => (
                <a
                  href="https://kdigital.vn"
                  target="_blank"
                  rel="noopener"
                  title="KDigital"
                  className="inline-flex items-center opacity-80 transition-opacity hover:opacity-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://4notez.com/images/kdigital-logo.png" alt="KDigital" width={77} height={22} loading="lazy" className="h-[22px] w-auto" />
                </a>
              ),
            })}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: FooterColumnData) {
  if (!links.length) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground">{title}</p>
      <ul className="mt-4 flex flex-col gap-3">
        {links.map((link, index) => (
          <li key={`${link.href}-${index}`}>
            <Link href={link.href} target={link.target} rel={link.rel ?? undefined}
              className="group inline-flex items-center gap-1 text-[14px] text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
              {link.href.startsWith("http") && <ArrowUpRight className="size-3 opacity-50" />}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
