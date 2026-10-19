import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OfferingRow } from "@/components/course/OfferingRow";
import { ReviewCard } from "@/components/review/ReviewCard";
import { EmptyState } from "@/components/zine/EmptyState";
import { RatingSummary } from "@/components/zine/RatingSummary";
import { PageHead } from "@/components/zine/SectionTitle";
import { ZineLinkButton } from "@/components/zine/ZineButton";
import { zineCardClass } from "@/components/zine/ZineCard";
import { courseTypeLabel, formatScore, hasEnoughSamples } from "@/lib/format";
import { getCourseDetail } from "@/server/queries/courses";

type PageProps = {
  params: Promise<{ courseId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseId } = await params;
  const detail = await getCourseDetail(courseId);
  return { title: detail?.course.name ?? "课程详情" };
}

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({ params }: PageProps) {
  const { courseId } = await params;
  const detail = await getCourseDetail(courseId);

  if (!detail) {
    notFound();
  }

  const { course, stats, offerings, latestReviews } = detail;
  const enough = hasEnoughSamples(stats.count);

  return (
    <>
      <PageHead title={course.name} description={course.description ?? "这门课还没有课程简介。"}>
        <div className="row mt-20">
          <span className="tag mono">{course.code}</span>
          <span className="tag">{courseTypeLabel(course.type)}</span>
          <span className="tag">{course.credits ? `${course.credits} 学分` : "学分待定"}</span>
          <span className="tag">{course.collegeName ?? "学院待定"}</span>
        </div>
      </PageHead>

      <section className="section section--tight">
        <div className="shell detail-grid">
          <div className="detail-stack">
            <div className={zineCardClass({ pad: true })}>
              <div className="row-between">
                <h2>总体评分</h2>
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
                  <strong>{enough ? formatScore(stats.difficultyAverage) : "样本不足"}</strong>
                </div>
                <div className="stat">
                  <span>作业量</span>
                  <strong>{enough ? formatScore(stats.workloadAverage) : "样本不足"}</strong>
                </div>
                <div className="stat">
                  <span>样本数</span>
                  <strong>{stats.count}</strong>
                </div>
              </div>
            </div>

            <div id="offerings" className={zineCardClass({ pad: true })}>
              <div className="section-head">
                <h2>开课班次</h2>
                <span className="muted mono">{offerings.length} 个班次</span>
              </div>
              {offerings.length > 0 ? (
                offerings.map((offering) => <OfferingRow key={offering.id} offering={offering} />)
              ) : (
                <p className="muted">这门课还没有录入开课班次。</p>
              )}
            </div>

            <div className="section-head">
              <h2>最新评价</h2>
              <Link href={`/courses/${course.id}`} className="inline-link">
                回到顶部
              </Link>
            </div>
            {latestReviews.length > 0 ? (
              latestReviews.map((item) => (
                <ReviewCard key={item.review.id} review={item.review} termName={item.termName} />
              ))
            ) : (
              <EmptyState
                title="还没有评价"
                description="这门课还没有已发布的评价。选一个班次，成为第一个写手账的人。"
                action={<ZineLinkButton href="#offerings">选一个班次</ZineLinkButton>}
              />
            )}
          </div>

          <aside className="detail-stack">
            <div className={zineCardClass({ paper: "butter", pad: true, className: "prose" })}>
              <h2>写一页</h2>
              <p>
                评价对象是具体班次，不是课程本体。先从左侧选一个学期和教师，再填写难度、作业量和推荐度。
              </p>
              <ZineLinkButton href="#offerings">去选班次</ZineLinkButton>
            </div>
            <div className={zineCardClass({ paper: "mint", pad: true, className: "prose" })}>
              <h2>小样本保护</h2>
              <p>
                少于 5
                条评价时不显示平均分和分布图，只展示单条评价。这样可以降低通过分数反推身份的可能。
              </p>
            </div>
            <div className={zineCardClass({ paper: "sky", pad: true, className: "prose" })}>
              <h2>匿名说明</h2>
              <p>公开页只显示“匿名同学”和学期，不显示用户名、邮箱或精确发布时间。</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
