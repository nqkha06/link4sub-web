import type { Metadata } from "next";
import { MemberAnnouncementsPage } from "@/features/announcements/components/member-announcements-page";

export const metadata: Metadata = {
  title: "Thông báo",
};

export default function AnnouncementsPage() {
  return <MemberAnnouncementsPage />;
}
