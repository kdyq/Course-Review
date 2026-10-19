import Link from "next/link";
import { SITE_NAME, SITE_NAME_EN } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="footer-grid">
          <div>
            <h3>{SITE_NAME}</h3>
            <p>
              真实评价，匿名写下。前台不显示作者身份，后台保留必要的治理能力。评价对象是课程、学期和教师组成的开课班次。
            </p>
          </div>
          <div>
            <h3>逛一逛</h3>
            <div className="footer-links">
              <Link href="/courses">课程库</Link>
              <Link href="/leaderboards">排行榜</Link>
              <Link href="/write">写一页</Link>
            </div>
          </div>
          <div>
            <h3>规则与说明</h3>
            <div className="footer-links">
              <Link href="/about/rules">评价规范</Link>
              <Link href="/about/privacy">隐私说明</Link>
              <Link href="/login">登录</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{SITE_NAME_EN} · 本地开发版本</span>
          <span>数据来自本地 PostgreSQL</span>
        </div>
      </div>
    </footer>
  );
}
