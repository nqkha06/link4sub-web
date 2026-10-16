import type { Metadata } from "next";
import { AccountView } from "@/components/dashboard/views/account";

export const metadata: Metadata = {
  title: "Tài khoản",
};

export default function MemberAccountPage() {
  return <AccountView />;
}
