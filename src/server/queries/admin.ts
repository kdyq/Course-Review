import "server-only";
import type { CourseType, ReviewStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type AdminDashboard = {
  todayReviews: number;
  pendingReviews: number;
  pendingReports: number;
  courseCount: number;
  reviewCount: number;
  userCount: number;
  recentAudit: AdminAuditRow[];
};

export type AdminAuditRow = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: unknown;
  createdAt: Date;
  actorName: string | null;
  actorUsername: string | null;
};

export type AdminCourseRow = {
  id: string;
  code: string;
  name: string;
  type: CourseType;
  credits: number | null;
  collegeName: string | null;
  offeringCount: number;
  reviewCount: number;
  updatedAt: Date;
};

export type AdminOfferingRow = {
  id: string;
  section: string;
  termName: string;
  campus: string | null;
  instructors: string[];
  reviewCount: number;
};

export type AdminCourseDetail = {
  id: string;
  code: string;
  name: string;
  credits: number | null;
  type: CourseType;
  college: string;
  description: string | null;
  offerings: AdminOfferingRow[];
};

export type AdminReviewRow = {
  id: string;
  content: string;
  status: ReviewStatus;
  recommendation: number;
  difficulty: number;
  workload: number;
  helpfulCount: number;
  createdAt: Date;
  hiddenReason: string | null;
  courseName: string;
  courseCode: string;
  termName: string;
  section: string;
};

export type AdminReportRow = {
  id: string;
  reason: string;
  detail: string | null;
  status: string;
  createdAt: Date;
  resolutionNote: string | null;
  reviewId: string;
  reviewContent: string;
  reviewStatus: ReviewStatus;
  courseName: string;
  courseCode: string;
  termName: string;
};

export type AdminUserRow = {
  id: string;
  username: string | null;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
};

export type AdminTagRow = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  reviewCount: number;
  createdAt: Date;
};

export async function getRecentAudit(limit = 5): Promise<AdminAuditRow[]> {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      targetType: true,
      targetId: true,
      metadata: true,
      createdAt: true,
      actor: { select: { name: true, username: true } },
    },
  });

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    metadata: log.metadata,
    createdAt: log.createdAt,
    actorName: log.actor?.name ?? null,
    actorUsername: log.actor?.username ?? null,
  }));
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    todayReviews,
    pendingReviews,
    pendingReports,
    courseCount,
    reviewCount,
    userCount,
    recentAudit,
  ] = await Promise.all([
    prisma.review.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.course.count(),
    prisma.review.count(),
    prisma.user.count(),
    getRecentAudit(5),
  ]);

  return {
    todayReviews,
    pendingReviews,
    pendingReports,
    courseCount,
    reviewCount,
    userCount,
    recentAudit,
  };
}

export async function getAdminCourses(): Promise<AdminCourseRow[]> {
  const courses = await prisma.course.findMany({
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      credits: true,
      updatedAt: true,
      college: { select: { name: true } },
      offerings: {
        select: {
          _count: { select: { reviews: true } },
        },
      },
    },
  });

  return courses.map((course) => ({
    id: course.id,
    code: course.code,
    name: course.name,
    type: course.type,
    credits: course.credits,
    collegeName: course.college?.name ?? null,
    offeringCount: course.offerings.length,
    reviewCount: course.offerings.reduce((sum, offering) => sum + offering._count.reviews, 0),
    updatedAt: course.updatedAt,
  }));
}

export async function getAdminCourseDetail(courseId: string): Promise<AdminCourseDetail | null> {
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
          campus: true,
          term: { select: { name: true } },
          instructors: {
            select: { instructor: { select: { name: true } } },
          },
          _count: { select: { reviews: true } },
        },
      },
    },
  });

  if (!course) {
    return null;
  }

  return {
    id: course.id,
    code: course.code,
    name: course.name,
    credits: course.credits,
    type: course.type,
    college: course.college?.name ?? "",
    description: course.description,
    offerings: course.offerings
      .map((offering) => ({
        id: offering.id,
        section: offering.section,
        termName: offering.term.name,
        campus: offering.campus,
        instructors: offering.instructors.map((item) => item.instructor.name),
        reviewCount: offering._count.reviews,
      }))
      .sort((a, b) => b.termName.localeCompare(a.termName) || a.section.localeCompare(b.section)),
  };
}

export async function getAdminCollegeNames(): Promise<string[]> {
  const colleges = await prisma.college.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });
  return colleges.map((college) => college.name);
}

export async function getAdminTermNames(): Promise<string[]> {
  const terms = await prisma.term.findMany({
    orderBy: { name: "desc" },
    select: { name: true },
  });
  return terms.map((term) => term.name);
}

export async function getAdminReviews(status?: string): Promise<AdminReviewRow[]> {
  const reviews = await prisma.review.findMany({
    where: status ? { status: status as ReviewStatus } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      content: true,
      status: true,
      recommendation: true,
      difficulty: true,
      workload: true,
      helpfulCount: true,
      createdAt: true,
      hiddenReason: true,
      offering: {
        select: {
          section: true,
          term: { select: { name: true } },
          course: { select: { name: true, code: true } },
        },
      },
    },
  });

  return reviews.map((review) => ({
    id: review.id,
    content: review.content,
    status: review.status,
    recommendation: review.recommendation,
    difficulty: review.difficulty,
    workload: review.workload,
    helpfulCount: review.helpfulCount,
    createdAt: review.createdAt,
    hiddenReason: review.hiddenReason,
    courseName: review.offering.course.name,
    courseCode: review.offering.course.code,
    termName: review.offering.term.name,
    section: review.offering.section,
  }));
}

export async function getAdminReports(status?: string): Promise<AdminReportRow[]> {
  const reports = await prisma.report.findMany({
    where: status
      ? { status: status as "PENDING" | "REVIEWING" | "RESOLVED" | "REJECTED" }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      reason: true,
      detail: true,
      status: true,
      createdAt: true,
      resolutionNote: true,
      reviewId: true,
      review: {
        select: {
          content: true,
          status: true,
          offering: {
            select: {
              term: { select: { name: true } },
              course: { select: { name: true, code: true } },
            },
          },
        },
      },
    },
  });

  return reports.map((report) => ({
    id: report.id,
    reason: report.reason,
    detail: report.detail,
    status: report.status,
    createdAt: report.createdAt,
    resolutionNote: report.resolutionNote,
    reviewId: report.reviewId,
    reviewContent: report.review.content,
    reviewStatus: report.review.status,
    courseName: report.review.offering.course.name,
    courseCode: report.review.offering.course.code,
    termName: report.review.offering.term.name,
  }));
}

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });
  return users;
}

export async function getAdminTags(): Promise<AdminTagRow[]> {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      createdAt: true,
      _count: { select: { reviews: true } },
    },
  });

  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    isActive: tag.isActive,
    reviewCount: tag._count.reviews,
    createdAt: tag.createdAt,
  }));
}

export async function getAdminAuditLogs(filters: {
  action?: string;
  targetType?: string;
}): Promise<AdminAuditRow[]> {
  const logs = await prisma.auditLog.findMany({
    where: {
      action: filters.action ? { contains: filters.action, mode: "insensitive" } : undefined,
      targetType: filters.targetType
        ? { contains: filters.targetType, mode: "insensitive" }
        : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      action: true,
      targetType: true,
      targetId: true,
      metadata: true,
      createdAt: true,
      actor: { select: { name: true, username: true } },
    },
  });

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    metadata: log.metadata,
    createdAt: log.createdAt,
    actorName: log.actor?.name ?? null,
    actorUsername: log.actor?.username ?? null,
  }));
}
