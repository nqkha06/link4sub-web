import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Banknote,
  ChevronRight,
  CircleDollarSign,
  Gift,
  ImageIcon,
  Link2,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

import { getTranslations } from "next-intl/server";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/server-access";

const settingItems = [
  {
    key: "business",
    href: "/admin/settings/business",
    permission: "settings.read",
    icon: SlidersHorizontal,
  },
  {
    key: "appearance",
    href: "/admin/settings/appearance",
    permission: "settings.read",
    icon: ImageIcon,
  },
  {
    key: "registration",
    href: "/admin/settings/registration",
    permission: "settings.read",
    icon: Gift,
  },
  {
    key: "withdrawals",
    href: "/admin/settings/withdrawals",
    permission: "settings.read",
    icon: CircleDollarSign,
  },
  {
    key: "currencies",
    href: "/admin/settings/currencies",
    permission: "currencies.read",
    icon: Banknote,
  },
  {
    key: "links",
    href: "/admin/settings/links",
    permission: "settings.read",
    icon: Link2,
  },
  {
    key: "linkFraud",
    href: "/admin/settings/link-fraud",
    permission: "settings.read",
    icon: ShieldCheck,
  },
] as const;

export default async function AdminSettingsPage() {
  const t = await getTranslations("Admin.routes.settings");
  const { currentUser } = await requireAdmin();
  const permissions = currentUser.permissions ?? [];
  if (
    !permissions.includes("settings.read") &&
    !permissions.includes("currencies.read")
  ) {
    redirect("/admin");
  }
  const visibleItems = settingItems.filter((item) =>
    permissions.includes(item.permission),
  );

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6">
        <AdminPageHeader
          title={t("title")}
          description={t("description")}
        />
        <div className="grid gap-4 md:grid-cols-2">
          {visibleItems.map(({ key, href, icon: Icon }) => (
            <Card
              key={href}
              className="group gap-0 rounded-xl py-0 shadow-none transition-colors hover:border-foreground/20"
            >
              <CardContent className="p-0">
                <Link
                  href={href}
                  className="flex min-h-36 items-start gap-4 p-5 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg border bg-muted/30 text-muted-foreground">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold tracking-[-0.01em]">
                      {t(`items.${key}.title`)}
                    </span>
                    <span className="mt-1.5 block text-sm leading-6 text-muted-foreground">
                      {t(`items.${key}.description`)}
                    </span>
                  </span>
                  <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
