import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { PageHead } from "@/components/zine/SectionTitle";
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
        <div className="shell auth-grid">
          <div className={zineCardClass({ pad: true })}>
            <RegisterForm />
          </div>
          <div className={zineCardClass({ paper: "mint", pad: true, className: "prose" })}>
            <h2>注册前知道这些</h2>
            <p>公开页面只显示“匿名同学”，不会显示你的用户名或邮箱。</p>
            <p>同一用户对同一开课班次只能写一条评价。重修不同学期可以再写。</p>
            <p>本地开发默认不强制邮箱验证，验证码写入服务端日志，不会真实发信。</p>
          </div>
        </div>
      </section>
    </>
  );
}
