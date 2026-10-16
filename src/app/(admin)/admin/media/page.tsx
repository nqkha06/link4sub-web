import { Upload } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminMediaLibrary } from "@/features/admin-media/components/admin-media-library";
import { requireAdmin } from "@/lib/auth/server-access";

export const metadata: Metadata = { title: "Thư viện hình ảnh" };

export default async function AdminMediaPage() {
  const t = await getTranslations("Admin.routes.media");
  const { currentUser } = await requireAdmin();
  const permissions = currentUser.permissions || [];
  if (!permissions.includes("admin-media.read")) redirect("/admin");

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        leading={
          <span className="grid size-10 place-items-center rounded-xl border bg-primary/10 text-primary">
            <Upload className="size-5" />
          </span>
        }
      />
      <AdminMediaLibrary
        permissions={{
          upload: permissions.includes("admin-media.upload"),
          update: permissions.includes("admin-media.update"),
          delete: permissions.includes("admin-media.delete"),
          manageFolders: permissions.includes("admin-media.manage-folders"),
        }}
      />
    </main>
  );
}
