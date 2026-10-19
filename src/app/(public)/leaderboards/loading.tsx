import { Skeleton, SkeletonCard } from "@/components/zine/Skeleton";

export default function LeaderboardsLoading() {
  return (
    <section className="section">
      <div className="shell stack">
        <Skeleton className="skeleton-title" />
        <div className="grid-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </section>
  );
}
