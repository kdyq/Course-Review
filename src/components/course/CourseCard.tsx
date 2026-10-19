import Link from "next/link";
import { StarRating } from "@/components/zine/StarRating";
import { TagList } from "@/components/zine/Tag";
import { zineCardClass } from "@/components/zine/ZineCard";
import { courseTypeLabel } from "@/lib/format";
import type { CourseListItem } from "@/server/queries/courses";

export function CourseCard({ course }: { course: CourseListItem }) {
  return (
    <Link href={`/courses/${course.id}`} className={zineCardClass({ className: "course-card" })}>
      <div className="course-card__head">
        <div>
          <h3>{course.name}</h3>
          <span className="course-code">{course.code}</span>
        </div>
        <span className="sticker sticker--sky">{courseTypeLabel(course.type)}</span>
      </div>

      <div className="course-card__meta">
        <span>{course.collegeName ?? "学院待定"}</span>
        <span>{course.credits ? `${course.credits} 学分` : "学分待定"}</span>
        {course.instructors.length > 0 ? <span>{course.instructors.join("、")}</span> : null}
      </div>

      <TagList tags={course.topTags} />

      <div className="course-card__foot">
        {course.sampleEnough && course.recommendationAverage !== null ? (
          <div className="course-score">
            <strong>{course.recommendationAverage.toFixed(1)}</strong>
            <StarRating value={course.recommendationAverage} label="推荐度" size={12} />
            <span>{course.reviewCount} 条</span>
          </div>
        ) : (
          <span className="sample-badge">样本不足 · {course.reviewCount} 条</span>
        )}
        <span className="inline-link">看详情 →</span>
      </div>
    </Link>
  );
}
