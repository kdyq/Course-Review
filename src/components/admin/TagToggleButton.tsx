"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setTagActiveAction } from "@/server/actions/admin";

export function TagToggleButton({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      const result = await setTagActiveAction(id, !isActive);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } catch {
      setError("操作失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="stack-sm">
      <button
        type="button"
        className="btn btn-sm btn-secondary"
        onClick={handleClick}
        disabled={pending}
      >
        {pending ? "处理中..." : isActive ? "停用" : "启用"}
      </button>
      {error ? <span className="form-error">{error}</span> : null}
    </span>
  );
}
