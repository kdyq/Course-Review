import Link from "next/link";
import { ReportActions } from "@/components/admin/ReportActions";
import { REPORT_REASON_LABELS, REPORT_STATUS_LABELS } from "@/lib/constants";
import { formatDateTime, truncate } from "@/lib/format";
import { getAdminReports } from "@/server/queries/admin";

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING", "REVIEWING", "RESOLVED", "REJECTED"] as const;

type PageProps = {
  searchParams: Promise<{ status?: string | string[] }>;
};

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const rawStatus = Array.isArray(query.status) ? query.status[0] : query.status;
  const status = STATUSES.includes(rawStatus as (typeof STATUSES)[number])
    ? (rawStatus as (typeof STATUSES)[number])
    : undefined;
  const reports = await getAdminReports(status);

  return (
    <>
      <h1 className="admin-title">举报处理</h1>

      <div className="tabs">
        <Link href="/admin/reports" className={`tab${status ? "" : " tab--active"}`}>
          全部
        </Link>
        {STATUSES.map((value) => (
          <Link
            key={value}
            href={`/admin/reports?status=${value}`}
            className={`tab${status === value ? " tab--active" : ""}`}
          >
            {REPORT_STATUS_LABELS[value]}
          </Link>
        ))}
      </div>

      <div className="table-wrap section-action">
        <table className="data-table">
          <thead>
            <tr>
              <th>课程 / 班次</th>
              <th>评价内容</th>
              <th>原因</th>
              <th>补充说明</th>
              <th>状态</th>
              <th>时间</th>
              <th>处理</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>
                  {report.courseCode}
                  <br />
                  <span className="muted">
                    {report.courseName} · {report.termName}
                  </span>
                </td>
                <td>{truncate(report.reviewContent, 100)}</td>
                <td>{REPORT_REASON_LABELS[report.reason] ?? report.reason}</td>
                <td>{report.detail ?? "-"}</td>
                <td>
                  {REPORT_STATUS_LABELS[report.status] ?? report.status}
                  {report.resolutionNote ? (
                    <p className="muted">备注：{report.resolutionNote}</p>
                  ) : null}
                </td>
                <td>{formatDateTime(report.createdAt)}</td>
                <td>
                  <ReportActions reportId={report.id} status={report.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {reports.length === 0 ? <p className="muted">当前筛选下没有举报。</p> : null}
    </>
  );
}
