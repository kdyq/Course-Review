import { Skeleton, SkeletonCard } from "@/components/zine/Skeleton";

export default function AdminLoading() {
  return (
    <div className="stack">
      <Skeleton className="skeleton-title" />
      <div className="stat-row">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonCard />
    </div>
  );
}
