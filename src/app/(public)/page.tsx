import Image from "next/image";
import Link from "next/link";
import { HeroMotion } from "@/components/home/HeroMotion";
import { EmptyState } from "@/components/zine/EmptyState";
import { SectionTitle } from "@/components/zine/SectionTitle";
import { StarRating } from "@/components/zine/StarRating";
import { Sticker } from "@/components/zine/Sticker";
import { TagList } from "@/components/zine/Tag";
import { ZineLinkButton } from "@/components/zine/ZineButton";
import { type ZinePaper, zineCardClass } from "@/components/zine/ZineCard";
import { formatTerm, truncate } from "@/lib/format";
import { getHomeData } from "@/server/queries/home";

const CARD_PAPERS: ZinePaper[] = ["butter", "mint", "sky", "pink"];
const CARD_TILTS = ["tilt-left", "tilt-right", "tilt-left", "tilt-right"];

const prompts = [
  {
    number: "01",
    title: "说清楚考核方式",
    body: "闭卷还是论文，平时分占多少，有没有实验和展示。比一句“给分好”更能帮到下一届。",
    paper: "butter" as ZinePaper,
  },
  {
    number: "02",
    title: "难度和作业量分开写",
    body: "难不等于作业多。把每周大概花多少时间写出来，别人更容易判断要不要选。",
    paper: "mint" as ZinePaper,
  },
  {
    number: "03",
    title: "只写自己的体验",
    body: "不写教师住址、电话和个人隐私，不做人身攻击。评价对事不对人，匿名不等于无责任。",
    paper: "sky" as ZinePaper,
  },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getHomeData();
  const featured = data.latestReviews[0];
  const leaderboardItems = data.leaderboard.items;

  return (
    <HeroMotion>
      <section className="shell hero">
        <div className="hero-copy">
          <span className="sticker-label hero-fade">2026 秋 · 匿名课程手账</span>
          <h1 className="display">
            <span className="line hero-line">
              <span>选课别开盲盒，</span>
            </span>
            <span className="line hero-line">
              <span>先翻翻大家的</span>
            </span>
            <span className="line hero-line">
              <span className="highlight">手账。</span>
            </span>
          </h1>
          <p className="hero-sub hero-fade">
            真实评价，匿名写下。把难度、作业量和考核方式摊开讲，帮下一届少踩一个坑。
          </p>
          <div className="hero-actions hero-fade">
            <ZineLinkButton href="/courses" variant="primary">
              翻课程
            </ZineLinkButton>
            <ZineLinkButton href="/write" variant="secondary">
              写一页
            </ZineLinkButton>
          </div>
          <div className="hero-meta hero-fade">
            <span>
              <strong>{data.stats.courseCount}</strong> 门课程
            </span>
            <span>
              <strong>{data.stats.reviewCount}</strong> 条评价
            </span>
            <span>
              <strong>{data.stats.instructorCount}</strong> 位教师
            </span>
          </div>
        </div>

        <div className="hero-collage">
          <div className="collage-tag collage-piece">匿名评价 · 不显示昵称</div>
          <figure className="collage-photo collage-piece tape-top">
            <Image
              src="/images/notebook-study.jpg"
              alt="有人在桌边写笔记，旁边放着咖啡"
              fill
              priority
              sizes="(max-width: 1024px) 90vw, 40vw"
            />
          </figure>
          <div className="collage-note collage-piece tape-top">
            <div className="collage-note-head">
              <span>{featured?.courseName ?? "从一条评价开始"}</span>
              <strong>{featured ? featured.review.recommendation.toFixed(1) : "5.0"}</strong>
            </div>
            <StarRating value={featured?.review.recommendation ?? 5} label="推荐度" size={14} />
            <p>
              {featured
                ? truncate(featured.review.content, 46)
                : "真实评价，匿名写下。先把第一条手账留在课程库里。"}
            </p>
            <span className="tiny mono">
              匿名同学 · {featured ? formatTerm(featured.termName) : "等待第一条评价"}
            </span>
          </div>
          <div className="collage-small collage-piece">
            <strong>难度 {featured ? featured.review.difficulty : "-"} / 5</strong>
            <span>作业量 {featured ? featured.review.workload : "-"} / 5</span>
          </div>
          <div className="collage-sticker collage-piece">
            <span>匿名</span>
            <small>ANONYMOUS</small>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="recent-title">
        <div className="shell">
          <div id="recent-title">
            <SectionTitle
              title="最近大家在聊"
              description="最新发布的匿名评价，先看几条再决定要不要翻完整课程库。"
              action={{ href: "/courses", label: "翻全部课程" }}
            />
          </div>

          {data.latestReviews.length === 0 ? (
            <EmptyState
              title="还没有评价"
              description="数据库里还没有已发布的评价。选一个班次，成为第一个写手账的人。"
              action={<ZineLinkButton href="/courses">去翻课程</ZineLinkButton>}
            />
          ) : (
            <div className="grid-4">
              {data.latestReviews.map((item, index) => (
                <article
                  key={item.review.id}
                  className={zineCardClass({
                    paper: CARD_PAPERS[index % CARD_PAPERS.length],
                    className: `review-card reveal ${CARD_TILTS[index % CARD_TILTS.length]}${
                      index % 2 === 0 ? " tape-top" : ""
                    }`,
                  })}
                >
                  <div className="review-card__head">
                    <div>
                      <h3 className="review-card__title">{item.courseName}</h3>
                      <span className="course-code">
                        {item.courseCode}
                        {item.instructorNames.length > 0
                          ? ` · ${item.instructorNames.join("、")}`
                          : ""}
                      </span>
                    </div>
                    <Sticker tone="sky">{formatTerm(item.termName)}</Sticker>
                  </div>
                  <div className="review-card__meta">
                    <span>匿名同学</span>
                    <span>推荐度 {item.review.recommendation}.0</span>
                  </div>
                  <p className="review-card__body">{truncate(item.review.content, 100)}</p>
                  <TagList tags={item.review.tags.map((tag) => tag.name)} />
                  <div className="review-card__foot">
                    <div className="score-pair">
                      <span>
                        难度 <strong>{item.review.difficulty}</strong>
                      </span>
                      <span>
                        作业 <strong>{item.review.workload}</strong>
                      </span>
                    </div>
                    <Link href={`/offerings/${item.review.offeringId}`} className="inline-link">
                      看班次
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="leaderboard-title">
        <div className="shell">
          <div id="leaderboard-title">
            <SectionTitle
              title="本周榜单"
              description="按推荐度排序，至少 5 条评价才参与排名。不是一条五星就能冲上第一。"
              action={{ href: "/leaderboards", label: "看完整榜单" }}
            />
          </div>

          {leaderboardItems.length === 0 ? (
            <EmptyState
              title="榜单还没有足够的数据"
              description="至少需要 5 条已发布评价才能进入榜单。先去写一条评价吧。"
              action={<ZineLinkButton href="/courses">去翻课程</ZineLinkButton>}
            />
          ) : (
            <div className="grid-2">
              <div className="leaderboard reveal">
                {leaderboardItems.map((item, index) => (
                  <div className="leader-row" key={item.courseId}>
                    <span className="leader-rank">{index + 1}</span>
                    <div className="leader-course">
                      <strong>
                        <Link href={`/courses/${item.courseId}`}>{item.courseName}</Link>
                      </strong>
                      <span>
                        {item.instructors.length > 0 ? `${item.instructors.join("、")} · ` : ""}
                        {item.count} 条评价
                      </span>
                    </div>
                    <div className="leader-score">
                      <strong>{item.score.toFixed(1)}</strong>
                      <span>/ 5</span>
                    </div>
                  </div>
                ))}
              </div>
              <div
                className={zineCardClass({
                  paper: "mint",
                  pad: true,
                  className: "rule-card reveal",
                })}
              >
                <Sticker tone="coral">榜单规则</Sticker>
                <h3>小样本不进榜</h3>
                <p>
                  榜单使用贝叶斯平均，避免一条极端高分把课程推到第一。选择学期后，只统计该学期班次的评价。
                </p>
                <p className="mono muted">score = (v / (v + m)) * R + (m / (v + m)) * C</p>
                <p className="mono muted">
                  当前 C = {data.leaderboard.globalAverage.toFixed(1)}，m = {data.leaderboard.m}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="write-title">
        <div className="shell">
          <div id="write-title">
            <SectionTitle
              title="写一页之前"
              description="三条足够具体的提示。匿名保护的是身份，不是内容责任。"
            />
          </div>
          <div className="grid-3">
            {prompts.map((prompt) => (
              <div
                key={prompt.number}
                className={zineCardClass({
                  paper: prompt.paper,
                  pad: true,
                  className: "prompt-card reveal",
                })}
              >
                <span className="prompt-number">{prompt.number}</span>
                <h3>{prompt.title}</h3>
                <p>{prompt.body}</p>
              </div>
            ))}
          </div>
          <div className="row section-action">
            <ZineLinkButton href="/write" variant="primary">
              去写一页
            </ZineLinkButton>
            <Link href="/about/rules" className="inline-link">
              先看评价规范
            </Link>
          </div>
        </div>
      </section>
    </HeroMotion>
  );
}
