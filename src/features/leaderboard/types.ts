export const LEADERBOARD_PERIODS = ["week", "month", "all"] as const;

export type LeaderboardPeriod = (typeof LEADERBOARD_PERIODS)[number];

export function isLeaderboardPeriod(value: unknown): value is LeaderboardPeriod {
  return LEADERBOARD_PERIODS.includes(value as LeaderboardPeriod);
}

export type LeaderboardEntry = {
  rank: number;
  /** Tên đã được API che bớt, trừ dòng của chính người đang xem. */
  name: string;
  avatar: string | null;
  validViews: number;
  isMe: boolean;
};

export type Leaderboard = {
  period: LeaderboardPeriod;
  periodStart: string | null;
  generatedAt: string;
  size: number;
  entries: LeaderboardEntry[];
  me: {
    /** null khi chưa có lượt xem hợp lệ nào trong kỳ. */
    rank: number | null;
    validViews: number;
  };
};
