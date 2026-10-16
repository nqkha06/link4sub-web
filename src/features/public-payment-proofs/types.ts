export type PublicPaymentProof = {
  id: number;
  /** Tên member đã được API che sẵn, ví dụ "Ngo***". */
  memberName: string;
  paymentMethodName: string;
  amount: string;
  currency: string;
  withdrawalType: string;
  paidAt: string;
};

export type PublicPaymentProofSummary = {
  paymentCount: number;
  memberCount: number;
  totals: Array<{ currency: string; amount: string }>;
  lastPaidAt: string | null;
};

export type PublicPaymentProofList = {
  items: PublicPaymentProof[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};
