"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CircleAlert, ExternalLink, LoaderCircle,ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import SocialLinksGenerator from "@/features/link-creation/components/link-creator";
import { getLinks, type LinkDto } from "@/lib/api-client";

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
  const t = useTranslations("LinkCard");
  const linksT = useTranslations("Links");
  const commonT = useTranslations("Common");
  const dashboardT = useTranslations("Dashboard.nav");
  const [link, setLink] = useState<LinkDto>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLink = useCallback(async () => {
    const cachedLink = getCachedLink(linkId);

    try {
      setLoading(true);
      setError("");
      const links = await getLinks();
      const currentLink = links.find((item) => item.id === linkId) ?? cachedLink;

      if (!currentLink) {
        throw new Error(linksT("notFound"));
      }

      setLink(currentLink);
      cacheLink(currentLink);
    } catch (loadError) {
      if (cachedLink) {
        setLink(cachedLink);
        setError("");
      } else {
        setError(loadError instanceof Error ? loadError.message : linksT("loadErrorFallback"));
      }
    } finally {
      setLoading(false);
    }
  }, [linkId, linksT]);

  useEffect(() => {
    void Promise.resolve().then(loadLink);
  }, [loadLink]);

  if (loading) return <LinkEditLoading />;

  if (error || !link) {
    return (
      <LinkEditError
        message={error || linksT("notFound")}
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

function LinkEditError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const t = useTranslations("Links");

  return (
    <PageContainer size="wide">
      <Button asChild variant="ghost" size="icon" className="size-11 sm:size-9">
        <Link href="/member/links" aria-label="Social links"><ArrowLeft /></Link>
      </Button>
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>{t("loadErrorTitle")}</AlertTitle>
        <AlertDescription>
          <p>{message}</p>
          <Button variant="outline" className="mt-3 bg-background" onClick={onRetry}>
            <LoaderCircle />
            {t("tryAgain")}
          </Button>
        </AlertDescription>
      </Alert>
    </PageContainer>
  );
}
