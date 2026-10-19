import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireUser() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") {
    redirect("/");
  }
  return session;
}

export function userRole(user: { role?: string | null } | null | undefined): string {
  return user?.role ?? "STUDENT";
}
