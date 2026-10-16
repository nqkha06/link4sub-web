export const WITHDRAWAL_TYPES = ["standard", "fast"] as const;

export type WithdrawalType = (typeof WITHDRAWAL_TYPES)[number];

export const WITHDRAWAL_PROCESSING_HOURS = {
  standard: { min: 7 * 24, max: 10 * 24 },
  fast: { min: 0, max: 12 },
} as const satisfies Record<
  WithdrawalType,
  { min: number; max: number }
>;
