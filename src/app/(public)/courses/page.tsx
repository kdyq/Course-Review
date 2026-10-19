import type { Metadata } from "next";
import { CourseCard } from "@/components/course/CourseCard";
import { FilterPills } from "@/components/course/FilterPills";
import { Pagination } from "@/components/course/Pagination";
import { SortSelect } from "@/components/course/SortSelect";
import { EmptyState } from "@/components/zine/EmptyState";
import { SearchInput } from "@/components/zine/SearchInput";
import { PageHead } from "@/components/zine/SectionTitle";
import { ZineLinkButton } from "@/components/zine/ZineButton";
import { COURSE_TYPE_LABELS } from "@/lib/constants";
import { formatTerm } from "@/lib/format";
import { parseCourseListParams, type RawSearchParams, toQueryRecord } from "@/lib/search-params";
import { getCourseFilterOptions, searchCourses } from "@/server/queries/courses";

export const metadata: Metadata = { title: "课程库" };
export const dynamic = "force-dynamic";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const raw = await searchParams;
  const params = parseCourseListParams(raw);
  const [filterOptions, result] = await Promise.all([
    getCourseFilterOptions(),
    searchCourses(params),
  ]);
  const queryRecord = toQueryRecord(params);

  return (
    <>
      <PageHead
        title="翻课程"
        description="按课程名、教师或课程代码搜索。筛选条件会写进地址栏，方便刷新和分享。"
      >
        <div className="mt-20">
          <SearchInput
            defaultValue={params.q}
            hiddenParams={{
              college: params.college,
              type: params.type,
              term: params.term,
            }}
          />
        </div>
      </PageHead>

      <section className="section section--tight">
        <div className="shell stack">
          <div className="filter-bar">
            <FilterPills
              label="学院"
              param="college"
              options={filterOptions.colleges.map((name) => ({
                label: name,
                value: name,
              }))}
              currentValue={params.college}
              baseParams={queryRecord}
            />
            <FilterPills
              label="类型"
              param="type"
              options={Object.entries(COURSE_TYPE_LABELS).map(([value, label]) => ({
                label,
                value,
              }))}
              currentValue={params.type}
              baseParams={queryRecord}
            />
            <FilterPills
              label="学期"
              param="term"
              options={filterOptions.terms.map((term) => ({
                label: formatTerm(term),
                value: term,
              }))}
              currentValue={params.term}
              baseParams={queryRecord}
            />
          </div>

          <div className="row-between">
            <p className="muted mono">
              {params.q ? `“${params.q}” · ` : ""}共 {result.total} 门课程
            </p>
            <SortSelect
              current={params.sort}
              baseParams={queryRecord}
              hasQuery={Boolean(params.q)}
            />
          </div>

          {result.items.length === 0 ? (
            <EmptyState
              title="没有找到课程"
              description="换一个关键词，或者清除筛选后再试。也可以只输入课程代码的一部分。"
              action={<ZineLinkButton href="/courses">清除筛选</ZineLinkButton>}
            />
          ) : (
            <>
              <div className="course-grid">
                {result.items.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                baseParams={queryRecord}
              />
            </>
          )}
        </div>
      </section>
    </>
  );
}
