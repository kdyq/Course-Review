import type { Metadata } from "next";
import { PageHead } from "@/components/zine/SectionTitle";
import { ZineLinkButton } from "@/components/zine/ZineButton";
import { zineCardClass } from "@/components/zine/ZineCard";

export const metadata: Metadata = { title: "写评价" };

export default function WritePage() {
  return (
    <>
      <PageHead
        title="写一页"
        description="先找到你要评价的开课班次，再填写难度、作业量、推荐度和文字评价。同一班次只能写一条。"
      />
      <section className="section section--tight">
        <div className="shell">
          <div className={zineCardClass({ paper: "butter", pad: true, className: "prose" })}>
            <h2>还没有选班次</h2>
            <p>
              评价对象是课程、学期和教师组成的开课班次。去课程库找到对应课程，进入班次详情后点“写评价”。
            </p>
            <div className="row section-action">
              <ZineLinkButton href="/courses">去翻课程</ZineLinkButton>
              <ZineLinkButton href="/" variant="secondary">
                回到首页
              </ZineLinkButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
