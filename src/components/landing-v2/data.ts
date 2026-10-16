import type { ElementType } from "react";
import { Link as LinkIcon } from "lucide-react";
import { SiDiscord, SiTelegram, SiTiktok, SiYoutube } from "@icons-pack/react-simple-icons";

/**
 * Content for the public homepage.
 *
 * Platform + action names below are drawn from the real catalog used by the
 * link creator (src/features/link-creation/components/link-creator.tsx) so
 * the marketing copy never claims a platform or action the product doesn't
 * actually support yet.
 */

export type NavLinkKey = "howItWorks" | "whyLink4Sub" | "creatorLoop";

export const navLinks: ReadonlyArray<{ labelKey: NavLinkKey; href: string }> = [
  { labelKey: "howItWorks", href: "/how-it-works" },
  { labelKey: "whyLink4Sub", href: "#why-link4sub" },
  { labelKey: "creatorLoop", href: "#creator-loop" },
] as const;

export type BrandPlatform = {
  name: string;
  icon: ElementType;
};

// Only platforms verified against the real action catalog.
export const brandPlatforms: BrandPlatform[] = [
  { name: "YouTube", icon: SiYoutube },
  { name: "TikTok", icon: SiTiktok },
  { name: "Discord", icon: SiDiscord },
  { name: "Telegram", icon: SiTelegram },
  { name: "Website", icon: LinkIcon },
];

export type HeroAction = {
  id: string;
  label: string;
  platform: string;
  icon: ElementType;
};

// Mirrors real action ids: "subscribe" (YouTube) and "join-server" (Discord).
export const heroActions: HeroAction[] = [
  { id: "subscribe", label: "Subscribe on YouTube", platform: "YouTube", icon: SiYoutube },
  { id: "join-server", label: "Join Discord", platform: "Discord", icon: SiDiscord },
];

export const faqs = [
  {
    question: "What is Link4Sub?",
    answer:
      "Link4Sub lets you place supported actions in front of a destination, so a visitor completes them before they get access.",
  },
  {
    question: "What can I unlock?",
    answer:
      "Files, downloads, and other destination links — including invites, resources, templates and pages you want to gate.",
  },
  {
    question: "What actions can I add?",
    answer:
      "Actions like subscribing on YouTube, following a creator, joining a Discord server or Telegram channel, or visiting another page — based on the platforms Link4Sub currently supports.",
  },
  {
    question: "Does the visitor need an account?",
    answer: "No. Visitors complete the requested actions and continue — no sign-up required.",
  },
  {
    question: "Can I see how my links perform?",
    answer: "Yes. Your dashboard shows views and completions for every link you create.",
  },
  {
    question: "Is Link4Sub free?",
    answer: "Yes. Creating and sharing Link4Sub links doesn't require a paid plan.",
  },
] as const;
