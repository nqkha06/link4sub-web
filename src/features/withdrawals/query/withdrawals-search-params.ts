import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import type {
  AdminWithdrawal,
  WithdrawalStatus,
} from "@/features/withdrawals/types";
import { getSortingStateParser } from "@/lib/parsers";

const statuses: WithdrawalStatus[] = [
  "pending",
  "processing",
  "paid",
  "rejected",
  "cancelled",
];

/**
 * Bộ lọc bổ sung (ngoài member/status do DataTable quản lý). Dùng chung cho
 * server (parse URL) và client (đọc/ghi URL) để hai phía luôn khớp nhau.
 * Ngày lưu dạng timestamp (ms) đã tính theo múi giờ của admin.
 */
export const withdrawalFilterParsers = {
  type: parseAsStringEnum(["standard", "fast"]),
  // Dấu "|" làm phân cách vì tên phương thức có thể chứa dấu phẩy.
  method: parseAsArrayOf(parseAsString, "|").withDefault([]),
  account: parseAsString.withDefault(""),
  minAmount: parseAsFloat,
  maxAmount: parseAsFloat,
  createdFrom: parseAsInteger,
  createdTo: parseAsInteger,
  processedFrom: parseAsInteger,
  processedTo: parseAsInteger,
  overdue: parseAsBoolean.withDefault(false),
};

export const withdrawalsSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<AdminWithdrawal>().withDefault([
    { id: "createdAt", desc: true },
  ]),
  member: parseAsString.withDefault(""),
  userId: parseAsInteger,
  status: parseAsArrayOf(parseAsStringEnum(statuses)).withDefault([]),
  ...withdrawalFilterParsers,
});

export type WithdrawalsTableQuery = Awaited<
  ReturnType<typeof withdrawalsSearchParamsCache.parse>
>;
