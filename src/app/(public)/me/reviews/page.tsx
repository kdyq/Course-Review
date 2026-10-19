import type { Metadata } from "next";
import Link from "next/link";
import { DeleteReviewButton } from "@/components/review/DeleteReviewButton";
import { ReviewStatusBadge } from "@/components/review/ReviewStatusBadge";
import { EmptyState } from "@/components/zine/EmptyState";
import { PageHead } from "@/components/zine/SectionTitle";
import { ZineLinkButton } from "@/components/zine/ZineButton";
import { zineCardClass } from "@/components/zine/ZineCard";
import { ReviewStatus } from "@/generated/prisma/client";
import { formatDate } from "@/lib/format";
import { canEditReview } from "@/lib/review-window";
import { requireUser } from "@/lib/session";
import { getMyReviews } from "@/server/queries/reviews";

export const metadata: Metadata = { title: "我的评价" };
export const dynamic = "force-dynamic";

export default async function MyReviewsPage() {
  const session = await requireUser();
  const reviews = await getMyReviews(session.user.id);

  return (
    <>
      <PageHead
        title="我的评价"
        description="查看评价状态，编辑或删除自己的评价。只有作者本人可以操作。"
      >
        <div className="row mt-20">
          <ZineLinkButton href="/me" variant="secondary">
            回到个人中心
          </ZineLinkButton>
          <ZineLinkButton href="/courses">去翻课程</ZineLinkButton>
        </div>
      </PageHead>

      <section className="section section--tight">
        <div className="shell stack">
          {reviews.length === 0 ? (
            <EmptyState
              title="还没有写过评价"
              description="选一个上过的班次，把难度、作业量和考核方式写下来。"
              action={<ZineLinkButton href="/courses">去翻课程</ZineLinkButton>}
            />
          ) : (
            reviews.map((review) => {
              const editable =
                canEditReview(review.createdAt) &&
                review.status !== ReviewStatus.DELETED &&
                review.status !== ReviewStatus.HIDDEN;

              return (
                <article
                  key={review.id}
                  className={zineCardClass({ pad: true, className: "stack" })}
                >
                  <div className="row-between">
                    <div>
                      <h2>{review.courseName}</h2>
                      <span className="course-code">
                        {review.courseCode} · {review.termName} · {review.section} 班
                      </span>
                    </div>
                    <div className="row">
                      <ReviewStatusBadge status={review.status} />
                      <span className="mono muted">{formatDate(review.createdAt)}</span>
                      {review.editedAt ? <span className="tag tag--soft">已编辑</span> : null}
                    </div>
                  </div>

                  <div className="score-pair">
                    <span>
                      推荐 <strong>{review.recommendation}</strong>
                    </span>
                    <span>
                      难度 <strong>{review.difficulty}</strong>
                    </span>
                    <span>
                      作业 <strong>{review.workload}</strong>
                    </span>
                  </div>

                  <p className="review-card__body">{review.content}</p>

                  {review.hiddenReason ? (
                    <p className="form-error">隐藏原因：{review.hiddenReason}</p>
                  ) : null}

                  <div className="row">
                    <Link href={`/offerings/${review.offeringId}`} className="inline-link">
                      看班次
                    </Link>
                    {editable ? (
                      <Link
                        href={`/write/${review.offeringId}?edit=${review.id}`}
                        className="btn btn-sm btn-secondary"
                      >
                        编辑
                      </Link>
                    ) : (
                      <span className="sample-badge">
                        {review.status === ReviewStatus.DELETED
                          ? "已删除"
                          : review.status === ReviewStatus.HIDDEN
                            ? "已隐藏"
                            : "超过 7 天，不能编辑"}
                      </span>
                    )}
                    {review.status !== ReviewStatus.DELETED ? (
                      <DeleteReviewButton reviewId={review.id} courseName={review.courseName} />
                    ) : null}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </>
  );
}
