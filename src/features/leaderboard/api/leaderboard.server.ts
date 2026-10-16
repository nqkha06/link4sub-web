import "server-only";

import type {
  Leaderboard,
  LeaderboardPeriod,
} from "@/features/leaderboard/types";
import { serverApiFetch } from "@/lib/auth/server-api";
import { readApiData } from "@/lib/api-response";

export async function getMemberLeaderboard(
  period: LeaderboardPeriod,
): Promise<Leaderboard> {
  const response = await serverApiFetch(
    `/member/leaderboard?period=${period}`,
    { cache: "no-store" },
  );
  return readApiData<Leaderboard>(response);
}
