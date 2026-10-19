import type { Metadata } from "next";
import { PageHead } from "@/components/zine/SectionTitle";
import { zineCardClass } from "@/components/zine/ZineCard";

export const metadata: Metadata = { title: "评价规范" };

export default function RulesPage() {
  return (
    <>
      <PageHead
        title="评价规范"
        description="匿名保护的是身份，不是内容责任。写之前请确认你愿意为这条评价负责。"
      />
      <section className="section section--tight">
        <div className="shell">
          <div className={zineCardClass({ pad: true, className: "prose" })}>
            <h2>可以写</h2>
            <ul>
              <li>课程内容、教学节奏、作业量和考核方式的真实体验。</li>
              <li>具体、可复现的建议，例如“每周实验大约 6 小时”。</li>
              <li>对课程安排和教学方法的批评，尽量对事不对人。</li>
            </ul>
            <h2>不要写</h2>
            <ul>
              <li>教师或其他同学的住址、电话、身份证号、家庭信息。</li>
              <li>人身攻击、侮辱、歧视和未经证实的指控。</li>
              <li>广告、引流、与课程无关的内容。</li>
            </ul>
            <h2>匿名说明</h2>
            <p>
              公开页面只显示“匿名同学”和学期。系统内部保留评价与账号的映射，用于一人一评、权限校验和违规处理。管理员默认没有查看评价作者的入口。
            </p>
            <h2>处理方式</h2>
            <p>
              违规评价可能被隐藏。同一用户对同一评价只能提交一条未处理举报。恶意举报会被限制，严重时暂停账号。
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
