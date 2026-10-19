import "server-only";
import { ReviewStatus } from "@/generated/prisma/client";
import { BAYES_M, MIN_SAMPLE_SIZE } from "@/lib/constants";
import { average } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import {
  bayesianAverage,
  filterAndSortLeaderboard,
  type LeaderboardDimension,
} from "@/lib/ranking";

export type LeaderboardItem = {
  courseId: string;
  courseName: string;
  courseCode: string;
  instructors: string[];
  average: number;
  score: number;
  count: number;
};

export type LeaderboardData = {
  dimension: LeaderboardDimension;
  term: string | null;
  items: LeaderboardItem[];
  globalAverage: number;
  minimum: number;
  m: number;
};

const CACHE_TTL_MS = 60 * 60 * 1000;
const globalAverageCache = new Map<LeaderboardDimension, { value: number; expiresAt: number }>();

async function getGlobalAverage(dimension: LeaderboardDimension): Promise<number> {
  const cached = globalAverageCache.get(dimension);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  let value: number | null = null;
  if (dimension === "recommendation") {
    const result = await prisma.review.aggregate({
      where: { status: ReviewStatus.PUBLISHED },
      _avg: { recommendation: true },
    });
    value = result._avg.recommendation;
  } else if (dimension === "difficulty") {
    const result = await prisma.review.aggregate({
      where: { status: ReviewStatus.PUBLISHED },
      _avg: { difficulty: true },
    });
    value = result._avg.difficulty;
  } else {
    const result = await prisma.review.aggregate({
      where: { status: ReviewStatus.PUBLISHED },
      _avg: { workload: true },
    });
    value = result._avg.workload;
  }

  const resolved = value ?? 3;
  globalAverageCache.set(dimension, {
    value: resolved,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  return resolved;
}

export async function getLeaderboard(
  dimension: LeaderboardDimension,
  term: string | null,
  limit = 20,
): Promise<LeaderboardData> {
  const [globalAverage, reviews] = await Promise.all([
    getGlobalAverage(dimension),
    prisma.review.findMany({
      where: { status: ReviewStatus.PUBLISHED },
      select: {
        recommendation: true,
        difficulty: true,
        workload: true,
        offering: {
          select: {
            term: { select: { name: true } },
            course: { select: { id: true, code: true, name: true } },
          },
        },
      },
    }),
  ]);

  const grouped = new Map<
    string,
    {
      courseId: string;
      courseName: string;
      courseCode: string;
      values: number[];
    }
  >();

  for (const review of reviews) {
    if (term && review.offering.term.name !== term) {
      continue;
    }
    const course = review.offering.course;
    const group = grouped.get(course.id) ?? {
      courseId: course.id,
      courseName: course.name,
      courseCode: course.code,
      values: [],
    };
    group.values.push(review[dimension]);
    grouped.set(course.id, group);
  }

  const courseIds = Array.from(grouped.keys());
  const courses =
    courseIds.length > 0
      ? await prisma.course.findMany({
          where: { id: { in: courseIds } },
          select: {
            id: true,
            offerings: {
              select: {
                instructors: {
                  select: { instructor: { select: { name: true } } },
                },
              },
            },
          },
        })
      : [];
  const instructorMap = new Map(
    courses.map((course) => [
      course.id,
      Array.from(
        new Set(
          course.offerings.flatMap((offering) =>
            offering.instructors.map((item) => item.instructor.name),
          ),
        ),
      ),
    ]),
  );

  const items = Array.from(grouped.values())
    .filter((group) => group.values.length >= MIN_SAMPLE_SIZE)
    .map((group) => {
      const averageValue = average(group.values) ?? globalAverage;
      const score = bayesianAverage(group.values.length, averageValue, globalAverage, BAYES_M);
      return {
        courseId: group.courseId,
        courseName: group.courseName,
        courseCode: group.courseCode,
        instructors: instructorMap.get(group.courseId) ?? [],
        average: averageValue,
        score,
        count: group.values.length,
      };
    });

  return {
    dimension,
    term,
    items: filterAndSortLeaderboard(items, dimension).slice(0, limit),
    globalAverage,
    minimum: MIN_SAMPLE_SIZE,
    m: BAYES_M,
  };
}
