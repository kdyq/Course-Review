"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { upsertTagAction } from "@/server/actions/admin";

export function TagForm({
  initial,
  compact = false,
}: {
  initial?: { id: string; name: string; isActive: boolean };
  compact?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await upsertTagAction({
        id: initial?.id,
        name,
        isActive,
      });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      if (!initial) {
        setName("");
        setIsActive(true);
      }
      router.refresh();
    } catch {
      setError("保存失败，请稍后再试");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className={compact ? "row tag-form-inline" : "stack-sm"}
      onSubmit={handleSubmit}
      noValidate
    >
      <input
        className="input"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="标签名"
        maxLength={20}
        required
        aria-label="标签名"
      />
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
        />
        启用
      </label>
      <button type="submit" className="btn btn-sm btn-primary" disabled={pending}>
        {pending ? "保存中..." : initial ? "保存" : "新建标签"}
      </button>
      {error ? (
        <span className="form-error" role="alert">
          {error}
        </span>
      ) : null}
    </form>
  );
}
