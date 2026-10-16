// Đúng 4 trạng thái, khớp với backend (users.constants.ts):
// pending -> active -> (suspended | banned) -> active...
export const userStatuses = [
  "pending",
  "active",
  "suspended",
  "banned",
] as const;

export type UserStatus = (typeof userStatuses)[number];

export type AccessRole = {
  id: number;
  key: string;
  name: string;
  isSystem?: boolean;
  permissionKeys?: string[];
};

export type AccessPermission = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  group: string;
};

export type UserLoyaltyTier = {
  id: number;
  key: string;
  name: string;
  iconKey: string | null;
  minimumValidViews: number;
};

export type UserMonetizationLevel = {
  id: number;
  key: string;
  name: string;
  status: string;
  isDefault: boolean;
};

export type MonetizationLevelOption = UserMonetizationLevel;

export type AdminUserListItem = {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  balance: string;
  status: UserStatus;
  roles: AccessRole[];
  directPermissions: string[];
  permissions: string[];
  loyaltyTier: UserLoyaltyTier | null;
  loyaltyCurrentValue: number;
  loyaltyWindowDays: number;
  monetizationLevel: UserMonetizationLevel | null;
  selectedMonetizationLevelId: number | null;
  usesDefaultMonetizationLevel: boolean;
  linksCount: number;
  activeSessionsCount: number;
  paymentMethodsCount: number;
  withdrawalsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminUser = AdminUserListItem;

export type AdminUserPaymentMethod = {
  id: number;
  paymentMethodId: number;
  name: string;
  status: string;
  details: Array<{ key: string; label: string; value: string }>;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserDetail = AdminUserListItem & {
  referralCode: string | null;
  referrer: { id: number; name: string; email: string } | null;
  storage: {
    limitBytes: string | null;
    usedBytes: string;
    reservedBytes: string;
  };
  socialAccounts: Array<{
    id: number;
    provider: string;
    connectedAt: string;
  }>;
  paymentMethods: AdminUserPaymentMethod[];
  recentData: {
    links: Array<{
      id: number;
      slug: string;
      title: string;
      destinationType: string;
      status: string;
      views: number;
      revenue: string;
      actionsCount: number;
      createdAt: string;
    }>;
    snippets: Array<{
      id: number;
      name: string;
      content: string;
      createdAt: string;
    }>;
    files: Array<{
      id: number;
      name: string;
      originalName: string;
      mimeType: string;
      size: number;
      status: string;
      downloadCount: number;
      createdAt: string;
    }>;
    bioPages: Array<{
      id: number;
      slug: string;
      name: string;
      title: string | null;
      status: string;
      views: number;
      clicks: number;
      updatedAt: string;
    }>;
    withdrawals: Array<{
      id: number;
      amount: string;
      feeAmount: string;
      netAmount: string;
      currency: string;
      withdrawalType: string;
      status: string;
      createdAt: string;
    }>;
    referrals: Array<{
      id: number;
      name: string;
      email: string;
      status: UserStatus;
      createdAt: string;
    }>;
    supportTickets: Array<{
      id: number;
      reference: string;
      subject: string;
      category: string;
      status: string;
      priority: string;
      lastMessageAt: string;
    }>;
    commissions: Array<{
      id: number;
      amount: string;
      rate: string;
      commissionableType: string;
      note: string | null;
      createdAt: string;
      fromUser: { id: number; name: string; email: string };
    }>;
    sessions: Array<{
      id: number;
      authMethod: string;
      ipAddress: string | null;
      userAgent: string | null;
      expiresAt: string;
      revokedAt: string | null;
      createdAt: string;
      lastActiveAt: string;
    }>;
  };
  relationshipCounts: {
    links: number;
    snippets: number;
    files: number;
    bioPages: number;
    paymentMethods: number;
    withdrawals: number;
    referrals: number;
    supportTickets: number;
    commissions: number;
    sessions: number;
  };
};

export type AdminUserSessionStatus = "active" | "revoked" | "expired";

export type AdminUserSession = {
  id: number;
  authMethod: "password" | "google" | string;
  ipAddress: string | null;
  userAgent: string | null;
  status: AdminUserSessionStatus;
  isCurrent: boolean;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
  lastActiveAt: string;
};

export type CreateAdminUserPayload = {
  name: string;
  email: string;
  avatar?: string;
  password: string;
  roles: string[];
  permissions: string[];
  status: UserStatus;
  monetizationLevelId?: number | null;
};

export type UpdateAdminUserPayload = {
  name?: string;
  email?: string;
  avatar?: string | null;
  roles?: string[];
  permissions?: string[];
  status?: UserStatus;
  monetizationLevelId?: number | null;
};

export type UsersResponse = import("@/contracts").PaginatedApiResponse<AdminUserListItem>;

export type UsersTableData = {
  data: AdminUserListItem[];
  pageCount: number;
  total: number;
};

export type UsersAccessOptions = {
  roles: AccessRole[];
  permissions: AccessPermission[];
  monetizationLevels: MonetizationLevelOption[];
};

export type UsersStatistics = {
  generatedAt: string;
  totals: {
    users: number;
    verifiedUsers: number;
    usersWithLinks: number;
    balance: string;
    links: number;
    validViewsLast7Days: number;
    activeSessions: number;
    paymentMethods: number;
    withdrawals: number;
  };
  registrations: {
    today: number;
    last7Days: number;
    last30Days: number;
    byDay: Array<{
      date: string;
      count: number;
    }>;
  };
  statuses: Array<{
    status: UserStatus;
    count: number;
  }>;
  roles: Array<{
    key: string;
    name: string;
    count: number;
  }>;
  monetization: {
    assigned: number;
    usesDefault: number;
  };
};
