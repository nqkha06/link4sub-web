export type ReputationSummary = {
  firstBadAt: string;
  lastBadAt: string;
  dirtyUntil: string;
  confirmedCount: number;
};

export type ReputationStatus = "active" | "expired" | "none";
export type TemporalMatch = "MATCH" | "NO_MATCH" | "EXPIRED";
export type RiskLevel = "PASS" | "REVIEW" | "HIGH_RISK";

export type CheatUserPreviewItem = {
  ip: string | null;
  firstSeen: string;
  lastSeen: string;
  hitCount: number;
  existingReputation: ReputationSummary | null;
};

export type CheatUserPreview = {
  user: { id: number; name: string; email: string };
  ips: CheatUserPreviewItem[];
};

export type ConfirmImportResult = {
  user: { id: number };
  imported: Array<{ ip: string; confirmedCount: number; dirtyUntil: string }>;
};

export type WithdrawalScanItem = {
  ip: string | null;
  userFirstSeen: string;
  userLastSeen: string;
  userHitCount: number;
  reputation: ReputationSummary | null;
  reputationStatus: ReputationStatus;
  temporalMatch: TemporalMatch;
};

export type WithdrawalScanResult = {
  user: { id: number; name: string; email: string };
  riskLevel: RiskLevel;
  ips: WithdrawalScanItem[];
};

export type IpReputationListItem = {
  ip: string | null;
  firstBadAt: string;
  lastBadAt: string;
  dirtyUntil: string;
  confirmedCount: number;
  status: ReputationStatus;
};

export type IpReputationListResponse = import("@/contracts").PaginatedApiResponse<IpReputationListItem>;

export type IpReputationEvidenceItem = {
  sourceUser: { id: number; name: string; email: string };
  firstSeen: string;
  lastSeen: string;
  hitCount: number;
};

export type IpReputationDetail = {
  ip: string | null;
  firstBadAt: string;
  lastBadAt: string;
  dirtyUntil: string;
  confirmedCount: number;
  status: ReputationStatus;
  evidences: IpReputationEvidenceItem[];
};
