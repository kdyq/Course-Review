"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { SITE_NAME, SITE_NAME_EN } from "@/lib/constants";

const ADMIN_NAV = [
  { href: "/admin", label: "数据概览" },
  { href: "/admin/courses", label: "课程管理" },
  { href: "/admin/reviews", label: "评价审核" },
  { href: "/admin/reports", label: "举报处理" },
  { href: "/admin/tags", label: "标签管理" },
  { href: "/admin/users", label: "用户管理" },
  { href: "/admin/audit", label: "审计日志" },
] as const;

export function AdminShell({ username, children }: { username: string; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <Link href="/" className="brand" aria-label={`${SITE_NAME}首页`}>
            <span className="brand-mark" aria-hidden="true">
              课
            </span>
            <span className="brand-text">
              <strong>{SITE_NAME}</strong>
              <small>{SITE_NAME_EN} ADMIN</small>
            </span>
          </Link>
        </div>

        <nav className="admin-nav" aria-label="后台导航">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar__foot">
          <Link href="/" className="btn btn-sm btn-secondary btn-block">
            回到前台
          </Link>
        </div>
      </aside>

      <main id="main" className="admin-main">
        <div className="admin-topbar">
          <span className="kicker">后台 · {username}</span>
          <ThemeToggle />
        </div>
        {children}
      </main>
    </div>
  );
}
