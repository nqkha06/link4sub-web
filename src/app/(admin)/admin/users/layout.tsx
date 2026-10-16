import type { Metadata } from "next";

export const metadata: Metadata = { title: "Người dùng" };

export default function UsersLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
