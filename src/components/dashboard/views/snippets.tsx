"use client";

import { useState } from "react";
import { Info, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader } from "@/components/dashboard/ui";
import { SnippetDeleteDialog } from "@/components/dashboard/snippets/snippet-delete-dialog";
import { SnippetFormCredenza } from "@/components/dashboard/snippets/snippet-form-credenza";
import { SnippetsEmptyState, SnippetsErrorState, SnippetsNoResults, SnippetsSkeleton } from "@/components/dashboard/snippets/snippets-states";
import { SnippetsTable } from "@/components/dashboard/snippets/snippets-table";
import { SnippetsToolbar } from "@/components/dashboard/snippets/snippets-toolbar";
import { useSnippetsController } from "@/components/dashboard/snippets/use-snippets-controller";

export function SnippetsView() {
  const t = useTranslations("Snippets");
  const controller = useSnippetsController();
  const [infoVisible, setInfoVisible] = useState(true);
  const hasCriteria = Boolean(controller.query) || controller.sort !== "newest";
  const initialLoading = controller.loading && controller.snippets.length === 0 && !controller.error;

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        description={t("description")}
        action={
          <Button className="h-10 w-full shrink-0 sm:w-auto" onClick={controller.openCreate}>
            <Plus aria-hidden="true" />{t("create")}
          </Button>
        }
      />

      {initialLoading ? (
        <SnippetsSkeleton />
      ) : (
        <>
          {infoVisible ? (
            <Alert className="grid-cols-[1rem_1fr_auto] items-center bg-muted/20">
              <Info />
              <AlertTitle className="col-start-2 line-clamp-none leading-5">{t("info.title")}</AlertTitle>
              <AlertDescription className="col-start-2">{t("info.description")}</AlertDescription>
              <Button
                variant="ghost"
                size="icon-sm"
                className="col-start-3 row-span-2 row-start-1"
                onClick={() => setInfoVisible(false)}
                aria-label={t("info.dismiss")}
              >
                <X />
              </Button>
            </Alert>
          ) : null}

          <SnippetsToolbar
            query={controller.query}
            sort={controller.sort}
            loading={controller.loading}
            onQueryChange={controller.setQuery}
            onSortChange={controller.setSort}
          />

          {controller.error ? (
            <SnippetsErrorState message={controller.error} onRetry={controller.refresh} />
          ) : controller.loading && controller.snippets.length === 0 ? (
            <SnippetsSkeleton />
          ) : controller.snippets.length === 0 && !hasCriteria ? (
            <SnippetsEmptyState />
          ) : controller.snippets.length === 0 ? (
            <SnippetsNoResults onClear={controller.clearCriteria} />
          ) : (
            <SnippetsTable
              snippets={controller.snippets}
              page={controller.page}
              pageSize={controller.pageSize}
              total={controller.filteredTotal}
              onPageChange={controller.setPage}
              onPageSizeChange={controller.setPageSize}
              onEdit={controller.openEdit}
              onCopy={controller.copyContent}
              onDelete={controller.setSnippetPendingDelete}
            />
          )}
        </>
      )}

      <SnippetFormCredenza
        open={controller.formOpen}
        snippet={controller.snippetPendingEdit}
        saving={controller.busy}
        onOpenChange={controller.setFormOpen}
        onSave={controller.saveSnippet}
      />

      <SnippetDeleteDialog
        snippet={controller.snippetPendingDelete}
        onOpenChange={(open) => !open && controller.setSnippetPendingDelete(null)}
        onConfirm={() => void controller.confirmDelete()}
      />
    </PageContainer>
  );
}
