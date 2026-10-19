import Link from "next/link";
import { NAV_LINKS, SITE_NAME, SITE_NAME_EN } from "@/lib/constants";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell nav">
        <Link href="/" className="brand" aria-label={`${SITE_NAME}首页`}>
          <span className="brand-mark" aria-hidden="true">
            课
          </span>
          <span className="brand-text">
            <strong>{SITE_NAME}</strong>
            <small>{SITE_NAME_EN}</small>
          </span>
        </Link>

        <nav className="nav-links" aria-label="主导航">
          {NAV_LINKS.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <search className="header-search">
            <form action="/courses" className="search-form">
              <label className="sr-only" htmlFor="header-search">
                搜索课程、教师或课程代码
              </label>
              <input
                id="header-search"
                name="q"
                className="input"
                type="search"
                placeholder="搜课程 / 教师 / 代码"
                autoComplete="off"
              />
              <button type="submit" className="btn btn-sm">
                搜索
              </button>
            </form>
          </search>
          <Link href="/login" className="btn btn-sm">
            登录
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
