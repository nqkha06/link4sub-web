import type { Metadata } from "next";

export const metadata: Metadata = { title: "Hạng thành viên" };

export default function LoyaltyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
