import { HighlightText } from "@/components/landing-v2/highlight-text"
import { LandingFooter } from "@/components/landing-v2/footer"
import { LandingNavbar } from "@/components/landing-v2/navbar"
import type { PublicMenusResponse } from "@/features/admin-menus/types"
import { landingContentSectionClassName } from "@/components/landing-v2/section-rhythm"
import { CreateLinkComposer } from "@/features/create-link/components/create-link-composer"
import type { PublicSiteSettings } from "@/features/site-settings/types"

export function CreateLinkPage({
  settings,
  dashboardHref,
  menus,
}: {
  settings: PublicSiteSettings
  dashboardHref: string | null
  menus: PublicMenusResponse
}) {
  return (
    <div className="bg-background">
      <LandingNavbar settings={settings} dashboardHref={dashboardHref} menus={menus} />
      <main>
        <section className={landingContentSectionClassName}>
          <div
            aria-hidden
            className="absolute left-1/2 top-0 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-primary/[0.05] blur-[130px]"
          />

          <div className="mx-auto w-full max-w-[1180px] px-4 md:px-8">
            <div className="mx-auto max-w-[720px] text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Tạo link miễn phí
              </span>

              <h1 className="mt-4 text-balance text-[2.4rem] font-semibold leading-[1.08] tracking-[-0.045em] text-foreground sm:text-[2.9rem]">
                Khoá nội dung của bạn{" "}
                <HighlightText>trong chưa đầy một phút.</HighlightText>
              </h1>

              <p className="mx-auto mt-5 max-w-[560px] text-pretty text-[16px] leading-7 text-muted-foreground">
                Soạn link ngay bên dưới — chưa cần tài khoản. Khi sẵn sàng xuất bản,
                bạn chỉ mất một bước đăng ký nhanh để nhận link thật.
              </p>
            </div>

            <div className="mt-12 md:mt-14">
              <CreateLinkComposer />
            </div>
          </div>
        </section>
      </main>
      <LandingFooter settings={settings} menus={menus} />
    </div>
  )
}
