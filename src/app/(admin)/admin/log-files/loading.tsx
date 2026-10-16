import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingLogFiles() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Skeleton className="h-16" />
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Skeleton className="h-[520px]" />
        <Skeleton className="h-[520px]" />
      </div>
    </main>
  );
}
