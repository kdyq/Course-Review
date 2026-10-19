import { UserActions } from "@/components/admin/UserActions";
import { ROLE_LABELS, USER_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { getSession } from "@/lib/session";
import { getAdminUsers } from "@/server/queries/admin";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [users, session] = await Promise.all([getAdminUsers(), getSession()]);
  const currentUserId = session?.user?.id;

  return (
    <>
      <h1 className="admin-title">用户管理</h1>
      <p className="muted">
        管理员可以看到账号信息，但没有查看评价作者的入口。角色和封禁操作会写入审计日志。
      </p>

      <div className="table-wrap section-action">
        <table className="data-table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>姓名</th>
              <th>邮箱</th>
              <th>角色</th>
              <th>状态</th>
              <th>注册时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="mono">{user.username ?? "-"}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{ROLE_LABELS[user.role] ?? user.role}</td>
                <td>{USER_STATUS_LABELS[user.status] ?? user.status}</td>
                <td>{formatDate(user.createdAt)}</td>
                <td>
                  <UserActions
                    userId={user.id}
                    role={user.role}
                    status={user.status}
                    isSelf={user.id === currentUserId}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 ? <p className="muted">还没有用户。</p> : null}
    </>
  );
}
