import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="shell section">
      <div className="empty-state">
        <h1>这页纸不在手账里</h1>
        <p>链接可能已经失效，或者这条记录被隐藏了。</p>
        <Link href="/" className="btn btn-primary">
          回到首页
        </Link>
      </div>
    </main>
  );
}
