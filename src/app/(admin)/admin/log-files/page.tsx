import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getLogEntries, getLogFiles } from "@/features/log-files/api/log-files.server";
import { LogFilesViewer } from "@/features/log-files/components/log-files-viewer";
import { logFilesSearchParamsCache } from "@/features/log-files/query/log-files-search-params";
import { requireAdmin } from "@/lib/auth/server-access";

export const metadata: Metadata = { title: "Nhật ký hàng đợi và tiến trình" };
type SearchParams = Record<string, string | string[] | undefined>;

export default async function LogFilesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const t = await getTranslations("Admin.routes.logFiles");
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions.includes("system_logs.view")) redirect("/admin");

  const query = logFilesSearchParamsCache.parse(await searchParams);
  const listing = await getLogFiles();
  const visible = listing.files.filter((file) => !query.channel || file.channel === query.channel);
  const selected =
    listing.files.find((file) => file.name === query.file) ?? visible[0] ?? null;
  const entries = selected ? await getLogEntries(selected.name, query) : null;

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
      />
      <LogFilesViewer
        listing={listing}
        query={query}
        selectedName={selected?.name ?? null}
        entries={entries}
        canDelete={currentUser.permissions.includes("system_logs.delete")}
      />
    </main>
  );
}
