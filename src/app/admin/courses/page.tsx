import Link from "next/link";
import { CourseForm } from "@/components/admin/CourseForm";
import { ImportWizard } from "@/components/admin/ImportWizard";
import { zineCardClass } from "@/components/zine/ZineCard";
import { courseTypeLabel, formatDate } from "@/lib/format";
import { getAdminCollegeNames, getAdminCourses } from "@/server/queries/admin";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const [courses, colleges] = await Promise.all([getAdminCourses(), getAdminCollegeNames()]);

  return (
    <>
      <h1 className="admin-title">课程管理</h1>

      <div className="grid-2">
        <div className={zineCardClass({ pad: true })}>
          <h2>新建课程</h2>
          <CourseForm colleges={colleges} />
        </div>
        <div className={zineCardClass({ pad: true })}>
          <h2>CSV 导入</h2>
          <ImportWizard />
        </div>
      </div>

      <h2 className="admin-title section-action">课程列表</h2>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>代码</th>
              <th>课程名</th>
              <th>学院</th>
              <th>类型</th>
              <th>学分</th>
              <th>班次</th>
              <th>评价</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td className="mono">{course.code}</td>
                <td>{course.name}</td>
                <td>{course.collegeName ?? "-"}</td>
                <td>{courseTypeLabel(course.type)}</td>
                <td>{course.credits ?? "-"}</td>
                <td>{course.offeringCount}</td>
                <td>{course.reviewCount}</td>
                <td>{formatDate(course.updatedAt)}</td>
                <td>
                  <Link href={`/admin/courses/${course.id}`} className="btn btn-sm btn-secondary">
                    编辑
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {courses.length === 0 ? <p className="muted">还没有课程。</p> : null}
    </>
  );
}
