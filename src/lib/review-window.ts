import { EDIT_WINDOW_DAYS } from "@/lib/constants";

export function editDeadline(createdAt: Date): Date {
  return new Date(createdAt.getTime() + EDIT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

export function canEditReview(createdAt: Date, now = new Date()): boolean {
  return now.getTime() <= editDeadline(createdAt).getTime();
}
