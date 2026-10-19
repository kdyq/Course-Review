"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_NAV_LINKS } from "@/lib/constants";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-nav" aria-label="移动端导航">
      {MOBILE_NAV_LINKS.map((item) => {
        const isCurrent = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} aria-current={isCurrent ? "page" : undefined}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
