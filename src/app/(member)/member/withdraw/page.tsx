import type { Metadata } from "next";
import { WithdrawView } from "@/components/dashboard/views/withdraw";

export const metadata: Metadata = {
  title: "Rút tiền",
};

export default function MemberWithdrawPage() {
  return <WithdrawView />;
}
