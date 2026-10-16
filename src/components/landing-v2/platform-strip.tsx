import { getTranslations } from "next-intl/server";

import {
  SiBehance,
  SiDiscord,
  SiDribbble,
  SiFacebook,
  SiInstagram,
  SiReddit,
  SiSnapchat,
  SiSoundcloud,
  SiSpotify,
  SiTelegram,
  SiThreads,
  SiTiktok,
  SiTwitch,
  SiWhatsapp,
  SiX,
  SiYoutube,
} from "@icons-pack/react-simple-icons";

import { landingCompactSectionClassName } from "@/components/landing-v2/section-rhythm";

const platforms = [
  { name: "YouTube", icon: SiYoutube, color: "#FF0000" },
  { name: "TikTok", icon: SiTiktok, color: "#111111" },
  { name: "Instagram", icon: SiInstagram, color: "#E4405F" },
  { name: "X", icon: SiX, color: "#111111" },
  { name: "Facebook", icon: SiFacebook, color: "#1877F2" },
  // { name: "LinkedIn", icon: SiLinkedin, color: "#0A66C2" },
  { name: "SoundCloud", icon: SiSoundcloud, color: "#FF5500" },
  { name: "Spotify", icon: SiSpotify, color: "#1ED760" },
  { name: "Telegram", icon: SiTelegram, color: "#26A5E4" },
  { name: "WhatsApp", icon: SiWhatsapp, color: "#25D366" },
  { name: "Discord", icon: SiDiscord, color: "#5865F2" },
  { name: "Twitch", icon: SiTwitch, color: "#9146FF" },
  { name: "Behance", icon: SiBehance, color: "#1769FF" },
  { name: "Dribbble", icon: SiDribbble, color: "#EA4C89" },
  { name: "Reddit", icon: SiReddit, color: "#FF4500" },
  { name: "Snapchat", icon: SiSnapchat, color: "#E5D900" },
  { name: "Threads", icon: SiThreads, color: "#111111" },
];

export async function PlatformStrip() {
  const t = await getTranslations("Landing.platforms");

  return (
    <section
      className={`${landingCompactSectionClassName} bg-primary/[0.025]`}
    >
      {/* caption cùng width với content chính */}
      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-8">
        <p className="mb-8 text-center text-[12px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {t("caption")}
        </p>
      </div>

      {/* marquee cùng width với testimonial marquee */}
      <div
        className="relative mx-auto w-full max-w-[1500px] overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
        }}
      >
        <div className="platform-logo-marquee flex w-max items-center">
          <PlatformTrack />
          <PlatformTrack ariaHidden />
          <PlatformTrack ariaHidden />
        </div>
      </div>

      <div
        aria-hidden
        className="
          pointer-events-none
          absolute left-1/2 top-1/2 -z-10
          h-[180px] w-[1200px]
          -translate-x-1/2 -translate-y-1/2
          rounded-full
          bg-primary/[0.035]
          blur-[110px]
        "
      />
    </section>
  );
}

function PlatformTrack({
  ariaHidden = false,
}: {
  ariaHidden?: boolean;
}) {
  return (
    <ul
      aria-hidden={ariaHidden || undefined}
      className="flex shrink-0 items-center gap-9 pr-9 sm:gap-11 sm:pr-11 md:gap-14 md:pr-14"
    >
      {platforms.map(({ name, icon: Icon, color }) => (
        <li
          key={name}
          className="group flex h-10 min-w-[34px] shrink-0 items-center justify-center"
          title={name}
        >
          <Icon
            size={27}
            aria-label={ariaHidden ? undefined : name}
            style={{
              color,
            }}
            className="
              opacity-[0.72]
              grayscale-[0.15]
              transition-all
              duration-200
              group-hover:-translate-y-0.5
              group-hover:scale-110
              group-hover:opacity-100
              group-hover:grayscale-0
              sm:[width:29px]
              sm:[height:29px]
            "
          />
        </li>
      ))}
    </ul>
  );
}
