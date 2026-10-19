import { formatDateTime, truncate } from "@/lib/format";
import { getAdminAuditLogs } from "@/server/queries/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    action?: string | string[];
    targetType?: string | string[];
  }>;
};

export default async function AdminAuditPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const action = (Array.isArray(query.action) ? query.action[0] : query.action) ?? "";
  const targetType =
    (Array.isArray(query.targetType) ? query.targetType[0] : query.targetType) ?? "";
  const logs = await getAdminAuditLogs({
    action: action || undefined,
    targetType: targetType || undefined,
  });

  return (
    <>
      <h1 className="admin-title">审计日志</h1>
      <p className="muted">审计日志只记录操作、目标 ID 和必要元数据，不记录评价正文和用户邮箱。</p>

      <form action="/admin/audit" method="get" className="row section-action">
        <label className="filter-label" htmlFor="audit-action">
          动作
        </label>
        <input
          id="audit-action"
          className="input"
          name="action"
          defaultValue={action}
          placeholder="例如 REVIEW_HIDE"
        />
        <label className="filter-label" htmlFor="audit-target">
          目标类型
        </label>
        <input
          id="audit-target"
          className="input"
          name="targetType"
          defaultValue={targetType}
          placeholder="例如 Review"
        />
        <button type="submit" className="btn btn-sm btn-secondary">
          筛选
        </button>
        <a href="/admin/audit" className="inline-link">
          清除
        </a>
      </form>

      <div className="table-wrap section-action">
        <table className="data-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>操作人</th>
              <th>动作</th>
              <th>目标</th>
              <th>元数据</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{formatDateTime(log.createdAt)}</td>
                <td>{log.actorUsername ?? "系统"}</td>
                <td>{log.action}</td>
                <td>
                  {log.targetType}
                  {log.targetId ? ` · ${log.targetId}` : ""}
                </td>
                <td className="mono">
                  {log.metadata ? truncate(JSON.stringify(log.metadata), 160) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {logs.length === 0 ? <p className="muted">当前筛选下没有日志。</p> : null}
    </>
  );
}
