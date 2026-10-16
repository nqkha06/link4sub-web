import type { Metadata } from "next";

export const metadata: Metadata = { title: "Phương thức thanh toán" };

export default function PaymentMethodsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
