import type { WithdrawalsTableQuery } from "@/features/withdrawals/query/withdrawals-search-params";

const sortableColumns = new Set([
  "id",
  "amount",
  "netAmount",
  "status",
  "createdAt",
  "processedAt",
]);

export function serializeWithdrawalsTableQuery(
  state: WithdrawalsTableQuery,
) {
  const primarySort = state.sort[0];
  const sortBy =
    primarySort && sortableColumns.has(primarySort.id)
      ? primarySort.id
      : "createdAt";

  const query = new URLSearchParams({
    page: String(state.page),
    perPage: String(state.perPage),
    sortBy,
    sortOrder: primarySort?.desc === false ? "asc" : "desc",
  });

  if (state.member.trim()) query.set("search", state.member.trim());
  if (state.userId) query.set("userId", String(state.userId));
  if (state.status.length) query.set("status", state.status.join(","));
  if (state.type) query.set("withdrawalType", state.type);
  if (state.method.length) query.set("paymentMethod", state.method.join("|"));
  if (state.account.trim()) query.set("paymentAccount", state.account.trim());
  if (state.minAmount !== null) query.set("amountMin", String(state.minAmount));
  if (state.maxAmount !== null) query.set("amountMax", String(state.maxAmount));
  setDate(query, "createdFrom", state.createdFrom);
  setDate(query, "createdTo", state.createdTo);
  setDate(query, "processedFrom", state.processedFrom);
  setDate(query, "processedTo", state.processedTo);
  if (state.overdue) query.set("overdue", "true");

  return query.toString();
}

function setDate(query: URLSearchParams, key: string, value: number | null) {
  if (value === null) return;
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) query.set(key, date.toISOString());
}
