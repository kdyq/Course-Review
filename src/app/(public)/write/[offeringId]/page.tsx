import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ReviewForm, type ReviewFormInitial } from "@/components/review/ReviewForm";
import { PageHead } from "@/components/zine/SectionTitle";
import { ZineLinkButton } from "@/components/zine/ZineButton";
import { zineCardClass } from "@/components/zine/ZineCard";
import { ReviewStatus } from "@/generated/prisma/client";
import { EDIT_WINDOW_DAYS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { canEditReview, editDeadline } from "@/lib/review-window";
import { requireUser } from "@/lib/session";
import {
  type ExistingReview,
  getActiveTags,
  getOfferingForWrite,
  getReviewForWrite,
  type WriteOffering,
} from "@/server/queries/reviews";

type PageProps = {
  params: Promise<{ offeringId: string }>;
  searchParams: Promise<{ edit?: string | string[] }>;
};

export const metadata: Metadata = { title: "写评价" };
export const dynamic = "force-dynamic";

function BlockedPanel({
  offering,
  title,
  message,
  children,
}: {
  offering: WriteOffering;
  title: string;
  message: string;
  children?: ReactNode;
}) {
  return (
    <div className={zineCardClass({ paper: "butter", pad: true, className: "prose" })}>
      <h2>{title}</h2>
      <p>{message}</p>
      {children}
      <div className="row section-action">
        <ZineLinkButton href={`/offerings/${offering.id}`}>回到班次详情</ZineLinkButton>
        <ZineLinkButton href="/me/reviews" variant="secondary">
          我的评价
        </ZineLinkButton>
      </div>
    </div>
  );
}

function ExistingReviewSummary({ review }: { review: ExistingReview }) {
  return (
    <div className="stack-sm">
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
    </div>
  );
}

export default async function WriteReviewPage({ params, searchParams }: PageProps) {
  const { offeringId } = await params;
  const query = await searchParams;
  const rawEditId = Array.isArray(query.edit) ? query.edit[0] : query.edit;
  const session = await requireUser();
  const offering = await getOfferingForWrite(offeringId);

  if (!offering) {
    notFound();
  }

  const [existing, tagOptions] = await Promise.all([
    getReviewForWrite(offeringId, session.user.id),
    getActiveTags(),
  ]);

  const instructors =
    offering.instructors.length > 0 ? offering.instructors.join("、") : "教师待定";
  const description = `${offering.courseName} · ${offering.termName} · ${offering.section} 班 · ${instructors}`;

  if (!rawEditId && existing) {
    if (existing.status === ReviewStatus.DELETED) {
      return (
        <>
          <PageHead title="写一页" description={description} />
          <section className="section section--tight">
            <div className="shell">
              <BlockedPanel
                offering={offering}
                title="这条评价已删除"
                message="同一个班次只能保留一条评价。你已删除过这个班次的评价，当前不能重复提交。"
              />
            </div>
          </section>
        </>
      );
    }
    if (existing.status === ReviewStatus.HIDDEN) {
      return (
        <>
          <PageHead title="写一页" description={description} />
          <section className="section section--tight">
            <div className="shell">
              <BlockedPanel
                offering={offering}
                title="这条评价已被隐藏"
                message="被隐藏的评价暂时不能编辑。如果你认为处理有误，可以在评价规范页面了解申诉方式。"
              >
                {existing.hiddenReason ? (
                  <p className="form-error">隐藏原因：{existing.hiddenReason}</p>
                ) : null}
              </BlockedPanel>
            </div>
          </section>
        </>
      );
    }
    redirect(`/write/${offering.id}?edit=${existing.reviewId}`);
  }

  if (rawEditId) {
    if (!existing || existing.reviewId !== rawEditId) {
      notFound();
    }
    if (existing.status === ReviewStatus.DELETED || existing.status === ReviewStatus.HIDDEN) {
      return (
        <>
          <PageHead title="编辑评价" description={description} />
          <section className="section section--tight">
            <div className="shell">
              <BlockedPanel
                offering={offering}
                title="这条评价当前不可编辑"
                message="已删除或已隐藏的评价不能继续编辑。"
              />
            </div>
          </section>
        </>
      );
    }
    if (!canEditReview(existing.createdAt)) {
      return (
        <>
          <PageHead title="编辑评价" description={description} />
          <section className="section section--tight">
            <div className="shell">
              <BlockedPanel
                offering={offering}
                title="编辑窗口已结束"
                message={`评价发布后 ${EDIT_WINDOW_DAYS} 天内可以编辑。这条评价发布于 ${formatDate(
                  existing.createdAt,
                )}，截止时间是 ${formatDate(editDeadline(existing.createdAt))}。`}
              >
                <ExistingReviewSummary review={existing} />
              </BlockedPanel>
            </div>
          </section>
        </>
      );
    }
  }

  const initial: ReviewFormInitial | undefined =
    rawEditId && existing
      ? {
          reviewId: existing.reviewId,
          difficulty: existing.difficulty,
          workload: existing.workload,
          recommendation: existing.recommendation,
          grading: existing.grading,
          teaching: existing.teaching,
          assessment: existing.assessment,
          content: existing.content,
          tags: existing.tags,
        }
      : undefined;

  return (
    <>
      <PageHead title={initial ? "编辑评价" : "写一页"} description={description}>
        <div className="row mt-20">
          <span className="tag mono">{offering.courseCode}</span>
          <span className="tag">{offering.termName}</span>
          <span className="tag">{offering.section} 班</span>
          <span className="tag">{instructors}</span>
        </div>
      </PageHead>

      <section className="section section--tight">
        <div className="shell detail-grid">
          <ReviewForm offeringId={offering.id} initial={initial} tagOptions={tagOptions} />

          <aside className="detail-stack">
            <div className={zineCardClass({ paper: "butter", pad: true, className: "prose" })}>
              <h2>写作提示</h2>
              <p>先写清楚考核方式，再写难度和作业量。具体的时间和任务量比形容词更有用。</p>
              <p>难度和作业量分开看。难不等于作业多，作业少也不等于轻松。</p>
              <p>只写自己的体验，不写教师或其他同学的隐私。</p>
            </div>

            <div className={zineCardClass({ paper: "sky", pad: true, className: "prose" })}>
              <h2>匿名说明</h2>
              <p>
                公开页只显示“匿名同学”和学期。系统内部保留评价与账号的映射，用于一人一评和治理，但不会在公开页面展示。
              </p>
            </div>

            <div className={zineCardClass({ pad: true, className: "prose" })}>
              <h2>编辑窗口</h2>
              <p>
                {initial && existing
                  ? `发布于 ${formatDate(existing.createdAt)}，可在 ${formatDate(
                      editDeadline(existing.createdAt),
                    )} 前修改。`
                  : "发布后 7 天内可以编辑。超过后需要联系管理员。"}
              </p>
              <Link href={`/offerings/${offering.id}`} className="inline-link">
                回到班次详情
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
