import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cài đặt hệ thống" };

export default function SettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
