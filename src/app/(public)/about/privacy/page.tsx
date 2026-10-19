import type { Metadata } from "next";
import { PageHead } from "@/components/zine/SectionTitle";
import { zineCardClass } from "@/components/zine/ZineCard";

export const metadata: Metadata = { title: "隐私说明" };

export default function PrivacyPage() {
  return (
    <>
      <PageHead
        title="隐私说明"
        description="这是本地开发版本，不对外提供服务。以下说明描述系统的设计意图。"
      />
      <section className="section section--tight">
        <div className="shell">
          <div className={zineCardClass({ pad: true, className: "prose" })}>
            <h2>收集什么</h2>
            <p>
              注册时收集用户名、邮箱和密码哈希。写评价时收集评分、考核方式、标签和正文。系统不记录设备、IP、浏览器和地理位置到公开页面。
            </p>
            <h2>如何保护匿名</h2>
            <p>
              评价正文和作者映射分表存储。公开查询只使用显式字段白名单，不返回作者字段。少于 5
              条评价时不显示平均分和分布，降低反推身份的可能。
            </p>
            <h2>保留多久</h2>
            <p>
              账号注销时删除作者映射，保留评价正文。举报和处理记录用于治理和审计。本地开发数据可随时重置。
            </p>
            <h2>联系方式</h2>
            <p>本地项目不设公开联系方式。正式对外运营前需要补充用户协议、隐私政策和申诉渠道。</p>
          </div>
        </div>
      </section>
    </>
  );
}
