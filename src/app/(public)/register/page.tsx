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
        <div className="shell">
          <div className="auth-card">
            <div className={zineCardClass({ pad: true })}>
              <RegisterForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
