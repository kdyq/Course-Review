import { describe, expect, it } from "vitest";
import { reviewInputSchema } from "@/lib/validation/review";

const validInput = {
  offeringId: "offering-1",
  difficulty: 4,
  workload: 3,
  recommendation: 5,
  grading: null,
  teaching: null,
  assessment: ["CLOSED_BOOK_EXAM"],
  content: "这是一条长度足够的测试评价内容。",
  tags: ["干货多"],
};

describe("reviewInputSchema", () => {
  it("接受合法输入", () => {
    expect(reviewInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("拒绝超出 1 到 5 的评分", () => {
    expect(reviewInputSchema.safeParse({ ...validInput, difficulty: 0 }).success).toBe(false);
    expect(reviewInputSchema.safeParse({ ...validInput, workload: 6 }).success).toBe(false);
  });

  it("拒绝过短的正文", () => {
    expect(reviewInputSchema.safeParse({ ...validInput, content: "太短" }).success).toBe(false);
  });

  it("拒绝未知考核方式", () => {
    expect(reviewInputSchema.safeParse({ ...validInput, assessment: ["NOT_REAL"] }).success).toBe(
      false,
    );
  });

  it("拒绝超过 5 个标签", () => {
    expect(
      reviewInputSchema.safeParse({
        ...validInput,
        tags: ["a", "b", "c", "d", "e", "f"],
      }).success,
    ).toBe(false);
  });
});
