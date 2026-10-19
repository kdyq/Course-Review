import "server-only";
import { type CourseType, type Prisma, ReviewStatus } from "@/generated/prisma/client";
import { type PublicReview, toPublicReview } from "@/lib/anonymity";
import { COURSE_TYPE_LABELS, MIN_SAMPLE_SIZE } from "@/lib/constants";
import { average, distributionOf } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type { CourseListParams } from "@/lib/search-params";

export const reviewPublicSelect = {
  id: true,
  offeringId: true,
  difficulty: true,
  workload: true,
  recommendation: true,
  grading: true,
  teaching: true,
  assessment: true,
  content: true,
  helpfulCount: true,
  createdAt: true,
  editedAt: true,
  tags: {
    select: {
      tag: {
        select: { id: true, name: true },
      },
    },
  },
  response: {
    select: { content: true },
  },
} as const;

export type CourseListItem = {
  id: string;
  code: string;
  name: string;
  credits: number | null;
  type: CourseType;
  collegeName: string | null;
  instructors: string[];
  terms: string[];
  recommendationAverage: number | null;
  reviewCount: number;
  sampleEnough: boolean;
  latestReviewAt: Date | null;
  topTags: string[];
  relevance: number;
};

export type CourseListResult = {
  items: CourseListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CourseOfferingSummary = {
  id: string;
  section: string;
  termName: string;
  isCurrent: boolean;
  instructors: string[];
  reviewCount: number;
  recommendationAverage: number | null;
  sampleEnough: boolean;
};

export type CourseReviewPreview = {
  review: PublicReview;
  termName: string;
  instructorNames: string[];
};

export type CourseDetail = {
  course: {
    id: string;
    code: string;
    name: string;
    credits: number | null;
    type: CourseType;
    description: string | null;
    collegeName: string | null;
  };
  stats: {
    count: number;
    recommendationAverage: number | null;
    difficultyAverage: number | null;
    workloadAverage: number | null;
    recommendationDistribution: number[];
  };
  offerings: CourseOfferingSummary[];
  latestReviews: CourseReviewPreview[];
};

export async function getCourseFilterOptions() {
  const [colleges, terms] = await Promise.all([
    prisma.college.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
    prisma.term.findMany({ orderBy: { name: "desc" }, select: { name: true } }),
  ]);

  return {
    colleges: colleges.map((college) => college.name),
    terms: terms.map((term) => term.name),
  };
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

async function searchCourseIds(query: string): Promise<Map<string, number>> {
  const escaped = escapeLike(query);
  const like = `%${escaped}%`;
  const prefix = `${escaped}%`;

  const rows = await prisma.$queryRaw<Array<{ id: string; score: number }>>`
    SELECT
      c.id,
      GREATEST(
        similarity(c.name, ${query}),
        similarity(c.code, ${query}),
        COALESCE(MAX(similarity(i.name, ${query})), 0)
      ) + CASE
        WHEN lower(c.name) = lower(${query}) OR lower(c.code) = lower(${query}) THEN 1
        WHEN lower(c.name) LIKE lower(${prefix}) OR lower(c.code) LIKE lower(${prefix}) THEN 0.5
        ELSE 0
      END AS score
    FROM "Course" c
    LEFT JOIN "Offering" o ON o."courseId" = c.id
    LEFT JOIN "OfferingInstructor" oi ON oi."offeringId" = o.id
    LEFT JOIN "Instructor" i ON i.id = oi."instructorId"
    WHERE c.name ILIKE ${like} OR c.code ILIKE ${like} OR i.name ILIKE ${like}
    GROUP BY c.id, c.name
    ORDER BY score DESC, c.name ASC
  `;

  return new Map(rows.map((row) => [row.id, Number(row.score)]));
}

export async function searchCourses(params: CourseListParams): Promise<CourseListResult> {
  const where: Prisma.CourseWhereInput = {};

  if (params.college) {
    where.college = { name: params.college };
  }
  if (params.type && params.type in COURSE_TYPE_LABELS) {
    where.type = params.type as CourseType;
  }
  if (params.term) {
    where.offerings = { some: { term: { name: params.term } } };
  }

  let relevance = new Map<string, number>();
  if (params.q) {
    relevance = await searchCourseIds(params.q);
    if (relevance.size === 0) {
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize: params.pageSize,
        totalPages: 1,
      };
    }
    where.id = { in: Array.from(relevance.keys()) };
  }

  const courses = await prisma.course.findMany({
    where,
    select: {
      id: true,
      code: true,
      name: true,
      credits: true,
      type: true,
      updatedAt: true,
      college: { select: { name: true } },
      offerings: {
        where: params.term ? { term: { name: params.term } } : undefined,
        select: {
          section: true,
          term: { select: { name: true } },
          instructors: { select: { instructor: { select: { name: true } } } },
          reviews: {
            where: { status: ReviewStatus.PUBLISHED },
            select: {
              recommendation: true,
              createdAt: true,
              tags: { select: { tag: { select: { name: true } } } },
            },
          },
        },
      },
    },
  });

  const items: CourseListItem[] = courses.map((course) => {
    const recommendations = course.offerings.flatMap((offering) =>
      offering.reviews.map((review) => review.recommendation),
    );
    const reviewDates = course.offerings.flatMap((offering) =>
      offering.reviews.map((review) => review.createdAt),
    );
    const latestReviewAt =
      reviewDates.length > 0
        ? new Date(Math.max(...reviewDates.map((date) => date.getTime())))
        : course.updatedAt;
    const tagCounts = new Map<string, number>();
    for (const offering of course.offerings) {
      for (const review of offering.reviews) {
        for (const tag of review.tags) {
          tagCounts.set(tag.tag.name, (tagCounts.get(tag.tag.name) ?? 0) + 1);
        }
      }
    }
    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);
    const instructors = Array.from(
      new Set(
        course.offerings.flatMap((offering) =>
          offering.instructors.map((item) => item.instructor.name),
        ),
      ),
    );
    const terms = Array.from(new Set(course.offerings.map((offering) => offering.term.name))).sort(
      (a, b) => b.localeCompare(a),
    );

    return {
      id: course.id,
      code: course.code,
      name: course.name,
      credits: course.credits,
      type: course.type,
      collegeName: course.college?.name ?? null,
      instructors,
      terms,
      recommendationAverage: average(recommendations),
      reviewCount: recommendations.length,
      sampleEnough: recommendations.length >= MIN_SAMPLE_SIZE,
      latestReviewAt,
      topTags,
      relevance: relevance.get(course.id) ?? 0,
    };
  });

  const sort = params.sort;
  items.sort((a, b) => {
    if (sort === "relevance" && params.q) {
      return b.relevance - a.relevance || b.reviewCount - a.reviewCount;
    }
    if (sort === "reviews") {
      return b.reviewCount - a.reviewCount;
    }
    if (sort === "latest") {
      return (b.latestReviewAt?.getTime() ?? 0) - (a.latestReviewAt?.getTime() ?? 0);
    }
    const aScore = a.sampleEnough ? (a.recommendationAverage ?? -1) : -1;
    const bScore = b.sampleEnough ? (b.recommendationAverage ?? -1) : -1;
    return bScore - aScore || b.reviewCount - a.reviewCount;
  });

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  const page = Math.min(params.page, totalPages);
  const start = (page - 1) * params.pageSize;

  return {
    items: items.slice(start, start + params.pageSize),
    total,
    page,
    pageSize: params.pageSize,
    totalPages,
  };
}

export async function getCourseDetail(courseId: string): Promise<CourseDetail | null> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      code: true,
      name: true,
      credits: true,
      type: true,
      description: true,
      college: { select: { name: true } },
      offerings: {
        select: {
          id: true,
          section: true,
          term: { select: { name: true, isCurrent: true } },
          instructors: { select: { instructor: { select: { name: true } } } },
          reviews: {
            where: { status: ReviewStatus.PUBLISHED },
            select: reviewPublicSelect,
          },
        },
      },
    },
  });

  if (!course) {
    return null;
  }

  const flattened = course.offerings.flatMap((offering) =>
    offering.reviews.map((review) => ({
      review,
      termName: offering.term.name,
      instructorNames: offering.instructors.map((item) => item.instructor.name),
      offeringId: offering.id,
    })),
  );

  const recommendations = flattened.map((item) => item.review.recommendation);
  const difficulties = flattened.map((item) => item.review.difficulty);
  const workloads = flattened.map((item) => item.review.workload);

  const offerings: CourseOfferingSummary[] = course.offerings
    .map((offering) => {
      const offeringRecommendations = offering.reviews.map((review) => review.recommendation);
      const total = offeringRecommendations.length;
      return {
        id: offering.id,
        section: offering.section,
        termName: offering.term.name,
        isCurrent: offering.term.isCurrent,
        instructors: offering.instructors.map((item) => item.instructor.name),
        reviewCount: total,
        recommendationAverage: average(offeringRecommendations),
        sampleEnough: total >= MIN_SAMPLE_SIZE,
      };
    })
    .sort((a, b) => b.termName.localeCompare(a.termName) || a.section.localeCompare(b.section));

  const latestReviews = flattened
    .sort((a, b) => b.review.createdAt.getTime() - a.review.createdAt.getTime())
    .slice(0, 3)
    .map((item) => ({
      review: toPublicReview(item.review),
      termName: item.termName,
      instructorNames: item.instructorNames,
    }));

  return {
    course: {
      id: course.id,
      code: course.code,
      name: course.name,
      credits: course.credits,
      type: course.type,
      description: course.description,
      collegeName: course.college?.name ?? null,
    },
    stats: {
      count: recommendations.length,
      recommendationAverage: average(recommendations),
      difficultyAverage: average(difficulties),
      workloadAverage: average(workloads),
      recommendationDistribution: distributionOf(recommendations),
    },
    offerings,
    latestReviews,
  };
}
