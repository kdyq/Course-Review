"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

const USERNAME_PATTERN = /^[A-Za-z0-9]{5,}$/;
const PASSWORD_PATTERN = /^[A-Za-z0-9@_]{6,}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function humanizeError(message?: string): string {
  if (!message) {
    return "注册失败，请稍后再试";
  }
  if (message.includes("USERNAME_IS_ALREADY_TAKEN")) {
    return "这个用户名已经被使用";
  }
  if (message.includes("USERNAME_TOO_SHORT")) {
    return "用户名至少 5 位";
  }
  if (message.includes("INVALID_USERNAME")) {
    return "用户名只能包含字母和数字，至少 5 位";
  }
  if (message.includes("PASSWORD_TOO_SHORT")) {
    return "密码至少 6 位";
  }
  if (message.includes("USER_ALREADY_EXISTS")) {
    return "这个邮箱已经注册";
  }
  if (message.includes("INVALID_EMAIL")) {
    return "邮箱格式不正确";
  }
  return message;
}

export function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function validate(): string | null {
    if (!USERNAME_PATTERN.test(username.trim())) {
      return "用户名只能包含字母和数字，至少 5 位";
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      return "请输入有效的邮箱地址";
    }
    if (!PASSWORD_PATTERN.test(password)) {
      return "密码只能包含字母、数字、@ 和 _，至少 6 位";
    }
    if (password !== confirmPassword) {
      return "两次输入的密码不一致";
    }
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setPending(true);

    try {
      const { error: signUpError } = await authClient.signUp.email({
        email: email.trim(),
        password,
        name: username.trim(),
        username: username.trim(),
        displayUsername: username.trim(),
      });

      if (signUpError) {
        setError(humanizeError(signUpError.message));
        return;
      }

      router.push("/me");
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
        <label className="label" htmlFor="register-username">
          用户名
        </label>
        <input
          id="register-username"
          className="input"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          minLength={5}
          pattern="[A-Za-z0-9]{5,}"
          required
        />
        <span className="form-hint">只允许字母和数字，至少 5 位。</span>
      </div>

      <div className="field">
        <label className="label" htmlFor="register-email">
          邮箱
        </label>
        <input
          id="register-email"
          className="input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
        <span className="form-hint">邮箱用于验证和找回账号。注册后可以在个人中心发送验证码。</span>
      </div>

      <div className="field">
        <label className="label" htmlFor="register-password">
          密码
        </label>
        <input
          id="register-password"
          className="input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
        />
        <span className="form-hint">只允许字母、数字、@ 和 _，至少 6 位。</span>
      </div>

      <div className="field">
        <label className="label" htmlFor="register-confirm">
          确认密码
        </label>
        <input
          id="register-confirm"
          className="input"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
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
        {pending ? "注册中..." : "注册"}
      </button>

      <p className="form-hint">
        已有账号？
        <Link href="/login" className="inline-link">
          去登录
        </Link>
        。注册即表示同意
        <Link href="/about/rules" className="inline-link">
          评价规范
        </Link>
        和
        <Link href="/about/privacy" className="inline-link">
          隐私说明
        </Link>
        。
      </p>
    </form>
  );
}
