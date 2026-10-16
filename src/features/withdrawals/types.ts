import type { WithdrawalType } from "@/contracts";

export type WithdrawalStatus =
  | "pending"
  | "processing"
  | "paid"
  | "rejected"
  | "cancelled";

export type WithdrawalParty = {
  id: number;
  name: string;
  email: string;
};

export type AdminWithdrawal = {
  id: number;
  currency: string;
  amount: string;
  feeAmount: string;
  baseFeeAmount: string;
  fastFeeAmount: string;
  fastFeeRate: string;
  netAmount: string;
  withdrawalType: WithdrawalType;
  status: WithdrawalStatus;
  statusReason: string | null;
  trafficSource: string | null;
  userPaymentMethodId: number | null;
  paymentMethod: {
    id: number;
    name: string;
    details: Record<string, string>;
  };
  user: WithdrawalParty;
  processedBy: WithdrawalParty | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  canCancel: boolean;
};

export type AdminWithdrawalsResponse = import("@/contracts").PaginatedApiResponse<AdminWithdrawal>;

export type AdminWithdrawalsTableData = {
  data: AdminWithdrawal[];
  total: number;
  pageCount: number;
};

export type BulkWithdrawalActionResult = {
  succeeded: number;
  failed: Array<{ id: number; message: string }>;
};

export type AdminWithdrawalFilterOptions = {
  paymentMethods: string[];
};
