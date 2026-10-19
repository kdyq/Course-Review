import type { Metadata } from "next";
import { EmptyState } from "@/components/zine/EmptyState";
import { SearchInput } from "@/components/zine/SearchInput";
import { PageHead } from "@/components/zine/SectionTitle";
import { ZineLinkButton } from "@/components/zine/ZineButton";

export const metadata: Metadata = { title: "课程库" };

export default function CoursesPage() {
  return (
    <>
      <PageHead
        title="翻课程"
        description="按课程名、教师或课程代码搜索。筛选条件会写进地址栏，方便刷新和分享。"
      >
        <div className="mt-20">
          <SearchInput />
        </div>
      </PageHead>
      <section className="section section--tight">
        <div className="shell">
          <EmptyState
            title="课程库正在搬进来"
            description="数据库、课程和班次数据会在 M1 与 M2 接入。现在可以先回到首页看看视觉和交互。"
            action={<ZineLinkButton href="/">回到首页</ZineLinkButton>}
          />
        </div>
      </section>
    </>
  );
}
