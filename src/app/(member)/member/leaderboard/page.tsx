import type { Metadata } from "next";

import { getMemberLeaderboard } from "@/features/leaderboard/api/leaderboard.server";
import { LeaderboardView } from "@/features/leaderboard/components/leaderboard-view";
import {
  isLeaderboardPeriod,
  type LeaderboardPeriod,
} from "@/features/leaderboard/types";

export const metadata: Metadata = {
  title: "Bảng xếp hạng",
};

export default async function MemberLeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const value = Array.isArray(params.period) ? params.period[0] : params.period;
  const period: LeaderboardPeriod = isLeaderboardPeriod(value) ? value : "week";
  const data = await getMemberLeaderboard(period);

  return <LeaderboardView data={data} />;
}
