import { HelpfulButton } from "@/components/review/HelpfulButton";
import { ReportDialog } from "@/components/review/ReportDialog";
import { StarRating } from "@/components/zine/StarRating";
import { TagList } from "@/components/zine/Tag";
import { zineCardClass } from "@/components/zine/ZineCard";
import type { PublicReview } from "@/lib/anonymity";
import { assessmentLabel, formatMonth } from "@/lib/format";

type ReviewCardProps = {
  review: PublicReview;
  termName: string;
  helpfulState?: {
    active: boolean;
    disabled?: boolean;
    disabledReason?: string;
  };
  reportState?: {
    disabled?: boolean;
    disabledReason?: string;
  };
};

export function ReviewCard({ review, termName, helpfulState, reportState }: ReviewCardProps) {
  return (
    <article className={zineCardClass({ className: "review-card" })}>
      <div className="review-card__head">
        <div>
          <h3 className="review-card__title">匿名同学</h3>
          <div className="review-card__meta">
            <span>{formatMonth(review.createdAt)}</span>
            {review.editedAt ? <span>已编辑</span> : null}
          </div>
        </div>
        <span className="sticker sticker--sky">{termName}</span>
      </div>

      <div className="row">
        <span className="mono muted">推荐度</span>
        <StarRating value={review.recommendation} label="推荐度" size={14} />
      </div>

      <div className="score-pair">
        <span>
          难度 <strong>{review.difficulty}</strong>
        </span>
        <span>
          作业 <strong>{review.workload}</strong>
        </span>
        {review.grading !== null ? (
          <span>
            给分 <strong>{review.grading}</strong>
          </span>
        ) : null}
        {review.teaching !== null ? (
          <span>
            教学 <strong>{review.teaching}</strong>
          </span>
        ) : null}
      </div>

      {review.assessment.length > 0 ? (
        <div className="tag-list">
          {review.assessment.map((value) => (
            <span key={value} className="tag tag--soft">
              {assessmentLabel(value)}
            </span>
          ))}
        </div>
      ) : null}

      <p className="review-card__body">{review.content}</p>

      <TagList tags={review.tags.map((tag) => tag.name)} />

      {review.instructorResponse ? (
        <div className="response-box">
          <span className="kicker">教师回应</span>
          <p>{review.instructorResponse.content}</p>
        </div>
      ) : null}

      <div className="review-card__foot">
        {helpfulState ? (
          <HelpfulButton
            reviewId={review.id}
            initialCount={review.helpfulCount}
            initiallyActive={helpfulState.active}
            disabled={helpfulState.disabled}
            disabledReason={helpfulState.disabledReason}
          />
        ) : (
          <span className="mono muted">有用 {review.helpfulCount}</span>
        )}
        {reportState ? (
          <ReportDialog
            reviewId={review.id}
            disabled={reportState.disabled}
            disabledReason={reportState.disabledReason}
          />
        ) : null}
      </div>
    </article>
  );
}
