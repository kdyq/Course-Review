import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { getAdminDashboard } from "@/server/queries/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const data = await getAdminDashboard();

  return (
    <>
      <h1 className="admin-title">数据概览</h1>

      <div className="stat-row">
        <div className="stat">
          <span>今日新增评价</span>
          <strong>{data.todayReviews}</strong>
        </div>
        <div className="stat">
          <span>待审核评价</span>
          <strong>{data.pendingReviews}</strong>
        </div>
        <div className="stat">
          <span>待处理举报</span>
          <strong>{data.pendingReports}</strong>
        </div>
      </div>

      <div className="stat-row section-action">
        <div className="stat">
          <span>课程</span>
          <strong>{data.courseCount}</strong>
        </div>
        <div className="stat">
          <span>评价</span>
          <strong>{data.reviewCount}</strong>
        </div>
        <div className="stat">
          <span>用户</span>
          <strong>{data.userCount}</strong>
        </div>
      </div>

      <div className="row section-action">
        <Link href="/admin/reviews" className="btn btn-sm btn-secondary">
          去审核评价
        </Link>
        <Link href="/admin/reports" className="btn btn-sm btn-secondary">
          去处理举报
        </Link>
        <Link href="/admin/courses" className="btn btn-sm btn-secondary">
          管理课程
        </Link>
        <Link href="/admin/audit" className="btn btn-sm btn-secondary">
          查看审计日志
        </Link>
      </div>

      <div className="section-action">
        <h2 className="admin-title">最近操作</h2>
        {data.recentAudit.length === 0 ? (
          <p className="muted">还没有审计记录。</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>操作人</th>
                  <th>动作</th>
                  <th>目标</th>
                </tr>
              </thead>
              <tbody>
                {data.recentAudit.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDateTime(log.createdAt)}</td>
                    <td>{log.actorUsername ?? "系统"}</td>
                    <td>{log.action}</td>
                    <td>
                      {log.targetType}
                      {log.targetId ? ` · ${log.targetId.slice(0, 8)}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
