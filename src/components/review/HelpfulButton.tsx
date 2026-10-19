"use client";

import { ThumbsUp } from "@phosphor-icons/react";
import { useState } from "react";
import { toggleHelpfulAction } from "@/server/actions/vote";

export function HelpfulButton({
  reviewId,
  initialCount,
  initiallyActive,
  disabled = false,
  disabledReason,
}: {
  reviewId: string;
  initialCount: number;
  initiallyActive: boolean;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [active, setActive] = useState(initiallyActive);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (disabled) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await toggleHelpfulAction(reviewId);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setActive(result.data.active);
      setCount(result.data.helpfulCount);
    } catch {
      setError("投票失败，请稍后再试");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="helpful-wrap">
      <button
        type="button"
        className={`btn btn-sm ${active ? "btn-primary" : "btn-secondary"}`}
        aria-pressed={active}
        onClick={handleClick}
        disabled={disabled || pending}
        title={disabled ? disabledReason : undefined}
      >
        <ThumbsUp size={14} weight={active ? "fill" : "regular"} aria-hidden="true" />
        {active ? "已点有用" : "有用"} {count}
      </button>
      {error ? (
        <span className="form-error" role="alert" aria-live="polite">
          {error}
        </span>
      ) : null}
    </div>
  );
}
