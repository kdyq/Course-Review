import type { ReactNode } from "react";
import { MobileNav } from "@/components/layout/MobileNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <MobileNav />
      <div className="mobile-nav-spacer" />
    </>
  );
}
