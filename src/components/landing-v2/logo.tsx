"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type SyntheticEvent } from "react";

import type { PublicSiteSettings } from "@/features/site-settings/types";
import { DEFAULT_SITE_LOGO_URL } from "@/lib/branding/default-site-brand";
import { cn } from "@/lib/utils";

/**
 * Wordmark for the public landing page. Prefer an uploaded logo image and
 * fall back to the configured site name. A square-ish logo (an icon rather
 * than a wordmark) gets the brand name next to it.
 */
const SQUARE_LOGO_MAX_RATIO = 1.4;

export function LandingLogo({
  settings,
  className,
}: {
  settings: PublicSiteSettings;
  className?: string;
}) {
  const lightLogo = settings.branding.logoLight;
  const darkLogo = settings.branding.logoDark;
  const [isSquare, setIsSquare] = useState(false);

  // Whichever variant is visible for the current theme reports its shape.
  const detectShape = (event: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (!naturalWidth || !naturalHeight) return;
    setIsSquare(naturalWidth / naturalHeight <= SQUARE_LOGO_MAX_RATIO);
  };

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex min-w-max items-center gap-2 rounded-md font-semibold tracking-[-0.03em] text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      {lightLogo ? (
        <>
        <span
          className={cn(
            "relative block h-8 shrink-0",
            isSquare ? "w-8" : "w-28 max-w-[160px]",
          )}
        >
          <Image
            src={lightLogo.downloadUrl}
            alt={settings.siteName}
            fill
            unoptimized
            sizes="160px"
            onLoad={detectShape}
            className={cn("object-contain object-left", darkLogo && "dark:hidden")}
          />
          {darkLogo ? (
            <Image
              src={darkLogo.downloadUrl}
              alt={settings.siteName}
              fill
              unoptimized
              sizes="160px"
              onLoad={detectShape}
              className="hidden object-contain object-left dark:block"
            />
          ) : null}
        </span>
        {isSquare ? (
          <span className="text-[17px]">{settings.siteName}</span>
        ) : null}
        </>
      ) : (
        <>
          <span className="relative block size-8 shrink-0 overflow-hidden rounded-lg">
            <Image
              src={DEFAULT_SITE_LOGO_URL}
              alt=""
              fill
              sizes="32px"
              unoptimized
              className="object-contain"
            />
          </span>
          <span className="text-[17px]">{settings.siteName}</span>
        </>
      )}
    </Link>
  );
}
