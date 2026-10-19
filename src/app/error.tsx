"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="shell section">
      <div className="empty-state">
        <h1>这一页暂时翻不开</h1>
        <p>服务端遇到了一点问题。可以重试，或者先回到首页。</p>
        <div className="row center">
          <button type="button" className="btn btn-primary" onClick={reset}>
            重试
          </button>
          <Link href="/" className="btn btn-secondary">
            回到首页
          </Link>
        </div>
      </div>
    </main>
  );
}
