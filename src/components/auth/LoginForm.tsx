"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

function humanizeError(message?: string): string {
  if (!message) {
    return "登录失败，请检查用户名和密码";
  }
  if (message.includes("INVALID_USERNAME_OR_PASSWORD")) {
    return "用户名或密码不正确";
  }
  if (message.includes("EMAIL_NOT_VERIFIED")) {
    return "邮箱还没有验证，请先完成验证";
  }
  return message;
}

export function LoginForm({ next = "/" }: { next?: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const { error: signInError } = await authClient.signIn.username({
        username: username.trim(),
        password,
      });

      if (signInError) {
        setError(humanizeError(signInError.message));
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError("网络错误，请稍后再试");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label className="label" htmlFor="login-username">
          用户名
        </label>
        <input
          id="login-username"
          className="input"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          minLength={3}
          pattern="[A-Za-z0-9]+"
          required
        />
        <span className="form-hint">使用注册时的用户名。普通账号至少 5 位。</span>
      </div>

      <div className="field">
        <label className="label" htmlFor="login-password">
          密码
        </label>
        <input
          id="login-password"
          className="input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          minLength={6}
          required
        />
      </div>

      {error ? (
        <p className="form-error" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}

      <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
        {pending ? "登录中..." : "登录"}
      </button>

      <p className="form-hint">
        还没有账号？
        <Link href="/register" className="inline-link">
          去注册
        </Link>
      </p>
    </form>
  );
}
