"use client";

import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { getIpReputationList } from "@/features/ip-reputation/api/ip-reputation.client";
import { IpReputationListTable } from "@/features/ip-reputation/components/ip-reputation-list-table";
import { MarkCheatUserPanel } from "@/features/ip-reputation/components/mark-cheat-user-panel";
import type { IpReputationListResponse } from "@/features/ip-reputation/types";

export function IpReputationAdminPage() {
  const t = useTranslations("Admin.ipReputation");
  const [list, setList] = React.useState<IpReputationListResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const result = await getIpReputationList({ page: 1 });
      setList(result);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-xl border p-4">
        <div>
          <h2 className="text-sm font-medium">{t("page.markTitle")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("page.markDescription")}
          </p>
        </div>
        <MarkCheatUserPanel onImported={() => void load()} />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium">{t("page.listTitle")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("page.listDescription")}
          </p>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <LoaderCircle className="size-3.5 animate-spin" />
            {t("loading")}
          </div>
        ) : (
          <IpReputationListTable items={list?.data ?? []} />
        )}
      </section>
    </div>
  );
}
