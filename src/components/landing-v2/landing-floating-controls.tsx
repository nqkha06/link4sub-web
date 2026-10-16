"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { useTranslations } from "next-intl";

import { ArrowUp, Cookie } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  cookieConsentName,
  type CookieConsentChoice,
} from "@/lib/cookie-consent";

export function LandingFloatingControls({
  initialChoice,
}: {
  initialChoice: CookieConsentChoice | null;
}) {
  const t = useTranslations("LandingControls");

  const [choice, setChoice] = useState(initialChoice);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const consentOpen = choice === null;

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 480);
    };

    onScroll();

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  function saveChoice(nextChoice: CookieConsentChoice) {
    const secure =
      window.location.protocol === "https:"
        ? "; Secure"
        : "";

    document.cookie = `${cookieConsentName}=${nextChoice}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;

    setChoice(nextChoice);
  }

  function scrollToTop() {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }

  return (
    <>
      {/* Back to top */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label={t("backToTop")}
        title={t("backToTop")}
        tabIndex={showBackToTop ? 0 : -1}
        className={`
                    fixed bottom-5 right-4 z-40
                    grid size-10 place-items-center
                    rounded-xl
                    border border-border/60
                    bg-background/80
                    text-muted-foreground
                    shadow-[0_1px_0_rgba(0,0,0,0.03),0_8px_24px_-16px_rgba(0,0,0,0.2)]
                    backdrop-blur-xl
                    supports-[backdrop-filter]:bg-background/70

                    transition-all duration-300 ease-out

                    hover:-translate-y-0.5
                    hover:bg-background/95
                    hover:text-foreground
                    hover:shadow-md

                    active:translate-y-0
                    active:scale-95

                    focus-visible:outline-none
                    focus-visible:ring-[3px]
                    focus-visible:ring-ring/50

                    sm:bottom-6
                    sm:right-6

                    ${
                      showBackToTop
                        ? "translate-y-0 scale-100 opacity-100"
                        : "pointer-events-none translate-y-2 scale-90 opacity-0"
                    }

                    ${consentOpen ? "hidden sm:grid" : ""}
                  `}
      >
        <ArrowUp
          className="size-[17px]"
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {/* Cookie consent */}
      {consentOpen && (
        <aside
          aria-labelledby="landing-cookie-title"
          className="
            fixed inset-x-3 bottom-3 z-[60]
            overflow-hidden
            rounded-2xl
            border border-border/60
            bg-background/80
            text-foreground
            shadow-[0_1px_0_rgba(0,0,0,0.03),0_16px_40px_-20px_rgba(0,0,0,0.22)]
            backdrop-blur-xl
            supports-[backdrop-filter]:bg-background/70

            sm:inset-x-auto
            sm:bottom-5
            sm:left-5
            sm:w-[380px]
          "
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div
                className="
                    mt-0.5
                    grid size-8 shrink-0 place-items-center
                    rounded-lg
                    border border-border/60
                    bg-muted/45
                    text-foreground
                    shadow-sm
                "
              >
                <Cookie
                  className="size-4"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h2
                  id="landing-cookie-title"
                  className="
                    text-[14px]
                    font-semibold
                    leading-5
                    tracking-[-0.01em]
                  "
                >
                  {t("cookieTitle")}
                </h2>

                <p
                  className="
                    mt-1
                    text-[13px]
                    leading-5
                    text-muted-foreground
                  "
                >
                  {t("cookieDescription")}{" "}
                  <Link
                    href="/cookies"
                    className="
                      whitespace-nowrap
                      font-medium
                      text-foreground
                      underline
                      decoration-border
                      underline-offset-4
                      transition-colors
                      hover:decoration-foreground
                    "
                  >
                    {t("cookiePolicy")}
                  </Link>
                </p>
              </div>
            </div>

            <div
              className="
                mt-3.5
                flex items-center justify-end
                gap-2
              "
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  saveChoice("necessary")
                }
                className="
                  h-8
                  rounded-lg
                  px-3
                  text-xs
                  font-medium
                  text-muted-foreground
                  hover:text-foreground
                "
              >
                {t("necessaryOnly")}
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() =>
                  saveChoice("all")
                }
                className="
                  h-8
                  rounded-lg
                  px-3.5
                  text-xs
                  font-semibold
                  shadow-none
                "
              >
                {t("acceptAll")}
              </Button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}