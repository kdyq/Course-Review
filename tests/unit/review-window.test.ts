import { describe, expect, it } from "vitest";
import { canEditReview, editDeadline } from "@/lib/review-window";

describe("review edit window", () => {
  it("允许 7 天内编辑", () => {
    const now = new Date("2026-10-19T12:00:00.000Z");
    const createdAt = new Date("2026-10-15T12:00:00.000Z");
    expect(canEditReview(createdAt, now)).toBe(true);
  });

  it("超过 7 天后拒绝编辑", () => {
    const now = new Date("2026-10-19T12:00:00.000Z");
    const createdAt = new Date("2026-10-01T12:00:00.000Z");
    expect(canEditReview(createdAt, now)).toBe(false);
  });

  it("计算编辑截止时间", () => {
    const createdAt = new Date("2026-10-15T12:00:00.000Z");
    expect(editDeadline(createdAt).toISOString()).toBe("2026-10-22T12:00:00.000Z");
  });
});
