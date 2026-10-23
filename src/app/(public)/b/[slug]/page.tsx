import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getBioPage } from "@/lib/api-client";
import { getPublicLinkSettings } from "@/features/link-settings/api/link-settings.server";
import {
  parseDiscordInvite,
  parseDiscordTarget,
  type DiscordInvite,
} from "@/features/link-in-bio/public/bio-public-model";
import { PublicBioView } from "./public-bio-view";

/** Tên, icon, số thành viên của server Discord (lời mời công khai); lỗi thì bỏ qua. */
async function loadDiscordInvite(url: string | undefined): Promise<DiscordInvite | null> {
  const target = parseDiscordTarget(url);
  if (target?.kind !== "invite") return null;
  try {
    const response = await fetch(
      `https://discord.com/api/v10/invites/${encodeURIComponent(target.code)}?with_counts=true`,
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(2500) },
    );
    return response.ok ? parseDiscordInvite(target.code, await response.json()) : null;
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

/**
 * generateMetadata và trang cùng cần dữ liệu bio — cache() gộp lại thành một
 * lần gọi API cho mỗi request (tránh tính lượt xem hai lần).
 */
const loadBioPage = cache(async (slug: string) => {
  const bioPage = await getBioPage(slug).catch(() => null);
  return bioPage && bioPage.status === "published" ? bioPage : null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const bioPage = await loadBioPage(slug);

  if (!bioPage) return {};

  const title = `${bioPage.name} (@${bioPage.slug})`;
  const description = bioPage.title?.trim() || undefined;
  const avatarUrl = bioPage.appearance.avatarUrl || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: avatarUrl ? [{ url: avatarUrl }] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: avatarUrl ? [avatarUrl] : undefined,
    },
  };
}

export default async function PublicBioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const settings = await getPublicLinkSettings();
  if (settings.bioPrefix !== "b") notFound();
  const page = await renderPublicBioPage(slug);
  if (!page) notFound();
  return page;
}

export async function renderPublicBioPage(slug: string) {
  const bioPage = await loadBioPage(slug);

  if (!bioPage) return null;

  const discordUrl = bioPage.socialLinks.find(
    (social) => social.enabled !== false && social.platform.trim().toLowerCase() === "discord",
  )?.url;
  const discordInvite = await loadDiscordInvite(discordUrl);

  return <PublicBioView bioPage={bioPage} discordInvite={discordInvite} />;
}
