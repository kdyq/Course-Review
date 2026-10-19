import { describe, expect, it } from "vitest";
import { bayesianAverage, filterAndSortLeaderboard } from "@/lib/ranking";

describe("ranking", () => {
  it("贝叶斯平均会把小样本拉向全站平均", () => {
    const score = bayesianAverage(5, 5, 3, 10);
    expect(score).toBeCloseTo((5 / 15) * 5 + (10 / 15) * 3, 6);
  });

  it("推荐度降序，难度和作业量升序", () => {
    const items = [
      { id: "a", score: 4.2, count: 10 },
      { id: "b", score: 4.8, count: 8 },
      { id: "c", score: 3.9, count: 12 },
    ];
    expect(filterAndSortLeaderboard(items, "recommendation").map((item) => item.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
    expect(filterAndSortLeaderboard(items, "difficulty").map((item) => item.id)).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  it("同分时样本多的靠前", () => {
    const items = [
      { id: "a", score: 4.5, count: 6 },
      { id: "b", score: 4.5, count: 12 },
    ];
    expect(filterAndSortLeaderboard(items, "recommendation").map((item) => item.id)).toEqual([
      "b",
      "a",
    ]);
  });
});
