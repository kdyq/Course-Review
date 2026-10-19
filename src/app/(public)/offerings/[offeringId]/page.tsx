import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewCard } from "@/components/review/ReviewCard";
import { EmptyState } from "@/components/zine/EmptyState";
import { RatingSummary } from "@/components/zine/RatingSummary";
import { PageHead } from "@/components/zine/SectionTitle";
import { ZineLinkButton } from "@/components/zine/ZineButton";
import { zineCardClass } from "@/components/zine/ZineCard";
import { formatScore, hasEnoughSamples } from "@/lib/format";
import { getSession } from "@/lib/session";
import { getOfferingDetail, getViewerReview, parseOfferingSort } from "@/server/queries/offerings";

type PageProps = {
  params: Promise<{ offeringId: string }>;
  searchParams: Promise<{ sort?: string | string[] }>;
};

const SORT_OPTIONS = [
  { value: "helpful", label: "最有用" },
  { value: "latest", label: "最新" },
  { value: "highest", label: "最高分" },
  { value: "lowest", label: "最低分" },
] as const;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { offeringId } = await params;
  const detail = await getOfferingDetail(offeringId, "helpful");
  if (!detail) {
    return { title: "班次详情" };
  }
  return { title: `${detail.offering.courseName} · ${detail.offering.termName}` };
}

export const dynamic = "force-dynamic";

export default async function OfferingDetailPage({ params, searchParams }: PageProps) {
  const { offeringId } = await params;
  const query = await searchParams;
  const sort = parseOfferingSort(query.sort);
  const [detail, session] = await Promise.all([getOfferingDetail(offeringId, sort), getSession()]);

  if (!detail) {
    notFound();
  }

  const viewer = await getViewerReview(offeringId, session?.user?.id);
  const { offering, stats, tagCounts, reviews } = detail;
  const enough = hasEnoughSamples(stats.count);
  const instructors =
    offering.instructors.length > 0
      ? offering.instructors.map((item) => item.name).join("、")
      : "教师待定";

  function statValue(value: number | null): string {
    if (!enough) {
      return "样本不足";
    }
    return value === null ? "未填写" : formatScore(value);
  }

  return (
    <>
      <PageHead
        title={offering.courseName}
        description={`${offering.termName} · ${offering.section} 班 · ${instructors}`}
      >
        <div className="row mt-20">
          <span className="tag mono">{offering.courseCode}</span>
          <span className="tag">{offering.termName}</span>
          <span className="tag">{offering.section} 班</span>
          {offering.campus ? <span className="tag">{offering.campus}</span> : null}
          {offering.isCurrent ? <span className="tag tag--soft">当前学期</span> : null}
        </div>
      </PageHead>

      <section className="section section--tight">
        <div className="shell detail-grid">
          <div className="detail-stack">
            <div className={zineCardClass({ pad: true })}>
              <div className="row-between">
                <h2>评分汇总</h2>
                <span className="muted mono">{stats.count} 条已发布评价</span>
              </div>
              <div className="section-action">
                <RatingSummary
                  average={stats.recommendationAverage}
                  count={stats.count}
                  distribution={stats.recommendationDistribution}
                  label="推荐度"
                />
              </div>
              <div className="stat-row section-action">
                <div className="stat">
                  <span>难度</span>
                  <strong>{statValue(stats.difficultyAverage)}</strong>
                </div>
                <div className="stat">
                  <span>作业量</span>
                  <strong>{statValue(stats.workloadAverage)}</strong>
                </div>
                <div className="stat">
                  <span>给分友好度</span>
                  <strong>{statValue(stats.gradingAverage)}</strong>
                </div>
              </div>
              <div className="stat-row section-action">
                <div className="stat">
                  <span>教学质量</span>
                  <strong>{statValue(stats.teachingAverage)}</strong>
                </div>
                <div className="stat">
                  <span>样本数</span>
                  <strong>{stats.count}</strong>
                </div>
                <div className="stat">
                  <span>班次</span>
                  <strong>{offering.section}</strong>
                </div>
              </div>
              {tagCounts.length > 0 ? (
                <div className="tag-list section-action">
                  {tagCounts.map((tag) => (
                    <span key={tag.name} className="tag">
                      {tag.name} · {tag.count}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="row-between">
              <h2>评价</h2>
              <nav className="tabs" aria-label="评价排序">
                {SORT_OPTIONS.map((option) => (
                  <Link
                    key={option.value}
                    href={`/offerings/${offering.id}?sort=${option.value}`}
                    className={`tab${sort === option.value ? " tab--active" : ""}`}
                    aria-current={sort === option.value ? "page" : undefined}
                  >
                    {option.label}
                  </Link>
                ))}
              </nav>
            </div>

            {reviews.length > 0 ? (
              reviews.map((review) => (
                <ReviewCard key={review.id} review={review} termName={offering.termName} />
              ))
            ) : (
              <EmptyState
                title="还没有评价"
                description="这个班次还没有已发布的评价。你可以成为第一个写手账的人。"
                action={<ZineLinkButton href={`/write/${offering.id}`}>写评价</ZineLinkButton>}
              />
            )}
          </div>

          <aside className="detail-stack">
            <div className={zineCardClass({ paper: "butter", pad: true, className: "prose" })}>
              <h2>
                {viewer
                  ? viewer.status === "PUBLISHED"
                    ? "你已经写过评价"
                    : viewer.status === "PENDING"
                      ? "你的评价正在审核"
                      : "你的评价已被隐藏"
                  : "写一条匿名评价"}
              </h2>
              <p>
                {viewer
                  ? "同一班次只能写一条评价。发布后 7 天内可以编辑，也可以到个人中心查看状态。"
                  : "评价会匿名展示。写清楚难度、作业量和考核方式，比一句“给分好”更有用。"}
              </p>
              <ZineLinkButton
                href={
                  viewer
                    ? viewer.status === "PUBLISHED" || viewer.status === "PENDING"
                      ? `/write/${offering.id}?edit=${viewer.reviewId}`
                      : "/me/reviews"
                    : `/write/${offering.id}`
                }
                variant={viewer ? "secondary" : "primary"}
              >
                {viewer
                  ? viewer.status === "PUBLISHED"
                    ? "编辑我的评价"
                    : viewer.status === "PENDING"
                      ? "查看待审核评价"
                      : "查看我的评价"
                  : "写评价"}
              </ZineLinkButton>
            </div>

            <div className={zineCardClass({ paper: "sky", pad: true, className: "prose" })}>
              <h2>匿名说明</h2>
              <p>
                公开页只显示“匿名同学”和学期，不显示用户名、邮箱或精确发布时间。系统内部保留评价与账号映射，用于一人一评和治理。
              </p>
            </div>

            <div className={zineCardClass({ pad: true, className: "prose" })}>
              <h2>课程</h2>
              <p>{offering.courseName}</p>
              <Link href={`/courses/${offering.courseId}`} className="inline-link">
                看课程详情
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
