import type { WithdrawalType } from "@/contracts";

export type { WithdrawalType } from "@/contracts";

export type WithdrawalStatus =
  | "pending"
  | "processing"
  | "paid"
  | "rejected"
  | "cancelled";

export type PayoutMethod = {
  id: string;
  type: "bank" | "wallet" | "paypal";
  provider: string;
  accountHolder: string;
  accountIdentifier: string;
  withdrawFee: number;
  minimumAmount: number;
};

export type WithdrawalTransaction = {
  id: string;
  createdAt: string;
  completedAt?: string;
  method: PayoutMethod;
  requestedAmount: number;
  feeAmount: number;
  baseFeeAmount: number;
  fastFeeAmount: number;
  fastFeeRate: number;
  netAmount: number;
  withdrawalType: WithdrawalType;
  status: WithdrawalStatus;
  failureReason?: string;
  receiptUrl?: string;
  canCancel?: boolean;
};

export type WithdrawalEligibility = {
  eligible: boolean;
  reason?: "identity" | "method" | "minimum_balance" | "review" | "tax";
  message?: string;
  actionLabel?: string;
  actionHref?: string;
};

export type WithdrawalLimits = {
  minimum: number;
  maximum: number;
  remaining: number | null;
  remainingLabel?: string;
};

export type WithdrawalDashboardData = {
  currency: string;
  availableBalance: number;
  pendingBalance: number;
  totalReceived: number;
  requireTrafficSource: boolean;
  fastWithdrawal: {
    enabled: boolean;
    feeRate: number;
    /** Số lần rút nhanh miễn phí mỗi tháng theo hạng Loyalty. */
    freePerMonth: number;
    freeRemaining: number;
  };
  payoutMethods: PayoutMethod[];
  defaultMethodId: string | null;
  eligibility: WithdrawalEligibility;
  limits: WithdrawalLimits;
  processingEstimate?: string;
  transactions: WithdrawalTransaction[];
};

export type WithdrawalEstimate = {
  requestedAmount: number;
  feeAmount: number | null;
  baseFeeAmount: number;
  fastFeeAmount: number;
  fastFeeRate: number;
  netAmount: number | null;
  withdrawalType: WithdrawalType;
};

export type CreateWithdrawalPayload = {
  amount: number;
  payoutMethodId: string;
  idempotencyKey: string;
  trafficSource?: string;
  withdrawalType: WithdrawalType;
};

export interface WithdrawalDataSource {
  getDashboard(): Promise<WithdrawalDashboardData>;
  estimate(
    payload: Omit<CreateWithdrawalPayload, "idempotencyKey">,
  ): Promise<WithdrawalEstimate>;
  create(payload: CreateWithdrawalPayload): Promise<WithdrawalTransaction>;
  cancel(id: string): Promise<WithdrawalTransaction>;
}
