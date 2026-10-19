"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { resolveReportAction } from "@/server/actions/admin";

type ActionStatus = "REVIEWING" | "RESOLVED" | "REJECTED";

export function ReportActions({ reportId, status }: { reportId: string; status: string }) {
  const router = useRouter();
  const [nextStatus, setNextStatus] = useState<ActionStatus>(
    status === "RESOLVED" || status === "REJECTED" ? status : "REVIEWING",
  );
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const result = await resolveReportAction({
        reportId,
        status: nextStatus,
        note: note.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setMessage("处理状态已更新");
      router.refresh();
    } catch {
      setError("处理失败，请稍后再试");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="stack-sm" onSubmit={handleSubmit}>
      <div className="row">
        <select
          className="select select--inline"
          value={nextStatus}
          onChange={(event) => setNextStatus(event.target.value as ActionStatus)}
          aria-label="举报处理状态"
        >
          <option value="REVIEWING">处理中</option>
          <option value="RESOLVED">已解决</option>
          <option value="REJECTED">已驳回</option>
        </select>
        <button type="submit" className="btn btn-sm btn-primary" disabled={pending}>
          {pending ? "保存中..." : "更新"}
        </button>
      </div>
      <input
        className="input"
        placeholder="处理备注（可选）"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={500}
      />
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
    </form>
  );
}
