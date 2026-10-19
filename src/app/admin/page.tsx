import { ReviewStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [courseCount, reviewCount, userCount, pendingReviews, pendingReports] = await Promise.all([
    prisma.course.count(),
    prisma.review.count({ where: { status: ReviewStatus.PUBLISHED } }),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.review.count({ where: { status: ReviewStatus.PENDING } }),
    prisma.report.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <>
      <h1 className="admin-title">数据概览</h1>
      <div className="stat-row">
        <div className="stat">
          <span>课程</span>
          <strong>{courseCount}</strong>
        </div>
        <div className="stat">
          <span>已发布评价</span>
          <strong>{reviewCount}</strong>
        </div>
        <div className="stat">
          <span>活跃用户</span>
          <strong>{userCount}</strong>
        </div>
      </div>

      <div className="stat-row section-action">
        <div className="stat">
          <span>待审核评价</span>
          <strong>{pendingReviews}</strong>
        </div>
        <div className="stat">
          <span>待处理举报</span>
          <strong>{pendingReports}</strong>
        </div>
        <div className="stat">
          <span>数据库</span>
          <strong>在线</strong>
        </div>
      </div>

      <div className="empty-state section-action">
        <h2>后台操作会在 M5 补齐</h2>
        <p>课程与班次 CRUD、CSV 导入、评价审核、举报处理、用户管理和审计日志将在 M5 接入。</p>
      </div>
    </>
  );
}
