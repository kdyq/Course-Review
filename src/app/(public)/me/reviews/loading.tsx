import { Skeleton, SkeletonCard } from "@/components/zine/Skeleton";

export default function MyReviewsLoading() {
  return (
    <section className="section">
      <div className="shell stack">
        <Skeleton className="skeleton-title" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </section>
  );
}
