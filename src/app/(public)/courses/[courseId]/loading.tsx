import { Skeleton, SkeletonCard } from "@/components/zine/Skeleton";

export default function CourseDetailLoading() {
  return (
    <section className="section">
      <div className="shell detail-grid">
        <div className="detail-stack">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="detail-stack">
          <Skeleton className="skeleton-title" />
          <Skeleton className="skeleton-line" />
          <Skeleton className="skeleton-line" />
        </div>
      </div>
    </section>
  );
}
