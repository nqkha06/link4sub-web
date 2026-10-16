"use client";

import Link from "next/link";

import { useSyncExternalStore } from "react";

import {
  ArrowRight,
  Moon,
  Plus,
  Sun,
} from "lucide-react";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { PublicSharePanel } from "@/components/public-share-panel";

import { SiteBrandLink, SiteBrandMark, SiteBrandName } from "@/components/site-brand";

type HeaderVariant = "default" | "linear" | "bio";

type ShowHeaderProps = {
  onShare?: () => void | Promise<void>;
  variant?: HeaderVariant;
};

/* -------------------------------------------------------------------------- */
/* Theme toggle                                                               */
/* -------------------------------------------------------------------------- */

function PublicThemeToggle({
  variant,
}: {
  variant: HeaderVariant;
}) {
  const publicT = useTranslations("PublicLink");

  const {
    resolvedTheme,
    setTheme,
  } = useTheme();

  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={publicT("chooseTheme")}
      title={isDark ? publicT("lightMode") : publicT("darkMode")}
      className={
        variant === "linear"
          ? "size-9 rounded-lg border border-border bg-card/90 text-muted-foreground shadow-none transition-colors hover:bg-accent hover:text-foreground dark:border-white/10 dark:bg-[#0f1011] dark:text-[#d0d6e0] dark:hover:bg-[#18191a] dark:hover:text-white"
          : "size-10 rounded-xl text-slate-600 shadow-none transition-colors hover:bg-black/5 hover:text-slate-950"
      }
    >
      {isDark ? (
        <Moon className="size-4" />
      ) : (
        <Sun className="size-4" />
      )}
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

export function ShowHeader({
  onShare,
  variant = "default",
}: ShowHeaderProps) {
  const publicT = useTranslations("PublicLink");

  if (variant === "bio") {
    return (
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] text-[color:var(--bio-text,var(--foreground))] sm:px-7 sm:pt-7">
        <Link
          href="/"
          className="grid size-11 place-items-center rounded-2xl border border-[color:var(--bio-surface-border,var(--border))] bg-[color:var(--bio-surface-bg,var(--background))] shadow-sm backdrop-blur-md transition-transform hover:scale-[1.03]"
        >
          <SiteBrandMark className="size-7 rounded-lg border-0 bg-transparent" />
          <SiteBrandName className="sr-only" />
        </Link>

        <PublicSharePanel variant="bio" onShare={onShare} />
      </header>
    );
  }

  if (variant === "linear") {
    return (
      <header className="border-b border-border bg-background/90 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#010102]/90 sm:px-6">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between gap-4">
          <SiteBrandLink
            className="text-foreground dark:text-[#f7f8f8]"
            logoClassName="size-8 rounded-md"
            nameClassName="text-sm font-semibold tracking-[-0.02em]"
          />

          <div className="flex items-center gap-1">
            <PublicThemeToggle variant="linear" />

            <PublicSharePanel
              variant="linear"
              onShare={onShare}
            />

            <span
              aria-hidden
              className="mx-1 hidden h-5 w-px bg-border sm:block dark:bg-white/10"
            />

            <Button
              asChild
              className="hidden h-9 rounded-lg bg-[#5e6ad2] px-3.5 text-xs font-medium text-white shadow-none hover:bg-[#828fff] sm:inline-flex"
            >
              <Link href="/member/create">
                {publicT("createHeader")}

                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-[color:var(--bio-text,var(--foreground))] sm:px-6 sm:pt-5">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 rounded-2xl border border-[color:var(--bio-surface-border,var(--border))]/70 bg-[color:var(--bio-surface-bg,var(--background))]/78 px-2 shadow-[0_12px_36px_rgba(2,6,23,0.12)] backdrop-blur-2xl sm:h-16 sm:px-2.5">
        <SiteBrandLink
          href="/"
          className="group flex h-10 min-w-0 items-center rounded-xl pr-2 transition-opacity hover:opacity-80 sm:h-11 sm:pr-3"
          logoClassName="size-9 rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-transform group-hover:scale-[1.03] sm:size-10"
          nameClassName="ml-1.5 max-w-28 truncate whitespace-nowrap text-sm font-bold tracking-[-0.025em] sm:max-w-none sm:text-base"
        />

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <PublicSharePanel
            variant="default"
            onShare={onShare}
          />

          <span
            aria-hidden
            className="mx-1 h-5 w-px bg-[color:var(--bio-text,var(--foreground))]/10"
          />

          <Button
            asChild
            className="size-10 rounded-xl bg-[color:var(--bio-accent,var(--primary))] p-0 text-[color:var(--bio-button-text,white)] shadow-sm transition-opacity hover:opacity-90 sm:h-10 sm:w-auto sm:px-3.5"
          >
            <Link href="/member/create">
              <Plus className="size-4 sm:hidden" />

              <span className="hidden text-xs font-semibold sm:inline">
                {publicT("createHeader")}
              </span>

              <ArrowRight className="hidden size-3.5 sm:block" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
