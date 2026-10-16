"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  createSnippet,
  deleteSnippet,
  getSnippetsPage,
  updateSnippet,
  type SnippetDto,
} from "@/lib/api-client";

import { apiSnippetSort, isValidSnippetSort, type SnippetSortOption } from "./types";

export function useSnippetsController() {
  const t = useTranslations("Snippets.toasts");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [snippets, setSnippets] = useState<SnippetDto[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [query, setQueryState] = useState(() => searchParams.get("search") ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [sort, setSortState] = useState<SnippetSortOption>(() => isValidSnippetSort(searchParams.get("sort")));
  const [page, setPageState] = useState(() => Math.max(Number(searchParams.get("page")) || 1, 1));
  const [pageSize, setPageSizeState] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [snippetPendingEdit, setSnippetPendingEdit] = useState<SnippetDto | null>(null);
  const [snippetPendingDelete, setSnippetPendingDelete] = useState<SnippetDto | null>(null);

  const syncUrl = useCallback(
    (next: { query: string; sort: SnippetSortOption; page: number }) => {
      const params = new URLSearchParams();
      if (next.query) params.set("search", next.query);
      if (next.sort !== "newest") params.set("sort", next.sort);
      if (next.page > 1) params.set("page", String(next.page));
      router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
    },
    [pathname, router],
  );

  const loadSnippets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getSnippetsPage({
        search: debouncedQuery || undefined,
        ...apiSnippetSort(sort),
        page,
        limit: pageSize,
      });
      setSnippets(response.data);
      setTotalItems(response.meta.total);
      setPageCount(response.meta.totalPages);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, page, pageSize, sort, t]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 320);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    void Promise.resolve().then(loadSnippets);
  }, [loadSnippets]);

  const setQuery = (value: string) => {
    setQueryState(value);
    setPageState(1);
    syncUrl({ query: value, sort, page: 1 });
  };
  const setSort = (value: SnippetSortOption) => {
    setSortState(value);
    setPageState(1);
    syncUrl({ query, sort: value, page: 1 });
  };
  const setPage = (value: number) => {
    setPageState(value);
    syncUrl({ query, sort, page: value });
  };
  const setPageSize = (value: number) => {
    setPageSizeState(value);
    setPageState(1);
    syncUrl({ query, sort, page: 1 });
  };
  const clearCriteria = () => {
    setQueryState("");
    setDebouncedQuery("");
    setSortState("newest");
    setPageState(1);
    syncUrl({ query: "", sort: "newest", page: 1 });
  };

  const openCreate = () => {
    setSnippetPendingEdit(null);
    setFormOpen(true);
  };
  const openEdit = (snippet: SnippetDto) => {
    setSnippetPendingEdit(snippet);
    setFormOpen(true);
  };

  async function saveSnippet(payload: { name?: string; content: string }) {
    try {
      setBusy(true);
      if (snippetPendingEdit) {
        await updateSnippet(snippetPendingEdit.id, payload);
        toast.success(t("updated"));
      } else {
        await createSnippet(payload);
        toast.success(t("created"));
      }
      setFormOpen(false);
      setSnippetPendingEdit(null);
      await loadSnippets();
      return true;
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : t("saveFailed"));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!snippetPendingDelete) return;
    const target = snippetPendingDelete;
    setSnippetPendingDelete(null);
    try {
      await deleteSnippet(target.id);
      toast.success(t("deleted"));
      await loadSnippets();
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : t("deleteFailed"));
    }
  }

  async function copyContent(snippet: SnippetDto) {
    try {
      await navigator.clipboard.writeText(snippet.content);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  return {
    snippets,
    filteredTotal: totalItems,
    query,
    sort,
    page: Math.min(page, pageCount),
    pageSize,
    pageCount,
    loading,
    error,
    busy,
    formOpen,
    snippetPendingEdit,
    snippetPendingDelete,
    setQuery,
    setSort,
    setPage,
    setPageSize,
    clearCriteria,
    refresh: loadSnippets,
    setFormOpen,
    openCreate,
    openEdit,
    saveSnippet,
    setSnippetPendingDelete,
    confirmDelete,
    copyContent,
  };
}
