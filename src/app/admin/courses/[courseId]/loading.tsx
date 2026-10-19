import { Skeleton, SkeletonCard } from "@/components/zine/Skeleton";

export default function AdminCourseDetailLoading() {
  return (
    <div className="stack">
      <Skeleton className="skeleton-title" />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
