export type Role = "STUDENT" | "INSTRUCTOR" | "MODERATOR" | "ADMIN";

const ROLE_VALUES: Role[] = ["STUDENT", "INSTRUCTOR", "MODERATOR", "ADMIN"];

export function normalizeRole(value: string | null | undefined): Role {
  return ROLE_VALUES.includes(value as Role) ? (value as Role) : "STUDENT";
}

export function isAdmin(role: string | null | undefined): boolean {
  return normalizeRole(role) === "ADMIN";
}

export function canModerate(role: string | null | undefined): boolean {
  const value = normalizeRole(role);
  return value === "ADMIN" || value === "MODERATOR";
}

export function canWriteReview(role: string | null | undefined): boolean {
  return ["STUDENT", "INSTRUCTOR", "MODERATOR", "ADMIN"].includes(normalizeRole(role));
}

export function canRespondAsInstructor(role: string | null | undefined): boolean {
  const value = normalizeRole(role);
  return value === "INSTRUCTOR" || value === "ADMIN";
}

export function canManageCourses(role: string | null | undefined): boolean {
  return normalizeRole(role) === "ADMIN";
}

export function canManageUsers(role: string | null | undefined): boolean {
  return normalizeRole(role) === "ADMIN";
}
