import Image from "next/image";
import Link from "next/link";
import { HeroMotion } from "@/components/home/HeroMotion";
import { SectionTitle } from "@/components/zine/SectionTitle";
import { StarRating } from "@/components/zine/StarRating";
import { Sticker } from "@/components/zine/Sticker";
import { TagList } from "@/components/zine/Tag";
import { ZineLinkButton } from "@/components/zine/ZineButton";
import { type ZinePaper, zineCardClass } from "@/components/zine/ZineCard";
import { formatTerm } from "@/lib/format";

type DemoReview = {
  id: string;
  course: string;
  code: string;
  teacher: string;
  term: string;
  recommendation: number;
  difficulty: number;
  workload: number;
  excerpt: string;
  tags: string[];
  paper: ZinePaper;
  tilt: string;
  tape: boolean;
};

const recentReviews: DemoReview[] = [
  {
    id: "r1",
    course: "操作系统",
    code: "CS301",
    teacher: "王砚秋",
    term: "2026-2027-1",
    recommendation: 5,
    difficulty: 4,
    workload: 4,
    excerpt:
      "实验多，但每次都有明确的检查点。讲进程调度那几周会留出时间答疑，期末闭卷，平时分给得实在。",
    tags: ["干货多", "实验多"],
    paper: "butter",
    tilt: "tilt-left",
    tape: true,
  },
  {
    id: "r2",
    course: "微观经济学",
    code: "ECON204",
    teacher: "周明远",
    term: "2026-2027-1",
    recommendation: 4,
    difficulty: 3,
    workload: 2,
    excerpt:
      "板书推导很多，跟得上就很顺。作业每周一次，量不大。考试会给计算题清单，复习方向比较明确。",
    tags: ["不点名", "给分好"],
    paper: "mint",
    tilt: "tilt-right",
    tape: false,
  },
  {
    id: "r3",
    course: "中国现代文学",
    code: "LIT118",
    teacher: "陈嘉禾",
    term: "2026-2027-1",
    recommendation: 5,
    difficulty: 2,
    workload: 3,
    excerpt:
      "每周读一篇作品，课上讨论。论文题目可以自己选，老师会给很细的修改意见。适合愿意开口的人。",
    tags: ["讨论多", "论文多"],
    paper: "sky",
    tilt: "tilt-left",
    tape: true,
  },
  {
    id: "r4",
    course: "数据结构",
    code: "CS202",
    teacher: "林知夏",
    term: "2026-2027-1",
    recommendation: 4,
    difficulty: 4,
    workload: 4,
    excerpt: "上机题和课堂内容贴得很紧，写完整套实验会对递归和树理解更深。不建议零基础直接冲。",
    tags: ["硬核", "作业多"],
    paper: "pink",
    tilt: "tilt-right",
    tape: false,
  },
];

const leaderboard = [
  { course: "操作系统", teacher: "王砚秋", score: "4.8", count: 18 },
  { course: "数据结构", teacher: "林知夏", score: "4.7", count: 24 },
  { course: "社会学概论", teacher: "赵行舟", score: "4.6", count: 9 },
  { course: "中国现代文学", teacher: "陈嘉禾", score: "4.5", count: 12 },
  { course: "微观经济学", teacher: "周明远", score: "4.4", count: 15 },
];

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

export default function HomePage() {
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
              <strong>26</strong> 门课程
            </span>
            <span>
              <strong>184</strong> 条评价
            </span>
            <span>
              <strong>10</strong> 位教师
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
              <span>操作系统</span>
              <strong>4.8</strong>
            </div>
            <StarRating value={4.8} label="推荐度" size={14} />
            <p>实验多，但讲得清楚。期末闭卷，平时分给得实在。</p>
            <span className="tiny mono">匿名同学 · 2026 秋</span>
          </div>
          <div className="collage-small collage-piece">
            <strong>作业量 4.2 / 5</strong>
            <span>每周一次实验报告</span>
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
          <div className="grid-4">
            {recentReviews.map((review) => (
              <article
                key={review.id}
                className={zineCardClass({
                  paper: review.paper,
                  className: `review-card reveal ${review.tilt}${review.tape ? " tape-top" : ""}`,
                })}
              >
                <div className="review-card__head">
                  <div>
                    <h3 className="review-card__title">{review.course}</h3>
                    <span className="course-code">
                      {review.code} · {review.teacher}
                    </span>
                  </div>
                  <Sticker tone="sky">{formatTerm(review.term)}</Sticker>
                </div>
                <div className="review-card__meta">
                  <span>匿名同学</span>
                  <span>推荐度 {review.recommendation}.0</span>
                </div>
                <p className="review-card__body">{review.excerpt}</p>
                <TagList tags={review.tags} />
                <div className="review-card__foot">
                  <div className="score-pair">
                    <span>
                      难度 <strong>{review.difficulty}.0</strong>
                    </span>
                    <span>
                      作业 <strong>{review.workload}.0</strong>
                    </span>
                  </div>
                  <Link href="/courses" className="inline-link">
                    看班次
                  </Link>
                </div>
              </article>
            ))}
          </div>
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
          <div className="grid-2">
            <div className="leaderboard reveal">
              {leaderboard.map((item, index) => (
                <div className="leader-row" key={item.course}>
                  <span className="leader-rank">{index + 1}</span>
                  <div className="leader-course">
                    <strong>{item.course}</strong>
                    <span>
                      {item.teacher} · {item.count} 条评价
                    </span>
                  </div>
                  <div className="leader-score">
                    <strong>{item.score}</strong>
                    <span>/ 5</span>
                  </div>
                </div>
              ))}
            </div>
            <div
              className={zineCardClass({ paper: "mint", pad: true, className: "rule-card reveal" })}
            >
              <Sticker tone="coral">榜单规则</Sticker>
              <h3>小样本不进榜</h3>
              <p>
                榜单使用贝叶斯平均，避免一条极端高分把课程推到第一。选择学期后，只统计该学期班次的评价。
              </p>
              <p className="mono muted">score = (v / (v + m)) * R + (m / (v + m)) * C</p>
            </div>
          </div>
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
