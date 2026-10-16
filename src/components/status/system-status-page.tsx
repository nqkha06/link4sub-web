import Link from "next/link";
import { getLocale } from "next-intl/server";
import {
  ArrowRight,
  Compass,
  FileX2,
  Link2Off,
  PauseCircle,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import { LandingFooter } from "@/components/landing-v2/footer";
import { LandingGridBackground } from "@/components/landing-v2/landing-grid-background";
import { LandingNavbar } from "@/components/landing-v2/navbar";
import { Button } from "@/components/ui/button";
import { getPublicMenus } from "@/features/admin-menus/api/public-menus.server";
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server";
import { getDashboardHref } from "@/lib/auth/redirects";
import { getServerUser } from "@/lib/auth/server-session";

export type StatusKind = "default404" | "linkNotFound" | "violation" | "deleted" | "unavailable";

const statusContent = {
  default404: {
    code: "404",
    eyebrow: "Lạc đường một chút",
    title: "Trang này không tồn tại.",
    titleHighlight: "không tồn tại.",
    description: "Có thể địa chỉ đã thay đổi, hoặc trang bạn đang tìm chưa từng được tạo.",
    Icon: Compass,
    label: "Không tìm thấy trang",
    primary: "Về trang chủ",
    primaryHref: "/",
    secondary: "Mở dashboard",
    secondaryHref: "/member",
    tone: "primary",
  },
  linkNotFound: {
    code: "404",
    eyebrow: "Link không khả dụng",
    title: "Không tìm thấy link này.",
    titleHighlight: "link này.",
    description: "Link có thể chưa được tạo, đã đổi địa chỉ hoặc URL bạn mở chưa chính xác.",
    Icon: Link2Off,
    label: "Link not found",
    primary: "Tạo link của bạn",
    primaryHref: "/member/create",
    secondary: "Về trang chủ",
    secondaryHref: "/",
    tone: "primary",
  },
  violation: {
    code: "403",
    eyebrow: "Nội dung bị hạn chế",
    title: "Link đã bị vô hiệu hoá.",
    titleHighlight: "vô hiệu hoá.",
    description: "Link này không còn khả dụng vì vi phạm tiêu chuẩn cộng đồng hoặc chính sách sử dụng của hệ thống.",
    Icon: ShieldAlert,
    label: "Policy violation",
    primary: "Về trang chủ",
    primaryHref: "/",
    secondary: "Xem chính sách",
    secondaryHref: "/member/support",
    tone: "danger",
  },
  deleted: {
    code: "410",
    eyebrow: "Nội dung không còn tồn tại",
    title: "Link đã bị xoá.",
    titleHighlight: "xoá.",
    description: "Chủ sở hữu đã xoá link này. Nội dung đích và các hành động liên quan không còn truy cập được.",
    Icon: Trash2,
    label: "Link deleted",
    primary: "Tạo link mới",
    primaryHref: "/member/create",
    secondary: "Về trang chủ",
    secondaryHref: "/",
    tone: "muted",
  },
  unavailable: {
    code: "410",
    eyebrow: "Link tạm không khả dụng",
    title: "Link này hiện không thể mở.",
    titleHighlight: "không thể mở.",
    description: "Link có thể đang tạm dừng, đã hết hạn hoặc đạt giới hạn lượt truy cập do chủ sở hữu thiết lập.",
    Icon: PauseCircle,
    label: "Link unavailable",
    primary: "Về trang chủ",
    primaryHref: "/",
    secondary: "Tạo link mới",
    secondaryHref: "/member/create",
    tone: "primary",
  },
} as const;

export async function SystemStatusPage({ kind }: { kind: StatusKind }) {
  const locale = await getLocale();
  const [settings, menus, currentUser] = await Promise.all([
    getPublicSiteSettings(),
    getPublicMenus(locale),
    getServerUser({ callbackUrl: "/", mode: "optional" }),
  ]);
  const content = statusContent[kind];
  const Icon = content.Icon;
  const dashboardHref = currentUser ? getDashboardHref(currentUser) : null;
  const titleBeforeHighlight = content.title.slice(
    0,
    -content.titleHighlight.length,
  ).trimEnd();
  const toneClassName = {
    primary: "bg-primary/10 text-primary",
    danger: "bg-destructive/10 text-destructive",
    muted: "bg-muted text-muted-foreground",
  }[content.tone];

  return (
    <div
      className="min-w-[320px] overflow-x-clip bg-background text-foreground"
      id="top"
    >
      <LandingNavbar
        dashboardHref={dashboardHref}
        menus={menus}
        settings={settings}
      />

      <main>
        <section className="relative isolate overflow-hidden border-b border-border/50">
          <LandingGridBackground />

          <div className="mx-auto grid min-h-[720px] w-full max-w-[1280px] items-center gap-16 px-4 py-20 md:px-8 md:py-24 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
            <div className="relative z-10 max-w-[610px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1.5 text-xs font-semibold text-primary shadow-sm">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-40" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                {content.eyebrow}
              </div>

              <p
                aria-label={`Mã trạng thái ${content.code}`}
                className="mt-5 select-none text-[6.5rem] font-semibold leading-[0.78] tracking-[-0.07em] text-primary/[0.11] sm:text-[8.5rem]"
              >
                {content.code}
              </p>

              <h1 className="-mt-2 max-w-[600px] text-balance text-[2.8rem] font-semibold leading-[1.02] tracking-[-0.05em] sm:text-[3.7rem] lg:text-[4.25rem]">
                {titleBeforeHighlight}
                <br />
                <span className="text-primary">{content.titleHighlight}</span>
              </h1>

              <p className="mt-6 max-w-[540px] text-pretty text-[17px] leading-7 text-muted-foreground md:text-lg">
                {content.description}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  asChild
                  className="group h-13 rounded-xl px-7 text-[15px] font-semibold shadow-[0_14px_38px_-14px_color-mix(in_oklab,var(--primary)_55%,transparent)]"
                >
                  <Link href={content.primaryHref}>
                    {content.primary}
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>

                <Button
                  size="lg"
                  variant="ghost"
                  asChild
                  className="group h-13 rounded-xl px-5 text-[15px]"
                >
                  <Link href={content.secondaryHref}>
                    {content.secondary}
                    <ArrowRight className="size-4 opacity-60 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>

            <div
              className="relative mx-auto flex min-h-[460px] w-full max-w-[560px] items-center justify-center lg:min-h-[560px]"
              aria-label={content.label}
            >
              <div className="absolute inset-x-12 top-1/2 h-[310px] -translate-y-1/2 rounded-full bg-primary/[0.08] blur-[70px]" />
              <div className="absolute h-[350px] w-[82%] rotate-[5deg] rounded-[30px] border border-border/70 bg-card/60 shadow-[0_24px_70px_-42px_rgba(0,0,0,0.3)]" />
              <div className="absolute h-[380px] w-[88%] -rotate-[3deg] rounded-[30px] border border-border/80 bg-card/80 shadow-[0_24px_70px_-42px_rgba(0,0,0,0.3)]" />

              <div className="relative w-full max-w-[460px] overflow-hidden rounded-[30px] border border-border bg-card p-6 text-card-foreground shadow-[0_34px_90px_-34px_rgba(0,0,0,0.28)] dark:shadow-[0_34px_90px_-24px_rgba(0,0,0,0.72)] sm:p-8">
                <div className="absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

                <div className="flex items-start justify-between gap-6">
                  <span className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${toneClassName}`}>
                    <Icon className="size-6" />
                  </span>
                  <span className="rounded-full border border-border bg-muted/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {content.code} status
                  </span>
                </div>

                <div className="mt-10">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                    {settings.siteName} public link
                  </span>
                  <h2 className="mt-2 text-[27px] font-semibold leading-tight tracking-[-0.04em]">
                    {content.label}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Trạng thái liên kết đã được cập nhật và nội dung đích hiện không thể tiếp tục.
                  </p>
                </div>

                <div className="mt-8 flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-muted/50 px-4">
                  <FileX2 className="size-4 shrink-0 text-muted-foreground" />
                  <span className="h-2 flex-1 rounded-full bg-border" />
                  <span className="h-2 w-12 rounded-full bg-border" />
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <span className="h-1.5 rounded-full bg-primary" />
                  <span className="h-1.5 rounded-full bg-border" />
                  <span className="h-1.5 rounded-full bg-border" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter menus={menus} settings={settings} />
    </div>
  );
}
