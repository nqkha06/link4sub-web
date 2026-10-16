import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SupportView } from "@/components/dashboard/views/support";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Support");
  return { title: t("title") };
}

export default function MemberSupportPage() {
  return <SupportView />;
}
