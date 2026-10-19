"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, CircleAlert, FileQuestion, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

import { PageContainer } from "@/components/dashboard/ui";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import SocialLinksGenerator from "@/features/link-creation/components/link-creator";
import { getLinks, type LinkDto } from "@/lib/api-client";
import { ApiRequestError } from "@/lib/api-response";

type LinkEditFailure = {
  kind: "not-found" | "load";
  message: string;
};

function getCachedLink(linkId: string) {
  try {
    const value = sessionStorage.getItem(`social-link-edit:${linkId}`);
    if (!value) return undefined;

    const link = JSON.parse(value) as LinkDto;
    return link.id === linkId ? link : undefined;
  } catch {
    return undefined;
  }
}

function cacheLink(link: LinkDto) {
  try {
    sessionStorage.setItem(`social-link-edit:${link.id}`, JSON.stringify(link));
  } catch {
    // Caching is only a fallback for demo links and unavailable APIs.
  }
}

export function LinkEditPage({ linkId }: { linkId: string }) {
  const linksT = useTranslations("Links");
  const commonT = useTranslations("Common");
  const dashboardT = useTranslations("Dashboard.nav");
  const [link, setLink] = useState<LinkDto>();
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState<LinkEditFailure>();

  const loadLink = useCallback(async () => {
    const cachedLink = getCachedLink(linkId);

    try {
      setLoading(true);
      setFailure(undefined);
      const links = await getLinks();
      const currentLink = links.find((item) => item.id === linkId);

      if (!currentLink) {
        setLink(undefined);
        setFailure({
          kind: "not-found",
          message: linksT("unavailableDescription"),
        });
        return;
      }

      setLink(currentLink);
      cacheLink(currentLink);
    } catch (loadError) {
      const unavailable =
        loadError instanceof ApiRequestError &&
        (loadError.status === 403 || loadError.status === 404);

      if (unavailable) {
        setLink(undefined);
        setFailure({
          kind: "not-found",
          message: linksT("unavailableDescription"),
        });
      } else if (cachedLink) {
        setLink(cachedLink);
        setFailure(undefined);
      } else {
        setFailure({
          kind: "load",
          message: loadError instanceof Error
            ? loadError.message
            : linksT("loadErrorFallback"),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [linkId, linksT]);

  useEffect(() => {
    void Promise.resolve().then(loadLink);
  }, [loadLink]);

  if (loading) return <LinkEditLoading />;

  if (failure || !link) {
    return (
      <LinkEditError
        kind={failure?.kind ?? "not-found"}
        message={failure?.message ?? linksT("unavailableDescription")}
        onRetry={() => void loadLink()}
      />
    );
  }

  return (
<PageContainer size="wide">
  <div className="space-y-5">
    {/* Page heading */}
    <div className="flex items-start gap-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            variant="outline"
            size="icon"
            className="
              mt-0.5 size-9 shrink-0 rounded-xl
              border-border/60 bg-background/80
              text-muted-foreground shadow-sm
              backdrop-blur
              transition-all
              hover:-translate-x-0.5
              hover:border-border
              hover:bg-muted/70
              hover:text-foreground
            "
          >
            <Link
              href="/member/links"
              aria-label={dashboardT("links")}
            >
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
        </TooltipTrigger>

        <TooltipContent>
          {dashboardT("links")}
        </TooltipContent>
      </Tooltip>

      <div className="min-w-0 space-y-1.5">
        <Breadcrumb className="text-xs text-muted-foreground">
          <BreadcrumbList className="gap-1">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href="/member/links"
                  className="transition-colors hover:text-foreground"
                >
                  {dashboardT("links")}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator className="opacity-50" />

            <BreadcrumbItem>
              <BreadcrumbPage className="text-muted-foreground">
                {commonT("edit")}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {link.slug}
          </h1>

          <span className="hidden rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:inline-flex">
            Link
          </span>
        </div>
      </div>
    </div>

    <SocialLinksGenerator
      key={link.id}
      embedded
      initialLink={link}
      onSaved={(updatedLink) => {
        setLink(updatedLink)
        cacheLink(updatedLink)
      }}
    />
  </div>
</PageContainer>
  );
}

function LinkEditLoading() {
  return (
    <PageContainer size="wide">
      <div className="border-b border-border pb-5">
        <Skeleton className="mb-3 h-5 w-48" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="mt-2 h-4 w-[34rem] max-w-full" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <Skeleton className="h-[640px] rounded-xl" />
      </div>
    </PageContainer>
  );
}

function LinkEditError({
  kind,
  message,
  onRetry,
}: {
  kind: LinkEditFailure["kind"];
  message: string;
  onRetry: () => void;
}) {
  const t = useTranslations("Links");
  const isNotFound = kind === "not-found";

  return (
    <PageContainer
      size="wide"
      className="flex min-h-[calc(100dvh-12rem)] items-center justify-center py-8 sm:py-12"
    >
      <Card
        role="alert"
        aria-live="polite"
        className="relative w-full max-w-xl overflow-hidden border-border/80 py-0 shadow-sm"
      >
        <div
          className={isNotFound ? "h-1 bg-primary" : "h-1 bg-destructive"}
          aria-hidden="true"
        />
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div
              className={
                isNotFound
                  ? "grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15"
                  : "grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/15"
              }
              aria-hidden="true"
            >
              {isNotFound ? (
                <FileQuestion className="size-6" />
              ) : (
                <CircleAlert className="size-6" />
              )}
            </div>

            {isNotFound ? (
              <span className="rounded-full border border-border bg-muted/50 px-3 py-1 font-mono text-xs font-semibold text-muted-foreground">
                404
              </span>
            ) : null}
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {isNotFound ? t("unavailableEyebrow") : t("loadErrorEyebrow")}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {isNotFound ? t("unavailableTitle") : t("loadErrorTitle")}
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
            {message}
          </p>

          {isNotFound ? (
            <p className="mt-6 rounded-xl border border-border/70 bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
              {t("unavailableHint")}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button asChild className="sm:min-w-40">
              <Link href="/member/links">
                <ArrowLeft />
                {t("backToLinks")}
              </Link>
            </Button>
            <Button variant="outline" className="sm:min-w-36" onClick={onRetry}>
              <RefreshCw />
              {isNotFound ? t("checkAgain") : t("tryAgain")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
