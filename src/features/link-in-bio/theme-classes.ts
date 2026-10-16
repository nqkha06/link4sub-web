/**
 * Shared Tailwind class fragments for elements on the public Bio page whose
 * colors must always follow the page's own theme (the --bio-* CSS vars set
 * on the profile card), never the app's global light/dark mode. Every base
 * utility here has a matching `dark:` twin pointing at the exact same
 * value, so nothing shifts when a visitor's browser (or a stale app-wide
 * toggle) happens to be in dark mode.
 */

export const BIO_OUTLINE_BUTTON_CLASS = [
  "border",
  "border-[color:var(--bio-section-border,var(--border))]",
  "bg-[color:var(--bio-section-bg,var(--background))]",
  "text-[color:var(--bio-text,var(--foreground))]",
  "shadow-xs",
  "hover:bg-[color:var(--bio-accent)]/12",
  "hover:text-[color:var(--bio-text,var(--foreground))]",
  "focus-visible:ring-[color:var(--bio-accent)]/50",
  "dark:border-[color:var(--bio-section-border,var(--border))]",
  "dark:bg-[color:var(--bio-section-bg,var(--background))]",
  "dark:hover:bg-[color:var(--bio-accent)]/16",
].join(" ");

export const BIO_MUTED_SURFACE_CLASS =
  "bg-[color:var(--bio-text,var(--foreground))]/6 dark:bg-[color:var(--bio-text,var(--foreground))]/8";

export const BIO_MUTED_TEXT_CLASS =
  "text-[color:var(--bio-muted-text,var(--muted-foreground))]";

export const BIO_SECTION_SURFACE_CLASS =
  "border-[color:var(--bio-section-border,var(--border))] bg-[color:var(--bio-section-bg,var(--card))] text-[color:var(--bio-text,var(--card-foreground))]";
