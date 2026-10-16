export type AdminLinkFraudSettings = {
  ipChangeCheckEnabled: boolean;
  fastCompleteCheckEnabled: boolean;
  minCompleteSeconds: number;
  ipReputationCheckEnabled: boolean;
  countryBlockEnabled: boolean;
  blockedCountryCodes: string;
  botUserAgentCheckEnabled: boolean;
  rateLimitCheckEnabled: boolean;
  rateLimitPerMinute: number;
  adBlockCheckEnabled: boolean;
  deviceDailyLimitEnabled: boolean;
  deviceDailyLimit: number;
  duplicateDeviceCheckEnabled: boolean;
  duplicateDeviceCooldownMinutes: number;
  multiAccountDeviceCheckEnabled: boolean;
  multiAccountDeviceThreshold: number;
  /** Bitmask: rule nào được ghi vào detection mask của access log. */
  detectionLogMask: number;
  updatedAt: string;
};
