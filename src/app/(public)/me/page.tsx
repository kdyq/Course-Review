import type { Metadata } from "next";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";
import { PageHead } from "@/components/zine/SectionTitle";
import { ZineLinkButton } from "@/components/zine/ZineButton";
import { zineCardClass } from "@/components/zine/ZineCard";
import { ROLE_LABELS } from "@/lib/constants";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "我的" };

export default async function MePage() {
  const session = await requireUser();
  const user = session.user as {
    username?: string | null;
    name?: string;
    role?: string | null;
    email?: string;
    emailVerified?: boolean;
  };

  return (
    <>
      <PageHead title="我的" description="账号信息和个人内容入口。" />
      <section className="section section--tight">
        <div className="shell grid-2">
          <div className={zineCardClass({ paper: "mint", pad: true, className: "prose" })}>
            <h2>你好，{user.username ?? user.name}</h2>
            <p>角色：{ROLE_LABELS[user.role ?? "STUDENT"] ?? "学生"}</p>
            <p>邮箱：{user.email}</p>
            <p>在这里管理账号信息和邮箱验证。</p>
            <div className="row section-action">
              <ZineLinkButton href="/me/reviews">我的评价</ZineLinkButton>
              <ZineLinkButton href="/courses" variant="secondary">
                去翻课程
              </ZineLinkButton>
              <ZineLinkButton href="/leaderboards" variant="secondary">
                看榜单
              </ZineLinkButton>
            </div>
          </div>

          <div className={zineCardClass({ paper: "sky", pad: true })}>
            <h2 className="review-card__title">邮箱验证</h2>
            <VerifyEmailForm email={user.email ?? ""} verified={Boolean(user.emailVerified)} />
          </div>
        </div>
      </section>
    </>
  );
}
