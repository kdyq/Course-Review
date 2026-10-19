import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/zine/EmptyState";
import { PageHead } from "@/components/zine/SectionTitle";
import { ZineLinkButton } from "@/components/zine/ZineButton";
import { zineCardClass } from "@/components/zine/ZineCard";
import { formatScore, formatTerm } from "@/lib/format";
import {
  LEADERBOARD_DIMENSIONS,
  type LeaderboardDimension,
  parseLeaderboardDimension,
} from "@/lib/ranking";
import { getCourseFilterOptions } from "@/server/queries/courses";
import { getLeaderboard } from "@/server/queries/leaderboards";

export const metadata: Metadata = { title: "排行榜" };
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    dimension?: string | string[];
    term?: string | string[];
  }>;
};

function leaderboardHref(dimension: LeaderboardDimension, term?: string): string {
  const params = new URLSearchParams();
  params.set("dimension", dimension);
  if (term) {
    params.set("term", term);
  }
  return `/leaderboards?${params.toString()}`;
}

export default async function LeaderboardsPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const dimension = parseLeaderboardDimension(query.dimension);
  const termParam = Array.isArray(query.term) ? query.term[0] : query.term;
  const term = termParam ?? null;
  const [data, filterOptions] = await Promise.all([
    getLeaderboard(dimension, term),
    getCourseFilterOptions(),
  ]);
  const activeDimension =
    LEADERBOARD_DIMENSIONS.find((item) => item.value === dimension) ?? LEADERBOARD_DIMENSIONS[0];

  return (
    <>
      <PageHead
        title="本周榜单"
        description="按推荐度、难度和作业量查看课程。至少 5 条评价才参与排名，使用贝叶斯平均，避免一条极端高分冲上第一。"
      />

      <section className="section section--tight">
        <div className="shell stack">
          <div className="row-between">
            <nav className="tabs" aria-label="榜单维度">
              {LEADERBOARD_DIMENSIONS.map((item) => (
                <Link
                  key={item.value}
                  href={leaderboardHref(item.value, term ?? undefined)}
                  className={`tab${dimension === item.value ? " tab--active" : ""}`}
                  aria-current={dimension === item.value ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <span className="muted mono">{activeDimension.description}</span>
          </div>

          <div className="filter-group">
            <span className="filter-label">学期</span>
            <Link
              href={leaderboardHref(dimension)}
              className={`pill${term ? "" : " pill--active"}`}
            >
              全部
            </Link>
            {filterOptions.terms.map((item) => (
              <Link
                key={item}
                href={leaderboardHref(dimension, item)}
                className={`pill${term === item ? " pill--active" : ""}`}
              >
                {formatTerm(item)}
              </Link>
            ))}
          </div>

          {data.items.length === 0 ? (
            <EmptyState
              title="这个条件下还没有足够的评价"
              description={`榜单至少需要 ${data.minimum} 条已发布评价。换一个学期，或者先去写一条评价。`}
              action={<ZineLinkButton href="/courses">去翻课程</ZineLinkButton>}
            />
          ) : (
            <div className="grid-2">
              <div className="leaderboard">
                {data.items.map((item, index) => (
                  <div className="leader-row" key={item.courseId}>
                    <span className="leader-rank">{index + 1}</span>
                    <div className="leader-course">
                      <strong>
                        <Link href={`/courses/${item.courseId}`}>{item.courseName}</Link>
                      </strong>
                      <span>
                        {item.courseCode}
                        {item.instructors.length > 0 ? ` · ${item.instructors.join("、")}` : ""}
                      </span>
                    </div>
                    <div className="leader-score">
                      <strong>{formatScore(item.score)}</strong>
                      <span>
                        {item.count} 条 · 原均 {formatScore(item.average)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className={zineCardClass({ paper: "mint", pad: true, className: "rule-card" })}>
                <h2>榜单规则</h2>
                <p>
                  只统计已发布评价。少于 {data.minimum}{" "}
                  条评价的课程不进入榜单。选择学期后，只统计该学期班次的评价。
                </p>
                <p className="mono muted">score = (v / (v + m)) * R + (m / (v + m)) * C</p>
                <p>
                  v 是评价数，R 是课程平均分，C 是全站同维度平均分，m 取 {data.m}。C
                  按小时缓存，避免每次请求重复计算。
                </p>
                <p className="mono muted">当前 C = {formatScore(data.globalAverage)}</p>
                <p>难度和作业量按调整后平均分升序排列，分数越低越靠前；推荐度按降序排列。</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
