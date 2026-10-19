"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { type FormEvent, useState } from "react";
import {
  REPORT_REASON_LABELS,
  REPORT_REASON_VALUES,
  type ReportReasonValue,
} from "@/lib/constants";
import { createReportAction } from "@/server/actions/report";

export function ReportDialog({
  reviewId,
  disabled = false,
  disabledReason,
}: {
  reviewId: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReasonValue>("PRIVACY");
  const [detail, setDetail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(null);
      setSuccess(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await createReportAction({
        reviewId,
        reason,
        detail: detail.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setSuccess(true);
      setDetail("");
    } catch {
      setError("举报提交失败，请稍后再试");
    } finally {
      setPending(false);
    }
  }

  if (disabled) {
    return (
      <button type="button" className="btn btn-sm btn-ghost" disabled title={disabledReason}>
        举报
      </button>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button type="button" className="btn btn-sm btn-ghost">
          举报
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title className="dialog-title">举报这条评价</Dialog.Title>
          <Dialog.Description className="dialog-description">
            举报会进入后台队列。同一用户对同一评价只能有一条未处理举报。
          </Dialog.Description>

          {success ? (
            <div className="stack">
              <p className="form-message" role="status">
                举报已提交，管理员会尽快处理。
              </p>
              <Dialog.Close asChild>
                <button type="button" className="btn btn-primary">
                  关闭
                </button>
              </Dialog.Close>
            </div>
          ) : (
            <form className="stack" onSubmit={handleSubmit}>
              <div className="field">
                <label className="label" htmlFor={`report-reason-${reviewId}`}>
                  举报原因
                </label>
                <select
                  id={`report-reason-${reviewId}`}
                  className="select"
                  value={reason}
                  onChange={(event) => setReason(event.target.value as ReportReasonValue)}
                >
                  {REPORT_REASON_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {REPORT_REASON_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label" htmlFor={`report-detail-${reviewId}`}>
                  补充说明 <span>（可选）</span>
                </label>
                <textarea
                  id={`report-detail-${reviewId}`}
                  className="textarea"
                  maxLength={500}
                  value={detail}
                  onChange={(event) => setDetail(event.target.value)}
                />
                <span className="form-hint">最多 500 个字符。不要在里面重复个人隐私。</span>
              </div>

              {error ? (
                <p className="form-error" role="alert" aria-live="polite">
                  {error}
                </p>
              ) : null}

              <div className="row">
                <button type="submit" className="btn btn-danger" disabled={pending}>
                  {pending ? "提交中..." : "提交举报"}
                </button>
                <Dialog.Close asChild>
                  <button type="button" className="btn btn-secondary">
                    取消
                  </button>
                </Dialog.Close>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
