"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import { usePathname } from "next/navigation";

import { useTranslations } from "next-intl";

import {
  ArrowRight,
  Check,
  ChevronDown,
  Globe2,
  Menu,
  Moon,
  Sun,
} from "lucide-react";

import { navLinks } from "@/components/landing-v2/data";
import { LandingLogo } from "@/components/landing-v2/logo";

import {
  menuItemsInArea,
  resolveMenuHref,
} from "@/features/admin-menus/public-menu-layout";

import type { PublicMenusResponse } from "@/features/admin-menus/types";
import type { PublicSiteSettings } from "@/features/site-settings/types";

import { useUiLanguages } from "@/features/languages/hooks/use-ui-languages";
import { LanguageFlag } from "@/components/language-flag";
import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  defaultLocale,
  localeCookieName,
  type AppLocale,
} from "@/i18n/config";

import { useThemeMode } from "@/hooks/use-theme-mode";
import { cn } from "@/lib/utils";

function persistLocaleCookie(locale: AppLocale) {
  document.cookie =
    `${localeCookieName}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

type NavbarLink = {
  label: string;
  href: string;
  target?: string;
  rel?: string | null;
};

export function LandingNavbar({
  settings,
  dashboardHref,
  menus,
}: {
  settings: PublicSiteSettings;
  dashboardHref: string | null;
  menus?: PublicMenusResponse;
}) {
  const pathname = usePathname();
  const t = useTranslations("Landing.nav");

  const [scrolled, setScrolled] = useState(false);

  const links = useMemo(() => {
    const configuredLinks = menuItemsInArea(
      menus,
      "header-navigation",
    )
      .filter((item) => item.href)
      .map((item) => ({
        label: item.label,
        href: resolveMenuHref(item.href!),
        target: item.target,
        rel: item.rel,
      }));

    return configuredLinks.length
      ? configuredLinks
      : navLinks.map((link) => ({
          label: t(`links.${link.labelKey}`),
          href: link.href,
          target: undefined,
          rel: undefined,
        }));
  }, [menus, t]);

  const configuredMobileLinks = menuItemsInArea(
    menus,
    "mobile-navigation",
  )
    .filter((item) => item.href)
    .map((item) => ({
      label: item.label,
      href: resolveMenuHref(item.href!),
      target: item.target,
      rel: item.rel,
    }));

  const mobileLinks = configuredMobileLinks.length
    ? configuredMobileLinks
    : links;

  const configuredActions = menuItemsInArea(
    menus,
    "header-actions",
  )
    .filter((item) => item.href)
    .map((item) => ({
      label: item.label,
      href: resolveMenuHref(item.href!),
      target: item.target,
      rel: item.rel,
    }));

  const actions: NavbarLink[] = dashboardHref
    ? [
        {
          label: t("actions.dashboard"),
          href: dashboardHref,
          target: "_self",
          rel: null,
        },
      ]
    : configuredActions.length
      ? configuredActions
      : [
          {
            label: t("actions.signIn"),
            href: "/login",
            target: "_self",
            rel: null,
          },
          {
            label: t("actions.signUpFree"),
            href: "/register",
            target: "_self",
            rel: null,
          },
        ];

  /*
   * Trên mobile chỉ đưa action quan trọng nhất ra ngoài header.
   * Các action còn lại vẫn nằm đầy đủ bên trong menu.
   */
  const mobilePrimaryAction =
    actions.length > 0
      ? actions[actions.length - 1]
      : null;

  const [activeSection, setActiveSection] = useState<
    string | null
  >(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };

    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      },
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll,
      );
    };
  }, []);

  useEffect(() => {
    const sectionIds = links
      .map((link) => link.href)
      .filter((href) => href.startsWith("#"))
      .map((href) => href.slice(1));

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!sections.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter(
            (entry) =>
              entry.isIntersecting,
          )
          .sort(
            (a, b) =>
              b.intersectionRatio -
              a.intersectionRatio,
          );

        if (!visibleEntries.length) {
          return;
        }

        setActiveSection(
          `#${visibleEntries[0].target.id}`,
        );
      },
      {
        rootMargin:
          "-20% 0px -65% 0px",

        threshold: [
          0.1,
          0.25,
          0.5,
        ],
      },
    );

    sections.forEach(
      (section) => {
        observer.observe(section);
      },
    );

    return () => {
      observer.disconnect();
    };
  }, [links]);

  return (
    <header
      className={cn(
        `
          sticky top-0 z-50
          w-full

          border-b border-border/60

          transition-[background-color,box-shadow,backdrop-filter]
          duration-300
        `,
        scrolled
          ? `
            bg-background/80

            shadow-[0_1px_0_rgba(0,0,0,0.03),0_8px_30px_-24px_rgba(0,0,0,0.18)]

            backdrop-blur-xl

            supports-[backdrop-filter]:bg-background/70
          `
          : `
            bg-background/65

            backdrop-blur-md

            supports-[backdrop-filter]:bg-background/55
          `,
      )}
    >
      <div
        className="
          mx-auto

          flex h-[72px]
          w-full max-w-[1280px]
          items-center

          px-4
          md:px-8
        "
      >
        {/* Logo + navigation desktop */}
        <div
          className="
            flex
            min-w-0
            items-center

            gap-7
            xl:gap-9
          "
        >
          <div
            className="
              min-w-0
              shrink
            "
          >
            <LandingLogo
              settings={settings}
            />
          </div>

          <nav
            aria-label={t(
              "mobile.mainNavigation",
            )}
            className="
              hidden
              items-center
              gap-0.5

              lg:flex
            "
          >
            {links.map((link) => {
              const href =
                link.href.startsWith("#") &&
                pathname !== "/"
                  ? `/${link.href}`
                  : link.href;

              const isHashLink =
                link.href.startsWith("#");

              const isActive =
                isHashLink
                  ? activeSection ===
                    link.href
                  : pathname === href ||
                    (
                      href !== "/" &&
                      pathname.startsWith(
                        `${href}/`,
                      )
                    );

              const NavTag =
                href.startsWith("#")
                  ? "a"
                  : Link;

              return (
                <NavTag
                  key={link.href}
                  href={href}
                  target={
                    "target" in link
                      ? link.target
                      : undefined
                  }
                  rel={
                    "rel" in link
                      ? link.rel ??
                        undefined
                      : undefined
                  }
                  className={cn(
                    `
                      relative

                      whitespace-nowrap

                      rounded-lg

                      px-3 py-2

                      text-[14px]
                      font-medium

                      transition-colors
                      duration-200

                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-ring/40
                    `,
                    isActive
                      ? `
                        bg-muted
                        text-foreground
                      `
                      : `
                        text-muted-foreground

                        hover:bg-muted/60
                        hover:text-foreground
                      `,
                  )}
                >
                  {link.label}
                </NavTag>
              );
            })}
          </nav>
        </div>

        {/* Desktop actions */}
        <div
          className="
            ml-auto

            hidden
            items-center
            gap-1

            lg:flex
          "
        >
          <LanguageSwitcher />

          <ThemeSwitcher />

          <div
            aria-hidden
            className="
              mx-1.5

              h-5
              w-px

              bg-border/80
            "
          />

          {actions.map(
            (action, index) => (
              <Button
                key={`${action.href}-${index}`}
                variant={
                  index ===
                  actions.length - 1
                    ? "default"
                    : "ghost"
                }
                asChild
                className="
                  h-10

                  rounded-xl

                  px-4
                "
              >
                <Link
                  href={action.href}
                  target={action.target}
                  rel={
                    action.rel ??
                    undefined
                  }
                >
                  {action.label}

                  {index ===
                    actions.length - 1 && (
                    <ArrowRight className="size-4" />
                  )}
                </Link>
              </Button>
            ),
          )}
        </div>

        {/* Mobile actions */}
        <div
          className="
            ml-auto

            flex
            shrink-0
            items-center
            gap-2

            lg:hidden
          "
        >
          {mobilePrimaryAction && (
            <Button
              asChild
              size="sm"
              className="
                h-10

                max-w-[132px]

                rounded-xl

                px-3.5

                text-[13px]
                font-semibold

                shadow-none

                sm:max-w-none
                sm:px-4
              "
            >
              <Link
                href={
                  mobilePrimaryAction.href
                }
                target={
                  mobilePrimaryAction.target
                }
                rel={
                  mobilePrimaryAction.rel ??
                  undefined
                }
              >
                <span
                  className="
                    truncate
                    whitespace-nowrap
                  "
                >
                  {
                    mobilePrimaryAction.label
                  }
                </span>
              </Link>
            </Button>
          )}

          <MobileMenu
            settings={settings}
            pathname={pathname}
            activeSection={
              activeSection
            }
            links={mobileLinks}
            actions={actions}
          />
        </div>
      </div>
    </header>
  );
}

function LanguageSwitcher({
  mobile = false,
}: {
  mobile?: boolean;
}) {
  const t = useTranslations("Landing.nav");
  const uiLanguages = useUiLanguages();
  const { showLanguageFlags } = useSiteBrand();

  const [language, setLanguage] =
    useState<AppLocale>(defaultLocale);

  useEffect(() => {
    const availableLocales =
      uiLanguages.items.map(
        (item) => item.locale,
      );

    if (!availableLocales.length) {
      return;
    }

    const localeCookie =
      document.cookie
        .split("; ")
        .find((row) =>
          row.startsWith(
            `${localeCookieName}=`,
          ),
        )
        ?.split("=")[1];

    let nextLanguage = uiLanguages.defaultLocale;

    if (
      localeCookie &&
      availableLocales.includes(
        localeCookie,
      )
    ) {
      nextLanguage = localeCookie;
    } else {
      const browserLanguage =
        navigator.language.toLowerCase();

      const matchedByBrowser =
        availableLocales.find((locale) =>
          browserLanguage.startsWith(
            locale.toLowerCase(),
          ),
        );

      if (matchedByBrowser) {
        nextLanguage = matchedByBrowser;
      }
    }

    const languageTimer = window.setTimeout(
      () => setLanguage(nextLanguage),
      0,
    );

    return () => window.clearTimeout(languageTimer);
  }, [
    uiLanguages.items,
    uiLanguages.defaultLocale,
  ]);

  const currentLanguage =
    uiLanguages.items.find(
      (item) =>
        item.locale === language,
    ) ?? uiLanguages.items[0];

  function changeLanguage(
    nextLanguage: AppLocale,
  ) {
    persistLocaleCookie(nextLanguage);

    setLanguage(nextLanguage);

    window.location.reload();
  }

  if (!currentLanguage) {
    return null;
  }

  if (mobile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
        >
          <Button
            variant="outline"
            className="
              h-11
              w-full

              justify-between

              rounded-xl

              bg-background

              px-3.5
            "
          >
            <span
              className="
                flex
                items-center
                gap-2.5
              "
            >
              {showLanguageFlags ? (
                <LanguageFlag code={currentLanguage.flag} />
              ) : (
                <Globe2 className="size-4 text-muted-foreground" />
              )}

              <span className="font-medium">
                {
                  currentLanguage.label
                }
              </span>
            </span>

            <ChevronDown
              className="
                size-4

                text-muted-foreground
              "
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          side="top"
          className="
            w-[var(--radix-dropdown-menu-trigger-width)]

            rounded-xl
          "
        >
          {uiLanguages.items.map(
            (item) => (
              <DropdownMenuItem
                key={item.locale}
                onSelect={() => {
                  if (
                    item.locale !==
                    language
                  ) {
                    changeLanguage(
                      item.locale,
                    );
                  }
                }}
                className="
                  flex
                  cursor-pointer
                  items-center
                  justify-between

                  rounded-lg

                  py-2.5
                "
              >
                <span className="flex items-center gap-2.5">
                  {showLanguageFlags ? (
                    <LanguageFlag code={item.flag} />
                  ) : null}
                  {item.label}
                </span>

                {language ===
                  item.locale && (
                  <Check className="size-4" />
                )}
              </DropdownMenuItem>
            ),
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
      >
        <Button
          variant="ghost"
          className="
            h-10

            gap-2

            rounded-xl

            px-3

            text-muted-foreground

            hover:text-foreground
          "
          aria-label={
            t("changeLanguage")
          }
        >
          {showLanguageFlags ? (
            <LanguageFlag code={currentLanguage.flag} />
          ) : (
            <Globe2 className="size-4" />
          )}

          <span
            className="
              text-[13px]
              font-medium
            "
          >
            {currentLanguage.locale.toUpperCase()}
          </span>

          <ChevronDown
            className="
              size-3.5

              opacity-60
            "
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="
          min-w-[160px]

          rounded-xl

          p-1.5
        "
      >
        {uiLanguages.items.map(
          (item) => (
            <DropdownMenuItem
              key={item.locale}
              onSelect={() => {
                if (
                  item.locale !==
                  language
                ) {
                  changeLanguage(
                    item.locale,
                  );
                }
              }}
              className="
                flex
                cursor-pointer
                items-center
                justify-between

                rounded-lg

                px-3 py-2.5
              "
            >
              <span className="flex items-center gap-2.5 text-[13px] font-medium">
                {showLanguageFlags ? (
                  <LanguageFlag code={item.flag} />
                ) : null}
                {item.label}
              </span>

              {language ===
                item.locale && (
                <Check className="size-4" />
              )}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeSwitcher({
  mobile = false,
}: {
  mobile?: boolean;
}) {
  const t =
    useTranslations(
      "Landing.nav.theme",
    );
  const {
    mounted,
    theme,
    toggleTheme,
  } = useThemeMode();

  if (!mounted) {
    if (mobile) {
      return (
        <div
          className="
            h-11
            w-full

            rounded-xl

            border
            border-border

            bg-background
          "
        />
      );
    }

    return (
      <Button
        variant="ghost"
        size="icon"
        disabled
        aria-label={
          t("changeTheme")
        }
        className="
          size-10

          rounded-xl
        "
      />
    );
  }

  if (mobile) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={toggleTheme}
        className="
          h-11
          w-full

          justify-between

          rounded-xl

          bg-background

          px-3.5
        "
      >
        <span
          className="
            flex
            items-center
            gap-2.5
          "
        >
          {theme === "dark" ? (
            <Moon
              className="
                size-4

                text-muted-foreground
              "
            />
          ) : (
            <Sun
              className="
                size-4

                text-muted-foreground
              "
            />
          )}

          <span className="font-medium">
            {theme === "dark"
              ? t("darkMode")
              : t("lightMode")}
          </span>
        </span>

        <span
          className="
            text-xs
            text-muted-foreground
          "
        >
          {theme === "dark"
            ? t("dark")
            : t("light")}
        </span>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="
        size-10

        rounded-xl

        text-muted-foreground

        hover:text-foreground
      "
      aria-label={
        theme === "dark"
          ? t("switchToLight")
          : t("switchToDark")
      }
    >
      {theme === "dark" ? (
        <Sun className="size-[17px]" />
      ) : (
        <Moon className="size-[17px]" />
      )}
    </Button>
  );
}

function MobileMenu({
  pathname,
  activeSection,
  links,
  actions,
}: {
  settings: PublicSiteSettings;

  pathname: string;

  activeSection: string | null;

  links: ReadonlyArray<NavbarLink>;

  actions: NavbarLink[];
}) {
  const t = useTranslations("Landing.nav");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("mobile.openMenu")}
          className="
            size-10
            shrink-0
            data-[state=open]:bg-muted
          "
        >
          <Menu className="size-[18px]" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={12}
        collisionPadding={0}
        className="
          w-[calc(100vw-2rem)]
          max-w-none

          rounded-xl

          border
          border-border

          bg-background

          p-2

          shadow-lg
        "
      >
        {/* Navigation */}
        <div className="space-y-1">
          {links.map((link) => {
            const href =
              link.href.startsWith("#") &&
              pathname !== "/"
                ? `/${link.href}`
                : link.href;

            const isHashLink =
              link.href.startsWith("#");

            const isActive =
              isHashLink
                ? activeSection === link.href
                : pathname === href ||
                  (
                    href !== "/" &&
                    pathname.startsWith(
                      `${href}/`,
                    )
                  );

            const NavTag =
              href.startsWith("#")
                ? "a"
                : Link;

            return (
              <DropdownMenuItem
                key={link.href}
                asChild
                className="
                  cursor-pointer

                  rounded-lg

                  p-0

                  focus:bg-transparent
                "
              >
                <NavTag
                  href={href}
                  target={link.target}
                  rel={
                    link.rel ??
                    undefined
                  }
                  className={cn(
                    `
                      flex
                      w-full
                      items-center
                      justify-between

                      rounded-lg

                      px-3
                      py-2.5

                      text-[14px]
                      font-medium

                      transition-colors
                    `,
                    isActive
                      ? `
                        bg-muted
                        text-foreground
                      `
                      : `
                        text-muted-foreground

                        hover:bg-muted
                        hover:text-foreground
                      `,
                  )}
                >
                  <span>
                    {link.label}
                  </span>

                  {isActive && (
                    <span
                      className="
                        size-1.5

                        rounded-full

                        bg-primary
                      "
                    />
                  )}
                </NavTag>
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator
          className="
            my-2
          "
        />

        {/* Preferences */}
        <div
          className="
            grid
            grid-cols-2
            gap-2
          "
        >
          <LanguageSwitcher mobile />

          <ThemeSwitcher mobile />
        </div>

        <DropdownMenuSeparator
          className="
            my-2
          "
        />

        {/* Actions */}
        <div
          className={cn(
            `
              grid
              gap-2
            `,
            actions.length > 1
              ? "grid-cols-2"
              : "grid-cols-1",
          )}
        >
          {actions.map(
            (action, index) => (
              <DropdownMenuItem
                key={`${action.href}-${index}`}
                asChild
                className="
                  p-0

                  focus:bg-transparent
                "
              >
                <Button
                  asChild
                  variant={
                    index ===
                    actions.length - 1
                      ? "default"
                      : "outline"
                  }
                  className="
                    h-10
                    w-full

                    rounded-lg

                    text-[13px]
                    font-semibold
                  "
                >
                  <Link
                    href={action.href}
                    target={action.target}
                    rel={
                      action.rel ??
                      undefined
                    }
                  >
                    {action.label}

                    {index ===
                      actions.length - 1 && (
                      <ArrowRight className="size-3.5" />
                    )}
                  </Link>
                </Button>
              </DropdownMenuItem>
            ),
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
