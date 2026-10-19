import clsx from "clsx";

export function Skeleton({
  className,
  label = "内容加载中",
}: {
  className?: string;
  label?: string;
}) {
  return <div className={clsx("skeleton", className)} role="status" aria-label={label} />;
}

export function SkeletonCard() {
  return (
    <div className="zine-card zine-card--pad" aria-hidden="true">
      <Skeleton className="skeleton-title" />
      <Skeleton className="skeleton-line" />
      <Skeleton className="skeleton-line" />
      <Skeleton className="skeleton-line skeleton-line--short" />
    </div>
  );
}
