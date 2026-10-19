import type { Metadata } from "next";
import { PageHead } from "@/components/zine/SectionTitle";
import { ZineLinkButton } from "@/components/zine/ZineButton";
import { zineCardClass } from "@/components/zine/ZineCard";

export const metadata: Metadata = { title: "注册" };

export default function RegisterPage() {
  return (
    <>
      <PageHead
        title="注册"
        description="用户名只允许字母和数字，至少 5 位；密码只允许字母、数字、@ 和 _，至少 6 位。"
      />
      <section className="section section--tight">
        <div className="shell">
          <div className={zineCardClass({ paper: "mint", pad: true, className: "prose" })}>
            <h2>注册表单正在准备</h2>
            <p>M1 会接入用户名注册、密码校验和邮箱验证码。</p>
            <ZineLinkButton href="/">回到首页</ZineLinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
