import { Skeleton, SkeletonCard } from "@/components/zine/Skeleton";

export default function MeLoading() {
  return (
    <section className="section">
      <div className="shell grid-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <Skeleton className="skeleton-line" />
    </section>
  );
}
