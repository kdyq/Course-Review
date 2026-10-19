import Link from "next/link";
import type { CourseOfferingSummary } from "@/server/queries/courses";

export function OfferingRow({ offering }: { offering: CourseOfferingSummary }) {
  return (
    <div className="offering-row">
      <div>
        <h3>
          <Link href={`/offerings/${offering.id}`}>
            {offering.termName} · {offering.section} 班
          </Link>
        </h3>
        <p>
          {offering.instructors.length > 0 ? offering.instructors.join("、") : "教师待定"}
          {offering.isCurrent ? " · 当前学期" : ""}
        </p>
      </div>
      <div className="row">
        {offering.sampleEnough && offering.recommendationAverage !== null ? (
          <span className="course-score">
            <strong>{offering.recommendationAverage.toFixed(1)}</strong>
            <span>{offering.reviewCount} 条</span>
          </span>
        ) : (
          <span className="sample-badge">样本不足 · {offering.reviewCount} 条</span>
        )}
        <Link href={`/offerings/${offering.id}`} className="btn btn-sm btn-secondary">
          看评价
        </Link>
      </div>
    </div>
  );
}
