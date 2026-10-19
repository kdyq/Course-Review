import { describe, expect, it } from "vitest";
import { toPublicReview } from "@/lib/anonymity";

describe("toPublicReview", () => {
  it("只输出公开字段，不泄露作者身份", () => {
    const review = {
      id: "review-1",
      offeringId: "offering-1",
      difficulty: 4,
      workload: 3,
      recommendation: 5,
      grading: null,
      teaching: null,
      assessment: ["CLOSED_BOOK_EXAM"],
      content: "这是一条长度足够的测试评价。",
      helpfulCount: 3,
      createdAt: new Date("2026-10-01T08:00:00.000Z"),
      editedAt: null,
      tags: [{ tag: { id: "tag-1", name: "干货多" } }],
      response: null,
      userId: "user-secret",
      email: "student@example.local",
      authorId: "user-secret",
      reviewAuthor: { userId: "user-secret" },
    };

    const dto = toPublicReview(review as unknown as Parameters<typeof toPublicReview>[0]);

    expect(dto).not.toHaveProperty("userId");
    expect(dto).not.toHaveProperty("email");
    expect(dto).not.toHaveProperty("authorId");
    expect(dto).not.toHaveProperty("reviewAuthor");
    expect(JSON.stringify(dto)).not.toContain("student@example.local");
    expect(dto.status).toBe("PUBLISHED");
    expect(dto.tags).toEqual([{ id: "tag-1", name: "干货多" }]);
  });
});
