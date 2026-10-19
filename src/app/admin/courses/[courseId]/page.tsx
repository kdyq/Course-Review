import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmActionButton } from "@/components/admin/ConfirmActionButton";
import { CourseForm } from "@/components/admin/CourseForm";
import { OfferingForm } from "@/components/admin/OfferingForm";
import { zineCardClass } from "@/components/zine/ZineCard";
import { deleteCourseAction, deleteOfferingAction } from "@/server/actions/admin";
import {
  getAdminCollegeNames,
  getAdminCourseDetail,
  getAdminTermNames,
} from "@/server/queries/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function AdminCourseDetailPage({ params }: PageProps) {
  const { courseId } = await params;
  const [course, colleges, terms] = await Promise.all([
    getAdminCourseDetail(courseId),
    getAdminCollegeNames(),
    getAdminTermNames(),
  ]);

  if (!course) {
    notFound();
  }

  return (
    <>
      <div className="row-between">
        <h1 className="admin-title">
          {course.code} · {course.name}
        </h1>
        <Link href="/admin/courses" className="btn btn-sm btn-secondary">
          返回课程列表
        </Link>
      </div>

      <div className={zineCardClass({ pad: true })}>
        <h2>课程信息</h2>
        <CourseForm
          colleges={colleges}
          initial={{
            id: course.id,
            code: course.code,
            name: course.name,
            credits: course.credits,
            type: course.type,
            college: course.college,
            description: course.description,
          }}
        />
        <div className="row section-action">
          <ConfirmActionButton
            label="删除课程"
            title="删除这门课程？"
            description="只有没有班次的课程可以删除。删除操作会写入审计日志。"
            confirmLabel="确认删除课程"
            onConfirm={deleteCourseAction.bind(null, course.id)}
            disabled={course.offerings.length > 0}
            disabledReason="先删除这门课下的班次"
          />
        </div>
      </div>

      <h2 className="admin-title section-action">开课班次</h2>

      <div className={zineCardClass({ pad: true })}>
        <h2>新增班次</h2>
        <OfferingForm courseId={course.id} terms={terms} />
      </div>

      <div className="stack section-action">
        {course.offerings.length === 0 ? (
          <p className="muted">这门课还没有班次。</p>
        ) : (
          course.offerings.map((offering) => (
            <details key={offering.id} className={zineCardClass({ pad: true })}>
              <summary className="row-between">
                <span>
                  <strong>
                    {offering.termName} · {offering.section} 班
                  </strong>
                  <span className="muted mono">
                    {" "}
                    · {offering.instructors.join("、") || "教师待定"} · {offering.reviewCount}{" "}
                    条评价
                  </span>
                </span>
                <span className="muted mono">展开编辑</span>
              </summary>
              <div className="section-action">
                <OfferingForm
                  courseId={course.id}
                  terms={terms}
                  initial={{
                    id: offering.id,
                    termName: offering.termName,
                    section: offering.section,
                    campus: offering.campus,
                    instructors: offering.instructors,
                  }}
                />
                <div className="row section-action">
                  <Link href={`/offerings/${offering.id}`} className="btn btn-sm btn-secondary">
                    看前台页面
                  </Link>
                  <ConfirmActionButton
                    label="删除班次"
                    title="删除这个班次？"
                    description="只有没有评价的班次可以删除。删除操作会写入审计日志。"
                    confirmLabel="确认删除班次"
                    onConfirm={deleteOfferingAction.bind(null, offering.id)}
                    disabled={offering.reviewCount > 0}
                    disabledReason="先处理这个班次下的评价"
                  />
                </div>
              </div>
            </details>
          ))
        )}
      </div>
    </>
  );
}
