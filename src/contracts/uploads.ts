export type MultipartUploadSession = {
  uploadId: string;
  partSize: number;
  totalParts: number;
  expiresAt: string;
  /** Missing on older APIs; clients retain the authenticated proxy fallback. */
  transport?: "direct" | "proxy";
};

export type DirectUploadPart = {
  url: string;
  expiresIn: number;
};
