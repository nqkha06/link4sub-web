import { Suspense } from "react";
import type { Metadata } from "next";
import { BioView } from "@/features/link-in-bio/components/bio-view";

export const metadata: Metadata = {
  title: "Link-in-bio",
};

export default function MemberBioPage() {
  return (
    <Suspense>
      <BioView />
    </Suspense>
  );
}
