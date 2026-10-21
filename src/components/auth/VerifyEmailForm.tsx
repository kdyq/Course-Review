"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function VerifyEmailForm({ email, verified }: { email: string; verified: boolean }) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (verified) {
    return (
      <p className="form-message" role="status">
        邮箱 {email} 已验证。
      </p>
    );
  }

  async function handleSend() {
    setError(null);
    setMessage(null);
    setSending(true);
    try {
      const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });
      if (sendError) {
        setError(sendError.message ?? "验证码发送失败");
        return;
      }
      setSent(true);
      setMessage("验证码已发送，请检查邮箱（包括垃圾邮件）。验证码 5 分钟内有效。");
    } catch {
      setError("验证码发送失败，请稍后再试");
    } finally {
      setSending(false);
    }
  }

  async function handleVerify() {
    if (!otp.trim()) {
      setError("请填写验证码");
      return;
    }
    setError(null);
    setMessage(null);
    setVerifying(true);
    try {
      const { error: verifyError } = await authClient.emailOtp.verifyEmail({
        email,
        otp: otp.trim(),
      });
      if (verifyError) {
        setError(verifyError.message ?? "验证码不正确或已过期");
        return;
      }
      setMessage("邮箱验证成功。");
      router.refresh();
    } catch {
      setError("验证失败，请稍后再试");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="stack">
      <p className="form-hint">
        当前邮箱：<span className="mono">{email}</span>，尚未验证。验证码只在你点击发送时生成。
      </p>
      <div className="row">
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={handleSend}
          disabled={sending}
        >
          {sending ? "发送中..." : sent ? "重新发送验证码" : "发送验证码"}
        </button>
      </div>
      <div className="field">
        <label className="label" htmlFor="verify-otp">
          验证码
        </label>
        <div className="row">
          <input
            id="verify-otp"
            className="input"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
          />
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={handleVerify}
            disabled={verifying}
          >
            {verifying ? "验证中..." : "验证邮箱"}
          </button>
        </div>
      </div>
      {error ? (
        <p className="form-error" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="form-message" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
    </div>
  );
}
