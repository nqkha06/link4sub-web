"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, Moon, Sun } from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { useThemeMode } from "@/hooks/use-theme-mode";

function ThemeToggle() {
  const t = useTranslations("Landing.nav.theme");
  const { mounted, theme, toggleTheme } = useThemeMode();
  const isDark = theme === "dark";
  const label = isDark ? t("switchToLight") : t("switchToDark");

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-9 shrink-0 rounded-lg border bg-card shadow-sm text-muted-foreground hover:bg-muted hover:text-foreground"
      onClick={toggleTheme}
      disabled={!mounted}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
    >
      {!mounted ? (
        <span className="size-4" />
      ) : isDark ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </Button>
  );
}

/** Thanh trên của trang auth: về trang chủ (trái), đổi giao diện (phải). */
export function AuthTopBar() {
  const t = useTranslations("Auth");

  return (
    <div className="absolute inset-x-0 top-0 z-50 flex items-center justify-between p-3 sm:p-5">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="h-9 rounded-lg border bg-card shadow-sm text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Link href="/">
          <ArrowLeft aria-hidden="true" />
          {t("backHome")}
        </Link>
      </Button>

      <ThemeToggle />
    </div>
  );
}

/** Bộ chọn ngôn ngữ đặt dưới thẻ auth, căn giữa. */
export function AuthLanguageSwitcher() {
  return (
    <div className="flex justify-center pt-2">
      <LanguageSwitcher align="center" className="border bg-card shadow-sm" />
    </div>
  );
}
