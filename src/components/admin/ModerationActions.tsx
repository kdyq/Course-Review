"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmActionButton } from "@/components/admin/ConfirmActionButton";
import {
  adminDeleteReviewAction,
  hideReviewAction,
  publishReviewAction,
  restoreReviewAction,
} from "@/server/actions/admin";

export function ModerationActions({ reviewId, status }: { reviewId: string; status: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<{ ok: boolean; error?: { message: string } }>) {
    setPending(true);
    setError(null);
    try {
      const result = await action();
      if (!result.ok) {
        setError(result.error?.message ?? "操作失败");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("操作失败，请稍后再试");
    } finally {
      setPending(false);
    }
  }

  async function handleHide() {
    if (!reason.trim()) {
      setError("请填写隐藏原因");
      return;
    }
    await run(() => hideReviewAction({ reviewId, reason: reason.trim() }));
  }

  return (
    <div className="admin-actions">
      {status === "PENDING" ? (
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => run(() => publishReviewAction(reviewId))}
          disabled={pending}
        >
          通过
        </button>
      ) : null}

      {status === "PUBLISHED" || status === "PENDING" ? (
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button type="button" className="btn btn-sm btn-danger">
              隐藏
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="dialog-overlay" />
            <Dialog.Content className="dialog-content">
              <Dialog.Title className="dialog-title">隐藏这条评价</Dialog.Title>
              <Dialog.Description className="dialog-description">
                隐藏后，评价不会出现在公开页面，也不参与评分和排行榜。
              </Dialog.Description>
              <div className="field">
                <label className="label" htmlFor={`hide-reason-${reviewId}`}>
                  隐藏原因
                </label>
                <textarea
                  id={`hide-reason-${reviewId}`}
                  className="textarea"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={500}
                />
              </div>
              {error ? (
                <p className="form-error" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="row">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleHide}
                  disabled={pending}
                >
                  {pending ? "处理中..." : "确认隐藏"}
                </button>
                <Dialog.Close asChild>
                  <button type="button" className="btn btn-secondary">
                    取消
                  </button>
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      ) : null}

      {status === "HIDDEN" ? (
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={() => run(() => restoreReviewAction(reviewId))}
          disabled={pending}
        >
          恢复
        </button>
      ) : null}

      {status !== "DELETED" ? (
        <ConfirmActionButton
          label="删除"
          title="删除这条评价？"
          description="管理员删除后，评价状态变为已删除。这个操作会写入审计日志。"
          confirmLabel="确认删除"
          onConfirm={() => adminDeleteReviewAction(reviewId)}
        />
      ) : null}

      {error && !open ? (
        <span className="form-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
