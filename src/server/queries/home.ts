import "server-only";
import { ReviewStatus } from "@/generated/prisma/client";
import { type PublicReview, toPublicReview } from "@/lib/anonymity";
import { prisma } from "@/lib/prisma";
import { reviewPublicSelect } from "./courses";
import { getLeaderboard, type LeaderboardData } from "./leaderboards";

export type HomeReview = {
  review: PublicReview;
  courseName: string;
  courseCode: string;
  termName: string;
  instructorNames: string[];
};

export type HomeData = {
  stats: {
    courseCount: number;
    reviewCount: number;
    instructorCount: number;
  };
  latestReviews: HomeReview[];
  leaderboard: LeaderboardData;
};

export async function getHomeData(): Promise<HomeData> {
  const [courseCount, reviewCount, instructorCount, reviews, leaderboard] = await Promise.all([
    prisma.course.count(),
    prisma.review.count({ where: { status: ReviewStatus.PUBLISHED } }),
    prisma.instructor.count(),
    prisma.review.findMany({
      where: { status: ReviewStatus.PUBLISHED },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        ...reviewPublicSelect,
        offering: {
          select: {
            term: { select: { name: true } },
            course: { select: { name: true, code: true } },
            instructors: {
              select: { instructor: { select: { name: true } } },
            },
          },
        },
      },
    }),
    getLeaderboard("recommendation", null, 5),
  ]);

  return {
    stats: { courseCount, reviewCount, instructorCount },
    latestReviews: reviews.map((review) => ({
      review: toPublicReview(review),
      courseName: review.offering.course.name,
      courseCode: review.offering.course.code,
      termName: review.offering.term.name,
      instructorNames: review.offering.instructors.map((item) => item.instructor.name),
    })),
    leaderboard,
  };
}
