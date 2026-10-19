import { BAYES_M } from "@/lib/constants";

export type LeaderboardDimension = "recommendation" | "difficulty" | "workload";

export const LEADERBOARD_DIMENSIONS: Array<{
  value: LeaderboardDimension;
  label: string;
  order: "desc" | "asc";
  description: string;
}> = [
  {
    value: "recommendation",
    label: "推荐度",
    order: "desc",
    description: "分数越高越推荐",
  },
  {
    value: "difficulty",
    label: "难度",
    order: "asc",
    description: "分数越低越轻松",
  },
  {
    value: "workload",
    label: "作业量",
    order: "asc",
    description: "分数越低作业越少",
  },
];

export function parseLeaderboardDimension(
  value: string | string[] | undefined,
): LeaderboardDimension {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "difficulty" || raw === "workload") {
    return raw;
  }
  return "recommendation";
}

export function bayesianAverage(
  count: number,
  average: number,
  globalAverage: number,
  m = BAYES_M,
): number {
  if (count <= 0) {
    return globalAverage;
  }
  return (count / (count + m)) * average + (m / (count + m)) * globalAverage;
}

export function filterAndSortLeaderboard<T extends { score: number; count: number }>(
  items: T[],
  dimension: LeaderboardDimension,
): T[] {
  const direction = dimension === "recommendation" ? -1 : 1;
  return [...items].sort((a, b) => {
    const difference = a.score - b.score;
    if (Math.abs(difference) < 0.0001) {
      return b.count - a.count;
    }
    return difference * direction;
  });
}
