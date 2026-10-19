import type { Metadata } from "next";
import { EmptyState } from "@/components/zine/EmptyState";
import { PageHead } from "@/components/zine/SectionTitle";
import { ZineLinkButton } from "@/components/zine/ZineButton";

export const metadata: Metadata = { title: "个人中心" };

export default function MePage() {
  return (
    <>
      <PageHead title="我的" description="我的评价、收藏和通知。需要登录后才能查看。" />
      <section className="section section--tight">
        <div className="shell">
          <EmptyState
            title="登录后查看"
            description="认证和个人中心会在 M1 与 M3 接入。现在可以先注册或登录。"
            action={
              <div className="row">
                <ZineLinkButton href="/login">登录</ZineLinkButton>
                <ZineLinkButton href="/register" variant="secondary">
                  注册
                </ZineLinkButton>
              </div>
            }
          />
        </div>
      </section>
    </>
  );
}
