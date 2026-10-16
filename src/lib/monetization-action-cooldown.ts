import type { LinkActionDto } from "@/lib/api-client";

export const MONETIZATION_ACTION_HISTORY_KEY =
  "stu:monetization-action-clicks:v1";

export type MonetizationActionHistory = Record<string, number>;

function historyKey(action: LinkActionDto, slug: string) {
  const config = action.monetization;
  if (!config) return null;
  return config.cooldownScope === "link"
    ? `${config.adId}@${slug}`
    : config.adId;
}

function cooldownExpiry(
  action: LinkActionDto,
  history: MonetizationActionHistory,
  slug: string,
) {
  const config = action.monetization;
  const key = historyKey(action, slug);
  if (!config || !key || config.cooldownMinutes <= 0) return null;
  const clickedAt = history[key];
  if (!Number.isSafeInteger(clickedAt) || clickedAt <= 0) return null;
  return clickedAt + config.cooldownMinutes * 60_000;
}

export function isMonetizationActionCoolingDown(
  action: LinkActionDto,
  history: MonetizationActionHistory,
  slug: string,
  now: number,
) {
  const expiry = cooldownExpiry(action, history, slug);
  return expiry !== null && expiry > now;
}

export function visibleActionsAfterCooldown(
  actions: LinkActionDto[],
  history: MonetizationActionHistory,
  slug: string,
  now: number,
) {
  const selectedIds = new Set<string>();
  const grouped = new Map<string, LinkActionDto[]>();

  for (const action of actions) {
    const config = action.monetization;
    if (!config || config.displayMode === "all") {
      if (!isMonetizationActionCoolingDown(action, history, slug, now)) {
        if (action.id) selectedIds.add(action.id);
      }
      continue;
    }
    const group = config.rotationGroup || "default";
    const candidates = grouped.get(group) ?? [];
    candidates.push(action);
    grouped.set(group, candidates);
  }

  for (const candidates of grouped.values()) {
    const ordered = [...candidates].sort(
      (left, right) =>
        (left.monetization?.rotationRank ?? 0) -
        (right.monetization?.rotationRank ?? 0),
    );
    for (const candidate of ordered) {
      if (!isMonetizationActionCoolingDown(candidate, history, slug, now)) {
        if (candidate.id) selectedIds.add(candidate.id);
        break;
      }
      if (candidate.monetization?.cooldownBehavior === "hide") break;
    }
  }

  return actions.filter(
    (action) => !action.monetization || Boolean(action.id && selectedIds.has(action.id)),
  );
}

export function recordMonetizationActionClick(
  history: MonetizationActionHistory,
  action: LinkActionDto,
  slug: string,
  clickedAt: number,
) {
  const key = historyKey(action, slug);
  if (!key || (action.monetization?.cooldownMinutes ?? 0) <= 0) return history;

  const entries = Object.entries({ ...history, [key]: clickedAt })
    .filter(([, timestamp]) => Number.isSafeInteger(timestamp) && timestamp > 0)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 500);
  return Object.fromEntries(entries);
}

export function nextMonetizationCooldownExpiry(
  actions: LinkActionDto[],
  history: MonetizationActionHistory,
  slug: string,
  now: number,
) {
  const expiries = actions
    .map((action) => cooldownExpiry(action, history, slug))
    .filter((expiry): expiry is number => expiry !== null && expiry > now);
  return expiries.length ? Math.min(...expiries) : null;
}
