import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { PageHead } from "@/components/zine/SectionTitle";
import { zineCardClass } from "@/components/zine/ZineCard";

export const metadata: Metadata = { title: "登录" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") ? params.next : "/";

  return (
    <>
      <PageHead title="登录" description="用用户名和密码登录。登录后可以写评价、点有用和举报。" />
      <section className="section section--tight">
        <div className="shell">
          <div className="auth-card">
            <div className={zineCardClass({ pad: true })}>
              {params.error === "suspended" ? (
                <p className="form-error" role="alert">
                  账号已被停用，请联系管理员。
                </p>
              ) : null}
              <LoginForm next={next} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
