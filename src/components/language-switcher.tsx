"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import {
  ChevronDown,
  Globe2,
  LoaderCircle,
} from "lucide-react";

import {
  defaultLocale,
  localeCookieName,
  type AppLocale,
} from "@/i18n/config";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageFlag } from "@/components/language-flag";
import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider";
import { useUiLanguages } from "@/features/languages/hooks/use-ui-languages";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  className,
  align = "end",
}: {
  className?: string;
  align?: "start" | "center" | "end";
}) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Common");

  const [isPending, startTransition] = useTransition();
  const uiLanguages = useUiLanguages();

  const currentLocale = locale || defaultLocale;

  const changeLocale = (nextLocale: AppLocale) => {
    if (nextLocale === currentLocale) {
      return;
    }

    document.cookie = [
      `${localeCookieName}=${nextLocale}`,
      "path=/",
      "max-age=31536000",
      "samesite=lax",
    ].join("; ");

    startTransition(() => {
      window.location.reload();
    });
  };

  const { showLanguageFlags } = useSiteBrand();
  const currentLanguage = uiLanguages.items.find(
    (option) => option.locale === currentLocale,
  );
  const currentLabel = currentLanguage?.label ?? currentLocale;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          aria-label={t("language")}
          className={cn(
            "h-9 gap-2 rounded-lg px-2.5 font-medium text-foreground hover:bg-muted data-[state=open]:bg-muted",
            className,
          )}
        >
          {isPending ? (
            <LoaderCircle
              className="size-4 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          ) : showLanguageFlags && currentLanguage ? (
            <LanguageFlag code={currentLanguage.flag} />
          ) : (
            <Globe2
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          )}
          <span className="truncate">{currentLabel}</span>
          <ChevronDown
            className="size-3.5 text-muted-foreground"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} className="min-w-44">
        <DropdownMenuRadioGroup
          value={currentLocale}
          onValueChange={(value) => changeLocale(value as AppLocale)}
        >
          {uiLanguages.items.map((option) => (
            <DropdownMenuRadioItem key={option.locale} value={option.locale}>
              {showLanguageFlags ? <LanguageFlag code={option.flag} /> : null}
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
