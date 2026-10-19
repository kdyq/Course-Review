"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setUserRoleAction, setUserStatusAction } from "@/server/actions/admin";

export function UserActions({
  userId,
  role,
  status,
  isSelf,
}: {
  userId: string;
  role: string;
  status: string;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [nextRole, setNextRole] = useState(role);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: () => Promise<{ ok: boolean; error?: { message: string } }>) {
    if (isSelf) {
      setError("不能修改自己的角色或状态");
      return;
    }
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const result = await action();
      if (!result.ok) {
        setError(result.error?.message ?? "操作失败");
        return;
      }
      setMessage("已更新");
      setReason("");
      router.refresh();
    } catch {
      setError("操作失败，请稍后再试");
    } finally {
      setPending(false);
    }
  }

  async function handleRole() {
    await run(() => setUserRoleAction({ userId, role: nextRole as "STUDENT" | "ADMIN" }));
  }

  async function handleStatus() {
    if (!reason.trim()) {
      setError("请填写操作原因");
      return;
    }
    const nextStatus = status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    await run(() =>
      setUserStatusAction({
        userId,
        status: nextStatus,
        reason: reason.trim(),
      }),
    );
  }

  if (isSelf) {
    return <span className="sample-badge">当前登录账号</span>;
  }

  return (
    <div className="stack-sm">
      <div className="row">
        <select
          className="select select--inline"
          value={nextRole}
          onChange={(event) => setNextRole(event.target.value)}
          aria-label="用户角色"
        >
          <option value="STUDENT">学生</option>
          <option value="ADMIN">管理员</option>
        </select>
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={handleRole}
          disabled={pending || nextRole === role}
        >
          保存角色
        </button>
      </div>
      <div className="row">
        <input
          className="input"
          placeholder="操作原因"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={200}
        />
        <button
          type="button"
          className={`btn btn-sm ${status === "SUSPENDED" ? "btn-primary" : "btn-danger"}`}
          onClick={handleStatus}
          disabled={pending}
        >
          {status === "SUSPENDED" ? "解封" : "封禁"}
        </button>
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="form-message" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
