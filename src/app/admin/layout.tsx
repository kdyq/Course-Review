import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();
  const user = session.user as { username?: string | null; name?: string };

  return <AdminShell username={user.username ?? user.name ?? "管理员"}>{children}</AdminShell>;
}
