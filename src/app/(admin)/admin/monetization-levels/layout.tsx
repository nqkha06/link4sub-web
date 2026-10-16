import "flag-icons/css/flag-icons.min.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cấp độ kiếm tiền" };

export default function MonetizationLevelsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
