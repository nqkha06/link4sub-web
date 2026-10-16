import { authenticatedApiRequest } from "@/lib/api-client";

import type {
  PayoutMethod,
  WithdrawalDataSource,
  WithdrawalStatus,
  WithdrawalTransaction,
  WithdrawalType,
} from "./types";

type RawAccount = {
  id: number;
  details: Record<string, string>;
  paymentMethod: {
    id: number;
    withdrawFee: string;
    minWithdrawAmount: string;
    status: string;
    translations: Array<{ locale: string; name: string }>;
  };
};

type RawWithdrawal = {
  id: number;
  amount: string;
  feeAmount: string;
  baseFeeAmount: string;
  fastFeeAmount: string;
  fastFeeRate: string;
  netAmount: string;
  withdrawalType: WithdrawalType;
  status: WithdrawalStatus;
  statusReason: string | null;
  processedAt: string | null;
  createdAt: string;
  canCancel: boolean;
  paymentMethod: {
    id: number;
    name: string;
    details: Record<string, string>;
  };
};

type RawDashboard = {
  currency: string;
  requireTrafficSource: boolean;
  fastWithdrawal: {
    enabled: boolean;
    feeRate: string;
    freePerMonth?: number;
    freeRemaining?: number;
  };
  availableBalance: string;
  pendingBalance: string;
  totalReceived: string;
  accounts: RawAccount[];
  withdrawals: RawWithdrawal[];
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return authenticatedApiRequest<T>(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...Object.fromEntries(new Headers(init?.headers).entries()),
    },
  });
}

function firstDetail(
  details: Record<string, string>,
  pattern: RegExp,
  fallback = "",
) {
  return (
    Object.entries(details).find(
      ([key, value]) => pattern.test(key) && Boolean(value),
    )?.[1] ?? fallback
  );
}

function methodType(provider: string): PayoutMethod["type"] {
  if (provider.toLowerCase().includes("paypal")) return "paypal";
  if (/(ví|wallet|momo|zalopay)/i.test(provider)) return "wallet";
  return "bank";
}

function translatedMethodName(
  paymentMethod: RawAccount["paymentMethod"],
  locale: string,
) {
  return (
    paymentMethod.translations.find(
      (translation) => translation.locale === locale,
    )?.name ||
    paymentMethod.translations.find(
      (translation) => translation.locale === locale.split("-")[0],
    )?.name ||
    paymentMethod.translations.find(
      (translation) => translation.locale === "vi",
    )?.name ||
    paymentMethod.translations[0]?.name ||
    `#${paymentMethod.id}`
  );
}

function toPayoutMethod(account: RawAccount, locale: string): PayoutMethod {
  const provider = translatedMethodName(account.paymentMethod, locale);
  const values = Object.values(account.details).filter(Boolean);
  const accountHolder = firstDetail(
    account.details,
    /(holder|owner|account_name|full_name|name)/i,
    values[0] ?? "",
  );
  const identifier = firstDetail(
    account.details,
    /(account_number|number|email|phone|wallet|identifier|address)/i,
    values.find((value) => value !== accountHolder) ?? values[0] ?? "",
  );
  return {
    id: String(account.id),
    type: methodType(provider),
    provider,
    accountHolder,
    accountIdentifier: identifier || "—",
    withdrawFee: Number(account.paymentMethod.withdrawFee) || 0,
    minimumAmount: Number(account.paymentMethod.minWithdrawAmount) || 0,
  };
}

function toTransaction(
  raw: RawWithdrawal,
  accounts: RawAccount[],
  locale: string,
): WithdrawalTransaction {
  const values = Object.values(raw.paymentMethod.details).filter(Boolean);
  const accountHolder = firstDetail(
    raw.paymentMethod.details,
    /(holder|owner|account_name|full_name|name)/i,
    values[0] ?? "",
  );
  const identifier = firstDetail(
    raw.paymentMethod.details,
    /(account_number|number|email|phone|wallet|identifier|address)/i,
    values.find((value) => value !== accountHolder) ?? values[0] ?? "",
  );
  const configuredMethod = accounts.find(
    (account) => account.paymentMethod.id === raw.paymentMethod.id,
  )?.paymentMethod;
  const provider = configuredMethod
    ? translatedMethodName(configuredMethod, locale)
    : raw.paymentMethod.name;
  return {
    id: String(raw.id),
    createdAt: raw.createdAt,
    completedAt: raw.processedAt ?? undefined,
    method: {
      id: String(raw.paymentMethod.id),
      type: methodType(provider),
      provider,
      accountHolder,
      accountIdentifier: identifier || "—",
      withdrawFee: Number(raw.feeAmount),
      minimumAmount: 0,
    },
    requestedAmount: Number(raw.amount),
    feeAmount: Number(raw.feeAmount),
    baseFeeAmount: Number(raw.baseFeeAmount),
    fastFeeAmount: Number(raw.fastFeeAmount),
    fastFeeRate: Number(raw.fastFeeRate),
    netAmount: Number(raw.netAmount),
    withdrawalType: raw.withdrawalType,
    status: raw.status,
    failureReason: raw.statusReason ?? undefined,
    canCancel: raw.canCancel,
  };
}

let loadedMethods: PayoutMethod[] = [];
let loadedAccounts: RawAccount[] = [];
let loadedLocale = "vi";

export const withdrawalDataSource: WithdrawalDataSource = {
  async getDashboard() {
    const dashboard = await request<RawDashboard>(
      "/member/withdrawals/dashboard",
    );
    const locale =
      document.cookie
        .split("; ")
        .find((item) => item.startsWith("NEXT_LOCALE="))
        ?.split("=")[1] ?? "vi";
    loadedAccounts = dashboard.accounts;
    loadedLocale = locale;
    loadedMethods = dashboard.accounts.map((account) =>
      toPayoutMethod(account, locale),
    );
    const availableBalance = Number(dashboard.availableBalance);
    const firstMethod = loadedMethods[0];
    return {
      currency: dashboard.currency,
      requireTrafficSource: dashboard.requireTrafficSource,
      fastWithdrawal: {
        enabled: dashboard.fastWithdrawal.enabled,
        feeRate: Number(dashboard.fastWithdrawal.feeRate),
        freePerMonth: dashboard.fastWithdrawal.freePerMonth ?? 0,
        freeRemaining: dashboard.fastWithdrawal.freeRemaining ?? 0,
      },
      availableBalance,
      pendingBalance: Number(dashboard.pendingBalance),
      totalReceived: Number(dashboard.totalReceived),
      payoutMethods: loadedMethods,
      defaultMethodId: firstMethod?.id ?? null,
      eligibility: firstMethod
        ? { eligible: true }
        : {
            eligible: false,
            reason: "method",
            actionHref: "/member/account#payment-method",
          },
      limits: {
        minimum: firstMethod?.minimumAmount ?? 0,
        maximum: availableBalance,
        remaining: null,
      },
      transactions: dashboard.withdrawals.map((withdrawal) =>
        toTransaction(withdrawal, dashboard.accounts, locale),
      ),
    };
  },

  async estimate({ amount, payoutMethodId, withdrawalType }) {
    const response = await request<{
      requestedAmount: string;
      baseFeeAmount: string;
      fastFeeAmount: string;
      fastFeeRate: string;
      feeAmount: string;
      netAmount: string;
      withdrawalType: WithdrawalType;
    }>("/member/withdrawals/estimate", {
      method: "POST",
      body: JSON.stringify({
        amount: String(amount),
        userPaymentMethodId: Number(payoutMethodId),
        withdrawalType,
      }),
    });
    return {
      requestedAmount: Number(response.requestedAmount),
      baseFeeAmount: Number(response.baseFeeAmount),
      fastFeeAmount: Number(response.fastFeeAmount),
      fastFeeRate: Number(response.fastFeeRate),
      feeAmount: Number(response.feeAmount),
      netAmount: Number(response.netAmount),
      withdrawalType: response.withdrawalType,
    };
  },

  async create({
    amount,
    payoutMethodId,
    idempotencyKey,
    trafficSource,
    withdrawalType,
  }) {
    const response = await request<RawWithdrawal>("/member/withdrawals", {
      method: "POST",
      body: JSON.stringify({
        amount: String(amount),
        userPaymentMethodId: Number(payoutMethodId),
        idempotencyKey,
        trafficSource,
        withdrawalType,
      }),
    });
    return toTransaction(response, loadedAccounts, loadedLocale);
  },

  async cancel(id) {
    return toTransaction(
      await request<RawWithdrawal>(`/member/withdrawals/${id}/cancel`, {
        method: "PATCH",
      }),
      loadedAccounts,
      loadedLocale,
    );
  },
};
