"use client";

import { Filter, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { AccessLogsTableQuery } from "../query/access-logs-search-params";

type Filters = Record<string, string>;

export function AccessLogsFilters({ query }: { query: AccessLogsTableQuery }) {
  const t = useTranslations("Admin.accessLogs");
  const tc = useTranslations("Admin.common");
  const router = useRouter();
  const [filters, setFilters] = React.useState<Filters>(() => ({
    from: toLocalInput(query.from),
    to: toLocalInput(query.to),
    userId: query.userId ? String(query.userId) : "",
    user: query.user,
    linkId: query.linkId ? String(query.linkId) : "",
    link: query.link,
    ip: query.ip,
    country: query.country,
    device: query.device ? String(query.device) : "all",
    isEarn: query.isEarn === null ? "all" : String(query.isEarn),
    hasRevenue:
      query.hasRevenue === null ? "all" : String(query.hasRevenue),
    detectionMask:
      query.detectionMask === null ? "" : String(query.detectionMask),
    rejectReasonMask:
      query.rejectReasonMask === null ? "" : String(query.rejectReasonMask),
    state: query.state || "all",
  }));

  function set(key: string, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function apply() {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("perPage", String(query.perPage));
    params.set("sortBy", query.sortBy);
    params.set("sortOrder", query.sortOrder);
    for (const [key, value] of Object.entries(filters)) {
      if (!value || value === "all") continue;
      if (key === "from" || key === "to") {
        params.set(key, new Date(value).toISOString());
      } else {
        params.set(key, value);
      }
    }
    router.push(`/admin/stu-access-logs?${params.toString()}`);
  }

  function setPeriod(hours: number) {
    const to = new Date();
    const from = new Date(to.getTime() - hours * 60 * 60 * 1_000);
    setFilters((current) => ({
      ...current,
      from: toLocalInput(from.toISOString()),
      to: toLocalInput(to.toISOString()),
    }));
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="size-4" /> {t("filters.title")}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("filters.description")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setPeriod(24)}>
            {t("filters.period24h")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPeriod(168)}>
            {t("filters.period7d")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPeriod(720)}>
            {t("filters.period30d")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <FilterInput label={t("filters.from")} type="datetime-local" value={filters.from} onChange={(value) => set("from", value)} />
          <FilterInput label={t("filters.to")} type="datetime-local" value={filters.to} onChange={(value) => set("to", value)} />
          <FilterInput label={t("filters.userId")} type="number" value={filters.userId} onChange={(value) => set("userId", value)} placeholder="123" />
          <FilterInput label={t("filters.user")} value={filters.user} onChange={(value) => set("user", value)} placeholder="user@example.com" />
          <FilterInput label={t("filters.linkId")} type="number" value={filters.linkId} onChange={(value) => set("linkId", value)} placeholder="456" />
          <FilterInput label={t("filters.link")} value={filters.link} onChange={(value) => set("link", value)} placeholder="summer-campaign" />
          <FilterInput label={t("columns.ip")} value={filters.ip} onChange={(value) => set("ip", value)} placeholder="113.161..." />
          <FilterInput label={t("columns.country")} value={filters.country} onChange={(value) => set("country", value.toUpperCase())} placeholder="VN" />
          <FilterSelect label={t("columns.device")} value={filters.device} onChange={(value) => set("device", value)} options={[['all',tc("all")],['1','Mobile'],['2','Desktop'],['3','Tablet']]} />
          <FilterSelect label={t("columns.isEarn")} value={filters.isEarn} onChange={(value) => set("isEarn", value)} options={[['all',tc("all")],['true',tc("yes")],['false',tc("no")]]} />
          <FilterSelect label={t("columns.revenue")} value={filters.hasRevenue} onChange={(value) => set("hasRevenue", value)} options={[['all',tc("all")],['true',t("filters.hasRevenue")],['false',t("filters.noRevenue")]]} />
          <FilterSelect label={t("filters.detectionStatus")} value={filters.state} onChange={(value) => set("state", value)} options={[['all',tc("all")],['normal',t("detection.normal")],['rejected',t("detection.rejected")],['suspicious',t("detection.suspicious")]]} />
          <FilterInput label={t("detail.detectionMask")} type="number" value={filters.detectionMask} onChange={(value) => set("detectionMask", value)} placeholder="0" />
          <FilterInput label={t("detail.rejectReasonMask")} type="number" value={filters.rejectReasonMask} onChange={(value) => set("rejectReasonMask", value)} placeholder="1" />
          <FilterSelect label={tc("sort")} value={`${query.sortBy}:${query.sortOrder}`} onChange={(value) => { const [sortBy, sortOrder] = value.split(':'); const params = new URLSearchParams(window.location.search); params.set('sortBy', sortBy); params.set('sortOrder', sortOrder); params.set('page','1'); router.push(`/admin/stu-access-logs?${params.toString()}`); }} options={[['createdAt:desc',t("filters.sortNewest")],['createdAt:asc',t("filters.sortOldest")],['revenue:desc',t("filters.sortRevenue")]]} />
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
          <Button variant="ghost" onClick={() => router.push("/admin/stu-access-logs")}>
            <RotateCcw /> {t("filters.clear")}
          </Button>
          <Button onClick={apply}>
            <Filter /> {tc("apply")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterInput({ label, value, onChange, ...props }: { label: string; value: string; onChange: (value: string) => void } & Omit<React.ComponentProps<typeof Input>, "value" | "onChange">) {
  const id = React.useId();
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label><Input id={id} value={value} onChange={(event) => onChange(event.target.value)} {...props} /></div>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string,string]> }) {
  const id = React.useId();
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger id={id}><SelectValue /></SelectTrigger><SelectContent>{options.map(([key,text]) => <SelectItem key={key} value={key}>{text}</SelectItem>)}</SelectContent></Select></div>;
}

function toLocalInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
