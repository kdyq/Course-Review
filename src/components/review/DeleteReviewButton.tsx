"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteReviewAction } from "@/server/actions/review";

export function DeleteReviewButton({
  reviewId,
  courseName,
}: {
  reviewId: string;
  courseName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setPending(true);
    setError(null);
    try {
      const result = await deleteReviewAction(reviewId);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("删除失败，请稍后再试");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className="btn btn-sm btn-danger">
          删除
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title className="dialog-title">删除这条评价？</Dialog.Title>
          <Dialog.Description className="dialog-description">
            删除后，{courseName} 的这条评价会从前台和聚合中消失，状态变为已删除。这个操作不能撤回。
          </Dialog.Description>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="row">
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={pending}
            >
              {pending ? "删除中..." : "确认删除"}
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
  );
}
