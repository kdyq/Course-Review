import { Skeleton, SkeletonCard } from "@/components/zine/Skeleton";

const SKELETON_KEYS = ["one", "two", "three", "four", "five", "six"] as const;

export default function CoursesLoading() {
  return (
    <section className="section">
      <div className="shell stack">
        <Skeleton className="skeleton-title" />
        <div className="course-grid">
          {SKELETON_KEYS.map((key) => (
            <SkeletonCard key={key} />
          ))}
        </div>
      </div>
    </section>
  );
}
