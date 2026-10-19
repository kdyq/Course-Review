"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { isAdmin } from "@/lib/permissions";

export function UserMenu() {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();
  const user = data?.user as
    | { username?: string | null; name?: string; role?: string | null }
    | undefined;

  if (isPending) {
    return <span className="user-menu-loading">读取中</span>;
  }

  if (!user) {
    return (
      <Link href="/login" className="btn btn-sm">
        登录
      </Link>
    );
  }

  return (
    <div className="user-menu">
      <Link href="/me" className="user-chip" title="个人中心">
        {user.username ?? user.name ?? "我的"}
      </Link>
      {isAdmin(user.role) ? (
        <Link href="/admin" className="btn btn-sm btn-secondary">
          后台
        </Link>
      ) : null}
      <button
        type="button"
        className="btn btn-sm btn-ghost"
        onClick={async () => {
          await authClient.signOut();
          router.push("/");
          router.refresh();
        }}
      >
        退出
      </button>
    </div>
  );
}
