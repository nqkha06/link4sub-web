"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { supportDataSource } from "./support-data-source";
import type {
  CreateSupportRequestInput,
  SupportDashboardData,
  SupportRequest,
} from "./types";

export type SupportTicketFilter = "all" | "active" | "waiting_user" | "resolved";

export function formatSupportDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

/** Định dạng ngày giờ theo ngôn ngữ đang dùng. */
export function useFormatSupportDate() {
  const locale = useLocale();
  return useCallback((value: string) => formatSupportDate(value, locale), [locale]);
}

export function useSupportController() {
  const t = useTranslations("Support");
  const locale = useLocale();
  const [data, setData] = useState<SupportDashboardData>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [requestSheetOpen, setRequestSheetOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState<SupportRequest>();
  const [successRequest, setSuccessRequest] = useState<SupportRequest>();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [statusFilter, setStatusFilter] = useState<SupportTicketFilter>("all");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setData(await supportDataSource.getDashboard());
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("error.fallback"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const filteredRequests = useMemo(() => {
    if (!data) return [];
    const normalized = query.trim().toLocaleLowerCase(locale);
    return data.requests.filter((request) => {
      const matchesQuery =
        !normalized ||
        `${request.reference} ${request.subject} ${request.category} ${t(`categories.${request.categoryValue}`)}`
          .toLocaleLowerCase(locale)
          .includes(normalized);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          ["submitted", "in_progress", "answered"].includes(request.status)) ||
        (statusFilter === "waiting_user" &&
          request.status === "waiting_user") ||
        (statusFilter === "resolved" &&
          ["resolved", "closed"].includes(request.status));
      return matchesQuery && matchesStatus;
    });
  }, [data, query, statusFilter, locale, t]);

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
  };

  const createRequest = async (input: CreateSupportRequestInput) => {
    if (submitting) return false;
    try {
      setSubmitting(true);
      setSubmitError("");
      const request = await supportDataSource.createRequest(input);
      setData((current) => current ? { ...current, requests: [request, ...current.requests] } : current);
      setQuery("");
      setStatusFilter("all");
      setSuccessRequest(request);
      toast.success(t("toasts.created"));
      return true;
    } catch (submitFailure) {
      setSubmitError(submitFailure instanceof Error ? submitFailure.message : t("toasts.createFailed"));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const reply = async (id: number, content: string) => {
    const ticket = await supportDataSource.replyToRequest(id, content);
    setData((current) => current ? { ...current, requests: current.requests.map((request) => request.id === id ? ticket : request) } : current);
    setDetailRequest(ticket);
    toast.success(t("toasts.replied"));
  };

  const openRequest = async (request: SupportRequest) => {
    setDetailRequest(request);
    try {
      const fresh = await supportDataSource.getRequest(request.id);
      setDetailRequest((current) => current?.id === fresh.id ? fresh : current);
      setData((current) => current ? {
        ...current,
        requests: current.requests.map((item) => item.id === fresh.id ? fresh : item),
      } : current);
    } catch {
      toast.error(t("toasts.refreshFailed"));
    }
  };

  return {
    data, loading, error, query, statusFilter, filteredRequests,
    requestSheetOpen, detailRequest, successRequest, submitting, submitError,
    hasFilters: Boolean(query.trim()) || statusFilter !== "all",
    retry: load, setQuery, setStatusFilter, clearFilters, setRequestSheetOpen,
    setDetailRequest, openRequest, setSuccessRequest, createRequest, reply,
  };
}

export type SupportController = ReturnType<typeof useSupportController>;
