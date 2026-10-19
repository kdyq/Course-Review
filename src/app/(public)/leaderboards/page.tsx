import type { Metadata } from "next";
import { EmptyState } from "@/components/zine/EmptyState";
import { PageHead } from "@/components/zine/SectionTitle";
import { ZineLinkButton } from "@/components/zine/ZineButton";

export const metadata: Metadata = { title: "排行榜" };

export default function LeaderboardsPage() {
  return (
    <>
      <PageHead
        title="本周榜单"
        description="按推荐度、难度和作业量查看课程。至少 5 条评价才参与排名，使用贝叶斯平均。"
      />
      <section className="section section--tight">
        <div className="shell">
          <EmptyState
            title="榜单还没有数据"
            description="M4 会接入真实聚合和维度切换。现在可以先在首页查看榜单的视觉样式。"
            action={<ZineLinkButton href="/">回到首页</ZineLinkButton>}
          />
        </div>
      </section>
    </>
  );
}
