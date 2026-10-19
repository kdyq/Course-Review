import "server-only";
import { type Prisma, ReviewStatus } from "@/generated/prisma/client";
import { type PublicReview, toPublicReview } from "@/lib/anonymity";
import { average, distributionOf } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { reviewPublicSelect } from "./courses";

export type OfferingSort = "helpful" | "latest" | "highest" | "lowest";

const SORT_ORDER: Record<OfferingSort, Prisma.ReviewOrderByWithRelationInput[]> = {
  helpful: [{ helpfulCount: "desc" }, { createdAt: "desc" }],
  latest: [{ createdAt: "desc" }],
  highest: [{ recommendation: "desc" }, { createdAt: "desc" }],
  lowest: [{ recommendation: "asc" }, { createdAt: "desc" }],
};

export function parseOfferingSort(value: string | string[] | undefined): OfferingSort {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "latest" || raw === "highest" || raw === "lowest") {
    return raw;
  }
  return "helpful";
}

export type OfferingDetail = {
  offering: {
    id: string;
    section: string;
    campus: string | null;
    courseId: string;
    courseCode: string;
    courseName: string;
    termName: string;
    isCurrent: boolean;
    instructors: Array<{ id: string; name: string }>;
  };
  stats: {
    count: number;
    recommendationAverage: number | null;
    difficultyAverage: number | null;
    workloadAverage: number | null;
    gradingAverage: number | null;
    teachingAverage: number | null;
    recommendationDistribution: number[];
  };
  tagCounts: Array<{ name: string; count: number }>;
  reviews: PublicReview[];
};

export async function getOfferingDetail(
  offeringId: string,
  sort: OfferingSort = "helpful",
): Promise<OfferingDetail | null> {
  const offering = await prisma.offering.findUnique({
    where: { id: offeringId },
    select: {
      id: true,
      section: true,
      campus: true,
      course: { select: { id: true, code: true, name: true } },
      term: { select: { name: true, isCurrent: true } },
      instructors: {
        select: { instructor: { select: { id: true, name: true } } },
      },
      reviews: {
        where: { status: ReviewStatus.PUBLISHED },
        orderBy: SORT_ORDER[sort],
        select: reviewPublicSelect,
      },
    },
  });

  if (!offering) {
    return null;
  }

  const recommendations = offering.reviews.map((review) => review.recommendation);
  const difficulties = offering.reviews.map((review) => review.difficulty);
  const workloads = offering.reviews.map((review) => review.workload);
  const gradings = offering.reviews
    .map((review) => review.grading)
    .filter((value): value is number => value !== null);
  const teachings = offering.reviews
    .map((review) => review.teaching)
    .filter((value): value is number => value !== null);

  const tagCounts = new Map<string, number>();
  for (const review of offering.reviews) {
    for (const item of review.tags) {
      tagCounts.set(item.tag.name, (tagCounts.get(item.tag.name) ?? 0) + 1);
    }
  }

  return {
    offering: {
      id: offering.id,
      section: offering.section,
      campus: offering.campus,
      courseId: offering.course.id,
      courseCode: offering.course.code,
      courseName: offering.course.name,
      termName: offering.term.name,
      isCurrent: offering.term.isCurrent,
      instructors: offering.instructors.map((item) => item.instructor),
    },
    stats: {
      count: recommendations.length,
      recommendationAverage: average(recommendations),
      difficultyAverage: average(difficulties),
      workloadAverage: average(workloads),
      gradingAverage: average(gradings),
      teachingAverage: average(teachings),
      recommendationDistribution: distributionOf(recommendations),
    },
    tagCounts: Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count })),
    reviews: offering.reviews.map(toPublicReview),
  };
}

export async function getViewerReview(
  offeringId: string,
  userId: string | undefined,
): Promise<{ reviewId: string; status: string } | null> {
  if (!userId) {
    return null;
  }

  const author = await prisma.reviewAuthor.findUnique({
    where: { userId_offeringId: { userId, offeringId } },
    select: { reviewId: true, review: { select: { status: true } } },
  });

  if (!author || author.review.status === ReviewStatus.DELETED) {
    return null;
  }

  return { reviewId: author.reviewId, status: author.review.status };
}
