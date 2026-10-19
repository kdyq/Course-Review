import type { Metadata } from "next";
import { PageHead } from "@/components/zine/SectionTitle";
import { ZineLinkButton } from "@/components/zine/ZineButton";
import { zineCardClass } from "@/components/zine/ZineCard";

export const metadata: Metadata = { title: "登录" };

export default function LoginPage() {
  return (
    <>
      <PageHead title="登录" description="用用户名和密码登录。正式表单会在 M1 接入。" />
      <section className="section section--tight">
        <div className="shell">
          <div className={zineCardClass({ paper: "sky", pad: true, className: "prose" })}>
            <h2>认证正在准备</h2>
            <p>M1 会接入 Better Auth、用户名登录和邮箱验证码服务。</p>
            <ZineLinkButton href="/">回到首页</ZineLinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
