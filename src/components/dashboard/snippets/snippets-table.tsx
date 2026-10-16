"use client";

import { FileCode2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { TablePagination } from "@/components/table-pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatFileDate } from "@/components/dashboard/files/file-utils";
import { formatSnippetSize } from "@/features/link-creation/lib/media";
import type { SnippetDto } from "@/lib/api-client";

import { SnippetRowActions } from "./snippet-row-actions";

type SnippetsTableProps = {
  snippets: SnippetDto[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (snippet: SnippetDto) => void;
  onCopy: (snippet: SnippetDto) => void;
  onDelete: (snippet: SnippetDto) => void;
};

function SnippetVisual() {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
      <FileCode2 className="size-4" />
    </span>
  );
}

export function SnippetsTable(props: SnippetsTableProps) {
  const t = useTranslations("Snippets.table");
  const locale = useLocale();
  return (
    <section aria-label={t("label")} className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="hidden overflow-x-auto md:block">
        <Table className="min-w-[880px]">
          <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_var(--border)]">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[30%] px-4">{t("snippet")}</TableHead>
              <TableHead className="px-4">{t("content")}</TableHead>
              <TableHead className="w-24 px-4">{t("size")}</TableHead>
              <TableHead className="w-32 px-4">{t("updated")}</TableHead>
              <TableHead className="w-12 px-4"><span className="sr-only">{t("actions")}</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.snippets.map((snippet) => (
              <TableRow key={snippet.id} className="h-16">
                <TableCell className="px-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <SnippetVisual />
                    <button
                      type="button"
                      className="block max-w-64 truncate text-left text-sm font-medium text-foreground hover:text-primary hover:underline"
                      onClick={() => props.onEdit(snippet)}
                    >
                      {snippet.name || "—"}
                    </button>
                  </div>
                </TableCell>
                <TableCell className="px-4">
                  <code className="block max-w-md truncate text-xs text-muted-foreground" title={snippet.content}>
                    {snippet.content}
                  </code>
                </TableCell>
                <TableCell className="px-4 font-medium tabular-nums text-muted-foreground">
                  {formatSnippetSize(snippet.content)}
                </TableCell>
                <TableCell className="px-4 text-muted-foreground">{formatFileDate(snippet.updatedAt, false, locale)}</TableCell>
                <TableCell className="px-4">
                  <SnippetRowActions snippet={snippet} onEdit={props.onEdit} onCopy={props.onCopy} onDelete={props.onDelete} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y divide-border md:hidden">
        {props.snippets.map((snippet) => (
          <article key={snippet.id} className="flex min-h-[76px] items-center gap-3 px-4 py-3">
            <SnippetVisual />
            <div className="min-w-0 flex-1">
              <button type="button" className="block max-w-full truncate text-left text-sm font-medium text-foreground" onClick={() => props.onEdit(snippet)}>
                {snippet.name || "—"}
              </button>
              <code className="mt-0.5 block max-w-full truncate text-xs text-muted-foreground">{snippet.content}</code>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs tabular-nums text-muted-foreground">{formatSnippetSize(snippet.content)}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{formatFileDate(snippet.updatedAt, false, locale)}</span>
              </div>
            </div>
            <SnippetRowActions snippet={snippet} onEdit={props.onEdit} onCopy={props.onCopy} onDelete={props.onDelete} />
          </article>
        ))}
      </div>

      <footer className="border-t border-border px-4 py-3">
        <TablePagination
          page={props.page}
          pageSize={props.pageSize}
          totalItems={props.total}
          onPageChange={props.onPageChange}
          onPageSizeChange={props.onPageSizeChange}
        />
      </footer>
    </section>
  );
}
