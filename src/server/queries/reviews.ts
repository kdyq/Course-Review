import "server-only";
import type { ReviewStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type WriteOffering = {
  id: string;
  section: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  termName: string;
  instructors: string[];
};

export type ExistingReview = {
  reviewId: string;
  offeringId: string;
  status: ReviewStatus;
  createdAt: Date;
  editedAt: Date | null;
  hiddenReason: string | null;
  difficulty: number;
  workload: number;
  recommendation: number;
  grading: number | null;
  teaching: number | null;
  assessment: string[];
  content: string;
  tags: string[];
};

export type MyReviewItem = {
  id: string;
  offeringId: string;
  status: ReviewStatus;
  createdAt: Date;
  editedAt: Date | null;
  hiddenReason: string | null;
  difficulty: number;
  workload: number;
  recommendation: number;
  content: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  termName: string;
  section: string;
};

export async function getOfferingForWrite(offeringId: string): Promise<WriteOffering | null> {
  const offering = await prisma.offering.findUnique({
    where: { id: offeringId },
    select: {
      id: true,
      section: true,
      course: { select: { id: true, code: true, name: true } },
      term: { select: { name: true } },
      instructors: { select: { instructor: { select: { name: true } } } },
    },
  });

  if (!offering) {
    return null;
  }

  return {
    id: offering.id,
    section: offering.section,
    courseId: offering.course.id,
    courseCode: offering.course.code,
    courseName: offering.course.name,
    termName: offering.term.name,
    instructors: offering.instructors.map((item) => item.instructor.name),
  };
}

export async function getReviewForWrite(
  offeringId: string,
  userId: string,
): Promise<ExistingReview | null> {
  const author = await prisma.reviewAuthor.findUnique({
    where: { userId_offeringId: { userId, offeringId } },
    select: {
      reviewId: true,
      offeringId: true,
      review: {
        select: {
          status: true,
          createdAt: true,
          editedAt: true,
          hiddenReason: true,
          difficulty: true,
          workload: true,
          recommendation: true,
          grading: true,
          teaching: true,
          assessment: true,
          content: true,
          tags: { select: { tag: { select: { name: true } } } },
        },
      },
    },
  });

  if (!author) {
    return null;
  }

  return {
    reviewId: author.reviewId,
    offeringId: author.offeringId,
    status: author.review.status,
    createdAt: author.review.createdAt,
    editedAt: author.review.editedAt,
    hiddenReason: author.review.hiddenReason,
    difficulty: author.review.difficulty,
    workload: author.review.workload,
    recommendation: author.review.recommendation,
    grading: author.review.grading,
    teaching: author.review.teaching,
    assessment: author.review.assessment,
    content: author.review.content,
    tags: author.review.tags.map((item) => item.tag.name),
  };
}

export async function getMyReviews(userId: string): Promise<MyReviewItem[]> {
  const reviews = await prisma.review.findMany({
    where: { author: { userId } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      offeringId: true,
      status: true,
      createdAt: true,
      editedAt: true,
      hiddenReason: true,
      difficulty: true,
      workload: true,
      recommendation: true,
      content: true,
      offering: {
        select: {
          section: true,
          term: { select: { name: true } },
          course: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });

  return reviews.map((review) => ({
    id: review.id,
    offeringId: review.offeringId,
    status: review.status,
    createdAt: review.createdAt,
    editedAt: review.editedAt,
    hiddenReason: review.hiddenReason,
    difficulty: review.difficulty,
    workload: review.workload,
    recommendation: review.recommendation,
    content: review.content,
    courseId: review.offering.course.id,
    courseName: review.offering.course.name,
    courseCode: review.offering.course.code,
    termName: review.offering.term.name,
    section: review.offering.section,
  }));
}

export async function getActiveTags(): Promise<Array<{ id: string; name: string }>> {
  return prisma.tag.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
