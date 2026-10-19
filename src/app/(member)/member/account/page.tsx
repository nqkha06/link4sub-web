import type { Metadata } from "next";
import { AccountView } from "@/components/dashboard/views/account";
import { getLinkRecommendationsPreference } from "@/features/link-recommendations/api/link-recommendations.server";

export const metadata: Metadata = {
  title: "Tài khoản",
};

export default async function MemberAccountPage() {
  const linkRecommendations = await getLinkRecommendationsPreference();

  return <AccountView initialLinkRecommendations={linkRecommendations} />;
}
