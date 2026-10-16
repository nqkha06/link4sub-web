"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  Check,
  CircleDollarSign,
  CircleSlash,
  Filter,
  Globe2,
  Home,
  Link2,
  LoaderCircle,
  Megaphone,
  MonitorSmartphone,
  Plus,
  RotateCcw,
  Search,
  SearchX,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { toast } from "sonner";

import { EmptyCard } from "@/components/dashboard/empty-card";
import { PageContainer, PageHeader } from "@/components/dashboard/ui";
import { TablePagination } from "@/components/table-pagination";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/member/fields/input";
import { MEMBER_FIELD_BARE, MEMBER_FIELD_SHELL } from "@/components/member/fields/field-styles";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/member/fields/select";
import { Skeleton } from "@/components/ui/skeleton";

import SocialLinksGenerator from "@/features/link-creation/components/link-creator";
import { useMemberCurrency } from "@/features/currencies/components/member-currency-provider";
import { selectMemberMonetizationLevel } from "@/features/member-monetization-levels/api/levels.client";
import type {
  MemberMonetizationLevel,
  MemberMonetizationLevelsResponse,
} from "@/features/member-monetization-levels/types";
import {
  getLinks,
  type LinkDto,
} from "@/lib/api-client";

import { LINK_CREATED_EVENT } from "../events";
import { filterLinks, sortLinks } from "../lib/filter-links";
import type {
  LinkFilters,
  LinkSort,
  LinkStatusFilter,
  LinkTypeFilter,
  LinksTab,
} from "../types";
import { defaultLinkFilters } from "../types";

import { UnderlineTabs } from "@/components/member/underline-tabs";
import { LinkCard } from "./link-card";

const linksTabs: Array<{
  id: LinksTab;
  labelKey: string;
  icon: LucideIcon;
}> = [
  {
    id: "overview",
    labelKey: "tabs.overview",
    icon: Home,
  },
  {
    id: "create",
    labelKey: "tabs.create",
    icon: Plus,
  },
  {
    id: "monetization",
    labelKey: "tabs.monetization",
    icon: CircleDollarSign,
  },
];

const emptyMonetizationLevels: MemberMonetizationLevelsResponse = {
  success: true,
  message: "",
  data: [],
  meta: {
    page: 1,
    perPage: 0,
    total: 0,
    totalPages: 0,
    selectedLevelId: null,
    effectiveLevelId: null,
    usesSystemDefault: true,
    totalLinks: 0,
    defaultLocale: "vi",
  },
};

const adTypes = [
  "popup",
  "banner",
  "interstitial",
  "notification",
] as const;

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mediaQuery = window.matchMedia(query);

      mediaQuery.addEventListener("change", onStoreChange);

      return () => {
        mediaQuery.removeEventListener("change", onStoreChange);
      };
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function LinksView({
  monetizationLevels = emptyMonetizationLevels,
}: {
  monetizationLevels?: MemberMonetizationLevelsResponse;
}) {
  const t = useTranslations("Links");

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedTab = searchParams.get("tab");

  const activeTab = isLinksTab(requestedTab)
    ? requestedTab
    : "overview";

  const [links, setLinks] = useState<LinkDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] =
    useState<LinkFilters>(defaultLinkFilters);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [filterOpen, setFilterOpen] = useState(false);

  const isDesktopFilter = useMediaQuery("(min-width: 768px)");

  const filterDirection = isDesktopFilter
    ? "right"
    : "bottom";

  const loadLinks = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getLinks();

      setLinks(data);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : t("loadErrorFallback"),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void Promise.resolve().then(loadLinks);

    const refreshLinks = () => {
      void loadLinks();
    };

    window.addEventListener(
      LINK_CREATED_EVENT,
      refreshLinks,
    );

    return () => {
      window.removeEventListener(
        LINK_CREATED_EVENT,
        refreshLinks,
      );
    };
  }, [loadLinks]);

  const platformOptions = useMemo(
    () =>
      Array.from(
        new Set(
          links.flatMap((link) =>
            link.actions.map(
              (action) => action.platform,
            ),
          ),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [links],
  );

  const filteredLinks = useMemo(
    () =>
      sortLinks(
        filterLinks(links, filters),
        filters.sort,
      ),
    [filters, links],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLinks.length / pageSize),
  );

  const safePage = Math.min(page, totalPages);

  const paginatedLinks = filteredLinks.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const activeFilterCount = [
    filters.status !== "all",
    filters.inputType !== "all",
    filters.platform !== "all",
    Boolean(filters.createdFrom),
    Boolean(filters.createdTo),
    Boolean(filters.minClicks),
    filters.highPerformance,
  ].filter(Boolean).length;

  const updateFilter = <
    Key extends keyof LinkFilters,
  >(
    key: Key,
    value: LinkFilters[Key],
  ) => {
    setPage(1);

    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setPage(1);
    setFilters(defaultLinkFilters);
  };

  const changeTab = (tab: LinksTab) => {
    const nextParams = new URLSearchParams(
      searchParams.toString(),
    );

    if (tab === "overview") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", tab);
    }

    const query = nextParams.toString();

    router.replace(
      query
        ? `${pathname}?${query}`
        : pathname,
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title={t("socialLinks")}
        description={t("description")}
      />

      <LinksTabs
        activeTab={activeTab}
        onChange={changeTab}
      />

      {activeTab === "overview" ? (
        <div className="space-y-6">
          {error ? (
            <Alert
              variant="destructive"
              className="shadow-none"
            >
              <AlertTitle>
                {t("loadErrorTitle")}
              </AlertTitle>

              <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>{error}</span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-background"
                  onClick={() => void loadLinks()}
                >
                  {t("tryAgain")}
                </Button>
              </AlertDescription>
            </Alert>
          ) : loading ? (
            <LinksPageSkeleton />
          ) : (
            <>
              <Card className="gap-3 border-border bg-card p-3 shadow-none">
                <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                  <div className={`${MEMBER_FIELD_SHELL} flex-1 gap-2 px-3`}>
                    <Search className="size-4 shrink-0 text-muted-foreground" />

                    <Input
                      aria-label={t(
                        "searchPlaceholder",
                      )}
                      value={filters.query}
                      onChange={(event) =>
                        updateFilter(
                          "query",
                          event.target.value,
                        )
                      }
                      className={MEMBER_FIELD_BARE}
                      placeholder={t(
                        "searchPlaceholder",
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:flex xl:shrink-0">
                    <Select
                      value={filters.status}
                      onValueChange={(value) =>
                        updateFilter(
                          "status",
                          value as LinkStatusFilter,
                        )
                      }
                    >
                      <SelectTrigger className="w-full xl:w-40">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="all">
                          {t("allStatus")}
                        </SelectItem>

                        <SelectItem value="active">
                          {t("statusActive")}
                        </SelectItem>

                        <SelectItem value="inactive">
                          {t("statusInactive")}
                        </SelectItem>

                        <SelectItem value="paused">
                          {t("statusPaused")}
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={filters.inputType}
                      onValueChange={(value) =>
                        updateFilter(
                          "inputType",
                          value as LinkTypeFilter,
                        )
                      }
                    >
                      <SelectTrigger className="w-full xl:w-36">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="all">
                          {t("allTypes")}
                        </SelectItem>

                        <SelectItem value="url">
                          {t("typeUrl")}
                        </SelectItem>

                        <SelectItem value="file">
                          {t("typeFile")}
                        </SelectItem>

                        <SelectItem value="snippet">
                          {t("typeSnippet")}
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={filters.sort}
                      onValueChange={(value) =>
                        updateFilter(
                          "sort",
                          value as LinkSort,
                        )
                      }
                    >
                      <SelectTrigger className="w-full xl:w-44">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="newest">
                          {t("sort.newest")}
                        </SelectItem>

                        <SelectItem value="oldest">
                          {t("sort.oldest")}
                        </SelectItem>

                        <SelectItem value="clicks-desc">
                          {t("sort.clicksDesc")}
                        </SelectItem>

                        <SelectItem value="title-asc">
                          {t("sort.titleAsc")}
                        </SelectItem>

                        <SelectItem value="actions-desc">
                          {t("sort.actionsDesc")}
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Drawer
                      key={filterDirection}
                      open={filterOpen}
                      onOpenChange={setFilterOpen}
                      direction={filterDirection}
                    >
                      <DrawerTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="relative h-10 rounded-lg bg-background px-3 shadow-none"
                        >
                          <Filter />

                          {t("filter")}

                          {activeFilterCount >
                          0 ? (
                            <Badge className="min-w-5 justify-center px-1.5">
                              {
                                activeFilterCount
                              }
                            </Badge>
                          ) : null}
                        </Button>
                      </DrawerTrigger>

                      <DrawerContent
                        className={
                          isDesktopFilter
                            ? "overflow-hidden border-border bg-background sm:max-w-md"
                            : "max-h-[86dvh] overflow-hidden rounded-t-2xl border-border bg-background"
                        }
                      >
                        <DrawerHeader className="border-b border-border px-5 py-4 text-left">
                          <DrawerTitle className="flex items-center gap-2 text-base">
                            <Filter className="size-4 text-primary" />

                            {t("filter")}
                          </DrawerTitle>

                          <p className="text-sm leading-6 text-muted-foreground">
                            {t(
                              "filterDescription",
                            )}
                          </p>
                        </DrawerHeader>

                        <div
                          className={
                            isDesktopFilter
                              ? "flex h-[calc(100dvh-89px)] flex-col"
                              : "flex max-h-[calc(86dvh-89px)] flex-col"
                          }
                        >
                          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                            <FilterSelect
                              label={t("platform")}
                              id="links-platform"
                            >
                              <Select
                                value={
                                  filters.platform
                                }
                                onValueChange={(
                                  value,
                                ) =>
                                  updateFilter(
                                    "platform",
                                    value,
                                  )
                                }
                              >
                                <SelectTrigger
                                  id="links-platform"
                                  className="w-full"
                                >
                                  <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                  <SelectItem value="all">
                                    {t(
                                      "allPlatforms",
                                    )}
                                  </SelectItem>

                                  {platformOptions.map(
                                    (platform) => (
                                      <SelectItem
                                        key={
                                          platform
                                        }
                                        value={
                                          platform
                                        }
                                      >
                                        {
                                          platform
                                        }
                                      </SelectItem>
                                    ),
                                  )}
                                </SelectContent>
                              </Select>
                            </FilterSelect>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <FilterSelect
                                label={t(
                                  "fromDate",
                                )}
                                id="links-created-from"
                              >
                                <Input
                                  id="links-created-from"
                                  type="date"
                                  value={
                                    filters.createdFrom
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateFilter(
                                      "createdFrom",
                                      event.target
                                        .value,
                                    )
                                  }
                                />
                              </FilterSelect>

                              <FilterSelect
                                label={t(
                                  "toDate",
                                )}
                                id="links-created-to"
                              >
                                <Input
                                  id="links-created-to"
                                  type="date"
                                  value={
                                    filters.createdTo
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateFilter(
                                      "createdTo",
                                      event.target
                                        .value,
                                    )
                                  }
                                />
                              </FilterSelect>
                            </div>

                            <FilterSelect
                              label={t(
                                "minClicks",
                              )}
                              id="links-min-clicks"
                            >
                              <Input
                                id="links-min-clicks"
                                type="number"
                                min={0}
                                value={
                                  filters.minClicks
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateFilter(
                                    "minClicks",
                                    event.target
                                      .value,
                                  )
                                }
                                placeholder={t(
                                  "minClicksPlaceholder",
                                )}
                              />
                            </FilterSelect>

                            <Label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
                              <Checkbox
                                checked={
                                  filters.highPerformance
                                }
                                onCheckedChange={(
                                  checked,
                                ) =>
                                  updateFilter(
                                    "highPerformance",
                                    checked ===
                                      true,
                                  )
                                }
                                className="mt-0.5"
                              />

                              <span>
                                <span className="block text-sm font-medium text-foreground">
                                  {t(
                                    "highPerformance",
                                  )}
                                </span>

                                <span className="mt-1 block text-xs leading-5 font-normal text-muted-foreground">
                                  {t(
                                    "highPerformanceDescription",
                                  )}
                                </span>
                              </span>
                            </Label>
                          </div>

                          <div className="flex gap-2 border-t border-border px-5 py-4">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-10 flex-1"
                              onClick={
                                resetFilters
                              }
                            >
                              <RotateCcw />

                              {t("reset")}
                            </Button>

                            <Button
                              type="button"
                              className="h-10 flex-1"
                              onClick={() =>
                                setFilterOpen(
                                  false,
                                )
                              }
                            >
                              {t("apply")}
                            </Button>
                          </div>
                        </div>
                      </DrawerContent>
                    </Drawer>
                  </div>
                </div>

                {activeFilterCount > 0 ||
                filters.query ? (
                  <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                    <SlidersHorizontal className="size-3.5 text-primary" />

                    <span>
                      {t("filteredCount", {
                        count:
                          filteredLinks.length,
                        total: links.length,
                      })}
                    </span>

                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="h-7 px-2"
                      onClick={resetFilters}
                    >
                      <RotateCcw />

                      {t("reset")}
                    </Button>
                  </div>
                ) : null}
              </Card>

              {links.length === 0 ? (
                <EmptyCard
                  icon={Link2}
                  title={t("emptyTitle")}
                />
              ) : filteredLinks.length === 0 ? (
                <EmptyCard
                  icon={SearchX}
                  title={t("notFound")}
                  action={{
                    label: t("resetFilters"),
                    onClick: resetFilters,
                  }}
                />
              ) : (
                <section
                  className="space-y-3"
                  aria-label={t("listLabel")}
                >
                  {paginatedLinks.map(
                    (link) => (
                      <LinkCard
                        key={link.id}
                        link={link}
                        onChanged={() =>
                          void loadLinks()
                        }
                      />
                    ),
                  )}
                </section>
              )}

              {filteredLinks.length > 0 ? (
                <footer className="border-t border-border pt-4">
                  <TablePagination
                    page={safePage}
                    pageSize={pageSize}
                    totalItems={
                      filteredLinks.length
                    }
                    onPageChange={setPage}
                    onPageSizeChange={
                      setPageSize
                    }
                  />
                </footer>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {activeTab === "create" ? (
        <section
          aria-label={t("tabs.create")}
        >
          <SocialLinksGenerator
            embedded
            actionHistory={links}
          />
        </section>
      ) : null}

      {activeTab === "monetization" ? (
        <MonetizationPanel
          {...monetizationLevels}
        />
      ) : null}
    </PageContainer>
  );
}

function isLinksTab(
  value: string | null,
): value is LinksTab {
  return (
    value === "overview" ||
    value === "create" ||
    value === "monetization"
  );
}

function LinksTabs({
  activeTab,
  onChange,
}: {
  activeTab: LinksTab;
  onChange: (tab: LinksTab) => void;
}) {
  const t = useTranslations("Links");

  return (
    <UnderlineTabs
      items={linksTabs.map((tab) => ({ id: tab.id, label: t(tab.labelKey), icon: tab.icon }))}
      value={activeTab}
      onChange={onChange}
      ariaLabel={t("tabs.label")}
    />
  );
}

function MonetizationPanel({
  data: items,
  meta: { effectiveLevelId, defaultLocale },
}: MemberMonetizationLevelsResponse) {
  const t = useTranslations("Links");
  const locale = useLocale();

  const { formatCurrency } =
    useMemberCurrency();

  const initialPlanId =
    effectiveLevelId ??
    items.find((plan) => plan.isDefault)
      ?.id ??
    items[0]?.id ??
    null;

  const [currentPlanId, setCurrentPlanId] =
    useState<number | null>(
      initialPlanId,
    );

  const [pendingPlanId, setPendingPlanId] =
    useState<number | null>(null);

  const [agreedToTerms, setAgreedToTerms] =
    useState(false);

  const [
    selectingPlanId,
    setSelectingPlanId,
  ] = useState<number | null>(null);

  const currentPlan =
    items.find(
      (plan) => plan.id === currentPlanId,
    ) ??
    items[0] ??
    null;

  const pendingPlan =
    items.find(
      (plan) => plan.id === pendingPlanId,
    ) ?? null;

  const currentContent = currentPlan
    ? localizedPlan(
        currentPlan,
        locale,
        defaultLocale,
      )
    : null;

  const currentProfit = currentPlan
    ? formatProfit(
        currentPlan.metaData.profitBps,
        locale,
      )
    : "—";

  const payoutRates = currentPlan
    ? groupPayoutRates(currentPlan)
    : [];

  const closeEnrollment = () => {
    setPendingPlanId(null);
    setAgreedToTerms(false);
  };

  const enroll = async () => {
    if (
      !pendingPlan ||
      !agreedToTerms ||
      selectingPlanId !== null
    ) {
      return;
    }

    setSelectingPlanId(pendingPlan.id);

    try {
      const result =
        await selectMemberMonetizationLevel(
          pendingPlan.id,
        );

      setCurrentPlanId(
        result.monetizationLevelId,
      );

      toast.success(
        t(
          "monetization.selectionSuccess",
          {
            plan: localizedPlan(
              pendingPlan,
              locale,
              defaultLocale,
            ).name,
          },
        ),
      );

      closeEnrollment();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t(
              "monetization.selectionFailed",
            ),
      );
    } finally {
      setSelectingPlanId(null);
    }
  };

  if (!currentPlan) {
    return (
      <Card className="gap-0 rounded-xl border-dashed border-border bg-card px-5 py-10 text-center shadow-none">
        <CardTitle>
          {t("monetization.emptyTitle")}
        </CardTitle>

        <CardDescription className="mt-2">
          {t(
            "monetization.emptyDescription",
          )}
        </CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="gap-0 rounded-xl border-border bg-card px-4 py-3 shadow-none sm:flex-row sm:items-center sm:px-5">
        <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <Check className="size-4 shrink-0 text-primary" />

          <span>
            {t(
              "monetization.currentPlan",
            )}
          </span>

          <strong className="truncate text-foreground">
            {currentContent?.name}
          </strong>

          <span className="hidden text-border sm:inline">
            ·
          </span>

          <span className="hidden sm:inline">
            {t(
              "monetization.contextProfit",
              {
                profit: currentProfit,
              },
            )}
          </span>

          <span className="hidden text-border sm:inline">
            ·
          </span>

          <span className="hidden sm:inline">
            {t(
              "monetization.contextSteps",
              {
                steps:
                  currentPlan.metaData
                    .stepCount,
              },
            )}
          </span>
        </div>

        <p className="mt-2 text-xs leading-5 text-muted-foreground sm:mt-0 sm:ml-auto sm:max-w-md sm:text-right">
          {t(
            "monetization.contextHint",
          )}
        </p>
      </Card>

      <section
        aria-labelledby="monetization-plans"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <h2
          id="monetization-plans"
          className="sr-only"
        >
          {t("monetization.plansTitle")}
        </h2>

        {items.map((plan) => {
          const isCurrent =
            plan.id === currentPlanId;

          const content = localizedPlan(
            plan,
            locale,
            defaultLocale,
          );

          const profit = formatProfit(
            plan.metaData.profitBps,
            locale,
          );

          return (
            <Card
              key={plan.id}
              className={`gap-0 overflow-hidden rounded-xl border bg-card p-0 shadow-none transition-colors ${
                isCurrent
                  ? "border-primary/50"
                  : "border-border hover:border-foreground/20"
              }`}
            >
              <CardHeader className="px-5 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg tracking-[-0.02em]">
                      {content.name}
                    </CardTitle>

                    <CardDescription className="mt-1 leading-5">
                      {
                        content.description
                      }
                    </CardDescription>
                  </div>

                  {isCurrent ? (
                    <Badge className="shrink-0">
                      {t(
                        "monetization.active",
                      )}
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="space-y-5 px-5 py-5">
                <div className="grid grid-cols-2 divide-x divide-border rounded-lg border border-border bg-muted/20">
                  <div className="px-3 py-3">
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "monetization.profit",
                      )}
                    </p>

                    <p className="mt-1 text-xl font-semibold tracking-[-0.02em] text-foreground">
                      {profit}
                    </p>
                  </div>

                  <div className="px-3 py-3">
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "monetization.steps",
                      )}
                    </p>

                    <p className="mt-1 text-xl font-semibold tracking-[-0.02em] text-foreground">
                      {
                        plan.metaData
                          .stepCount
                      }
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t(
                      "monetization.visitorExperience",
                    )}
                  </p>

                  {adTypes.map(
                    (adType) => {
                      const density =
                        plan.metaData
                          .visitorExperience[
                          adType
                        ];

                      const isDisabled =
                        density === "none";

                      return (
                        <div
                          key={adType}
                          className="flex items-center gap-3"
                        >
                          <span className="grid size-7 shrink-0 place-items-center rounded-md border border-border bg-muted/20 text-muted-foreground">
                            {isDisabled ? (
                              <CircleSlash className="size-3.5" />
                            ) : (
                              <Megaphone className="size-3.5" />
                            )}
                          </span>

                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {t(
                                `monetization.ads.${adType}`,
                              )}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {t(
                                `monetization.adDensity.${density}`,
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </CardContent>

              <CardFooter className="border-t border-border bg-muted/10 px-5 py-4">
                {isCurrent ? (
                  <Button
                    className="w-full shadow-none"
                    disabled
                  >
                    <Check />

                    {t(
                      "monetization.active",
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full shadow-none"
                    onClick={() =>
                      setPendingPlanId(
                        plan.id,
                      )
                    }
                  >
                    <MonitorSmartphone />

                    {t(
                      "monetization.enroll",
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </section>

      <Card className="gap-0 overflow-hidden rounded-xl border-border bg-card py-0 shadow-none">
        <CardHeader className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div>
            <CardTitle>
              {t(
                "monetization.payoutTitle",
              )}
            </CardTitle>

            <CardDescription className="mt-1 leading-5">
              {t(
                "monetization.payoutDescription",
              )}
            </CardDescription>
          </div>

          <Badge
            variant="secondary"
            className="w-fit"
          >
            {t(
              "monetization.contextProfit",
              {
                profit: currentProfit,
              },
            )}
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-sm">
              <caption className="sr-only">
                {t(
                  "monetization.payoutTitle",
                )}
              </caption>

              <thead className="border-b border-border bg-muted/20 text-xs font-medium text-muted-foreground">
                <tr>
                  <th
                    scope="col"
                    className="px-5 py-3 text-left sm:px-6"
                  >
                    {t(
                      "monetization.country",
                    )}
                  </th>

                  <th
                    scope="col"
                    className="px-5 py-3 text-right sm:px-6"
                  >
                    {t(
                      "monetization.desktopCpm",
                    )}
                  </th>

                  <th
                    scope="col"
                    className="px-5 py-3 text-right sm:px-6"
                  >
                    {t(
                      "monetization.mobileCpm",
                    )}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {payoutRates.map(
                  (rate) => (
                    <tr
                      key={
                        rate.countryCode
                      }
                      className="transition-colors hover:bg-muted/15"
                    >
                      <td className="px-5 py-3 sm:px-6">
                        <div className="flex items-center gap-3">
                          <CountryFlag
                            code={
                              rate.countryCode
                            }
                          />

                          <span className="font-medium text-foreground">
                            {countryName(
                              rate.countryCode,
                              locale,
                              t,
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3 text-right font-medium tabular-nums text-foreground sm:px-6">
                        {formatPayoutRates(
                          rate.desktop,
                          currentPlan
                            .metaData
                            .profitBps,
                          formatCurrency,
                        )}
                      </td>

                      <td className="px-5 py-3 text-right font-medium tabular-nums text-foreground sm:px-6">
                        {formatPayoutRates(
                          rate.mobileAndTablet,
                          currentPlan
                            .metaData
                            .profitBps,
                          formatCurrency,
                        )}
                      </td>
                    </tr>
                  ),
                )}

                {payoutRates.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-8 text-center text-sm text-muted-foreground sm:px-6"
                    >
                      {t(
                        "monetization.noRates",
                      )}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>

        <CardFooter className="border-t border-border bg-muted/10 px-5 py-3 text-xs leading-5 text-muted-foreground sm:px-6">
          {t("monetization.payoutNote")}
        </CardFooter>
      </Card>

      <AlertDialog
        open={Boolean(pendingPlan)}
        onOpenChange={(open) => {
          if (!open) {
            closeEnrollment();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(
                "monetization.confirmTitle",
                {
                  plan: pendingPlan
                    ? localizedPlan(
                        pendingPlan,
                        locale,
                        defaultLocale,
                      ).name
                    : "",
                },
              )}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {t(
                "monetization.confirmDescription",
                {
                  profit: pendingPlan
                    ? formatProfit(
                        pendingPlan
                          .metaData
                          .profitBps,
                        locale,
                      )
                    : "",
                  steps:
                    pendingPlan?.metaData
                      .stepCount ?? 0,
                },
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/20 p-3 text-sm font-normal leading-5 text-muted-foreground">
            <Checkbox
              checked={agreedToTerms}
              onCheckedChange={(checked) =>
                setAgreedToTerms(
                  checked === true,
                )
              }
            />

            <span>
              {t(
                "monetization.confirmTerms",
              )}
            </span>
          </Label>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={closeEnrollment}
            >
              {t(
                "monetization.cancel",
              )}
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={
                !agreedToTerms ||
                selectingPlanId !== null
              }
              onClick={(event) => {
                event.preventDefault();

                void enroll();
              }}
            >
              {selectingPlanId !==
              null ? (
                <LoaderCircle className="animate-spin motion-reduce:animate-none" />
              ) : null}

              {t(
                "monetization.confirmEnroll",
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type MemberRate =
  MemberMonetizationLevel["rates"][number];

function localizedPlan(
  level: MemberMonetizationLevel,
  locale: string,
  defaultLocale: string,
) {
  const normalizedLocale =
    locale.toLowerCase();

  const normalizedDefault =
    defaultLocale.toLowerCase();

  const translation =
    level.translations.find(
      (item) =>
        item.locale.toLowerCase() ===
        normalizedLocale,
    ) ??
    level.translations.find(
      (item) =>
        item.locale.toLowerCase() ===
        normalizedLocale.split("-")[0],
    ) ??
    level.translations.find(
      (item) =>
        item.locale.toLowerCase() ===
        normalizedDefault,
    ) ??
    level.translations.find(
      (item) =>
        item.locale.toLowerCase() ===
        normalizedDefault.split("-")[0],
    ) ??
    level.translations.find(
      (item) =>
        item.locale.toLowerCase() ===
        "en",
    ) ??
    level.translations[0];

  return {
    name: translation?.name ?? level.key,
    description:
      translation?.description ?? "",
  };
}

function formatProfit(
  profitBps: number,
  locale: string,
) {
  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(profitBps / 100)}%`;
}

function groupPayoutRates(
  level: MemberMonetizationLevel,
) {
  const countryCodes = Array.from(
    new Set(
      level.rates.map(
        (rate) => rate.countryCode,
      ),
    ),
  );

  return countryCodes
    .map((countryCode) => {
      const rates = level.rates.filter(
        (rate) =>
          rate.countryCode ===
          countryCode,
      );

      const anyRate = rates.find(
        (rate) =>
          rate.deviceType === "any",
      );

      const desktop =
        rates.find(
          (rate) =>
            rate.deviceType ===
            "desktop",
        ) ?? anyRate;

      const mobile =
        rates.find(
          (rate) =>
            rate.deviceType ===
            "mobile",
        ) ?? anyRate;

      const tablet =
        rates.find(
          (rate) =>
            rate.deviceType ===
            "tablet",
        ) ?? anyRate;

      const desktopRates = desktop
        ? [desktop]
        : [];

      const mobileAndTablet =
        uniqueRates(
          [mobile, tablet].filter(
            (
              rate,
            ): rate is MemberRate =>
              Boolean(rate),
          ),
        );

      const maxRate = Math.max(
        0,
        ...desktopRates.map(
          (rate) =>
            parseCpm(rate.baseCpm),
        ),
        ...mobileAndTablet.map(
          (rate) =>
            parseCpm(rate.baseCpm),
        ),
      );

      return {
        countryCode,
        desktop: desktopRates,
        mobileAndTablet,
        maxRate,
      };
    })

    // Quốc gia có CPM cao hơn nằm trên.
    .sort(
      (a, b) =>
        b.maxRate - a.maxRate,
    );
}

function parseCpm(value: string) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function uniqueRates(
  rates: MemberRate[],
) {
  return rates.filter(
    (rate, index) =>
      rates.findIndex(
        (candidate) =>
          candidate.baseCpm ===
            rate.baseCpm,
      ) === index,
  );
}

function formatPayoutRates(
  rates: MemberRate[],
  profitBps: number,
  formatCurrency: ReturnType<
    typeof useMemberCurrency
  >["formatCurrency"],
) {
  if (rates.length === 0) {
    return "—";
  }

  const profitShare =
    profitBps / 10_000;

  return rates
    .map((rate) => {
      const baseCpm = Number(
        rate.baseCpm,
      );

      if (!Number.isFinite(baseCpm)) {
        return "—";
      }

      return formatCurrency(
        baseCpm * profitShare,
      );
    })
    .join(" / ");
}

function countryName(
  countryCode: string,
  locale: string,
  t: ReturnType<
    typeof useTranslations<"Links">
  >,
) {
  if (countryCode === "ALL") {
    return t(
      "monetization.allMarkets",
    );
  }

  if (countryCode === "ZZ") {
    return t(
      "monetization.unknownMarket",
    );
  }

  return (
    new Intl.DisplayNames([locale], {
      type: "region",
    }).of(countryCode) ??
    countryCode
  );
}

function CountryFlag({
  code,
}: {
  code: string;
}) {
  if (code === "ALL") {
    return (
      <Globe2
        className="size-5 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    );
  }

  if (code === "ZZ") {
    return (
      <Globe2
        className="size-5 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`fi fi-${code.toLowerCase()} shrink-0 rounded-[2px] shadow-sm ring-1 ring-black/10`}
    />
  );
}

function FilterSelect({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>
        {label}
      </Label>

      {children}
    </div>
  );
}

function LinksPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 rounded-xl" />

      {[1, 2, 3].map((item) => (
        <Skeleton
          key={item}
          className="h-52 rounded-xl"
        />
      ))}
    </div>
  );
}
