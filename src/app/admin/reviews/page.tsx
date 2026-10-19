import Link from "next/link";
import { ModerationActions } from "@/components/admin/ModerationActions";
import { ReviewStatusBadge } from "@/components/review/ReviewStatusBadge";
import { REVIEW_STATUS_LABELS } from "@/lib/constants";
import { formatDateTime, truncate } from "@/lib/format";
import { getAdminReviews } from "@/server/queries/admin";

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING", "PUBLISHED", "HIDDEN", "DELETED"] as const;

type PageProps = {
  searchParams: Promise<{ status?: string | string[] }>;
};

export default async function AdminReviewsPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const rawStatus = Array.isArray(query.status) ? query.status[0] : query.status;
  const status = STATUSES.includes(rawStatus as (typeof STATUSES)[number])
    ? (rawStatus as (typeof STATUSES)[number])
    : undefined;
  const reviews = await getAdminReviews(status);

  return (
    <>
      <h1 className="admin-title">评价审核</h1>

      <div className="tabs">
        <Link href="/admin/reviews" className={`tab${status ? "" : " tab--active"}`}>
          全部
        </Link>
        {STATUSES.map((value) => (
          <Link
            key={value}
            href={`/admin/reviews?status=${value}`}
            className={`tab${status === value ? " tab--active" : ""}`}
          >
            {REVIEW_STATUS_LABELS[value]}
          </Link>
        ))}
      </div>

      <div className="table-wrap section-action">
        <table className="data-table">
          <thead>
            <tr>
              <th>课程 / 班次</th>
              <th>评分</th>
              <th>内容</th>
              <th>状态</th>
              <th>有用</th>
              <th>时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id}>
                <td>
                  {review.courseCode}
                  <br />
                  <span className="muted">
                    {review.courseName} · {review.termName} · {review.section} 班
                  </span>
                </td>
                <td>
                  推荐 {review.recommendation}
                  <br />
                  <span className="muted">
                    难度 {review.difficulty} · 作业 {review.workload}
                  </span>
                </td>
                <td>
                  {truncate(review.content, 120)}
                  {review.hiddenReason ? (
                    <p className="form-error">隐藏原因：{review.hiddenReason}</p>
                  ) : null}
                </td>
                <td>
                  <ReviewStatusBadge status={review.status} />
                </td>
                <td>{review.helpfulCount}</td>
                <td>{formatDateTime(review.createdAt)}</td>
                <td>
                  <ModerationActions reviewId={review.id} status={review.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {reviews.length === 0 ? <p className="muted">当前筛选下没有评价。</p> : null}
    </>
  );
}
