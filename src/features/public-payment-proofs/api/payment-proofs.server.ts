import "server-only";

import { cache } from "react";

import type {
  PublicPaymentProof,
  PublicPaymentProofList,
  PublicPaymentProofSummary,
} from "@/features/public-payment-proofs/types";
import { getServerConfig } from "@/config/server";
import {
  readApiData,
  readPaginatedApiResponse,
} from "@/lib/api-response";

export const PAYMENT_PROOFS_PER_PAGE = 20;

const REVALIDATE_SECONDS = 60;

export const getPublicPaymentProofs = cache(
  async (page: number): Promise<PublicPaymentProofList | null> => {
    const backendApiUrl = getServerConfig().apiInternalUrl;
    if (!backendApiUrl) return null;

    try {
      const response = await fetch(
        `${backendApiUrl}/public/payment-proofs?page=${page}&perPage=${PAYMENT_PROOFS_PER_PAGE}`,
        {
          next: {
            revalidate: REVALIDATE_SECONDS,
            tags: ["public-payment-proofs"],
          },
        },
      );
      if (!response.ok) return null;
      const payload =
        await readPaginatedApiResponse<PublicPaymentProof>(response);
      return {
        items: payload.data ?? [],
        page: payload.meta.page,
        perPage: payload.meta.perPage,
        total: payload.meta.total,
        totalPages: payload.meta.totalPages,
      };
    } catch {
      return null;
    }
  },
);

export const getPublicPaymentProofSummary = cache(
  async (): Promise<PublicPaymentProofSummary | null> => {
    const backendApiUrl = getServerConfig().apiInternalUrl;
    if (!backendApiUrl) return null;

    try {
      const response = await fetch(
        `${backendApiUrl}/public/payment-proofs/summary`,
        {
          next: {
            revalidate: REVALIDATE_SECONDS,
            tags: ["public-payment-proofs"],
          },
        },
      );
      if (!response.ok) return null;
      return await readApiData<PublicPaymentProofSummary>(response);
    } catch {
      return null;
    }
  },
);
