"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ActionResult } from "@/lib/action-result";

export function ConfirmActionButton({
  label,
  title,
  description,
  confirmLabel,
  onConfirm,
  variant = "danger",
  disabled = false,
  disabledReason,
}: {
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<ActionResult<unknown>>;
  variant?: "danger" | "secondary";
  disabled?: boolean;
  disabledReason?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setPending(true);
    setError(null);
    try {
      const result = await onConfirm();
      if (!result.ok) {
        setError(result.error.message);
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

  if (disabled) {
    return (
      <button type="button" className="btn btn-sm btn-ghost" disabled title={disabledReason}>
        {label}
      </button>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={`btn btn-sm ${variant === "danger" ? "btn-danger" : "btn-secondary"}`}
        >
          {label}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title className="dialog-title">{title}</Dialog.Title>
          <Dialog.Description className="dialog-description">{description}</Dialog.Description>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="row">
            <button
              type="button"
              className={`btn ${variant === "danger" ? "btn-danger" : "btn-primary"}`}
              onClick={handleConfirm}
              disabled={pending}
            >
              {pending ? "处理中..." : confirmLabel}
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
