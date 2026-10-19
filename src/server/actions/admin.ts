"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";
import {
  type CourseType,
  type ReportStatus,
  ReviewStatus,
  type UserRole,
  type UserStatus,
} from "@/generated/prisma/client";
import { type ActionResult, actionError } from "@/lib/action-result";
import { writeAudit } from "@/lib/audit";
import { importCsv, previewCsv } from "@/lib/csv";
import type { CsvPreview } from "@/lib/csv-types";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  type CourseInput,
  courseInputSchema,
  csvTextSchema,
  type HideReviewInput,
  hideReviewSchema,
  type OfferingInput,
  offeringInputSchema,
  type ReportResolveInput,
  reportResolveSchema,
  type TagInput,
  tagActiveSchema,
  tagInputSchema,
  type UserRoleInput,
  type UserStatusInput,
  userRoleSchema,
  userStatusSchema,
} from "@/lib/validation/admin";

function fieldErrorsFrom(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() ?? "form";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return fieldErrors;
}

async function requireAdminActor() {
  const session = await getSession();
  if (!session?.user?.id) {
    return { ok: false, error: actionError("UNAUTHENTICATED", "请先登录") } as const;
  }
  const user = session.user as { role?: string; status?: string };
  if (user.status && user.status !== "ACTIVE") {
    return { ok: false, error: actionError("ACCOUNT_DISABLED", "账号当前不可用") } as const;
  }
  if (user.role !== "ADMIN") {
    return { ok: false, error: actionError("FORBIDDEN", "需要管理员权限") } as const;
  }
  return { ok: true, userId: session.user.id } as const;
}

function isUniqueError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/courses");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/tags");
  revalidatePath("/admin/users");
  revalidatePath("/admin/audit");
}

function revalidateCourse(courseId?: string) {
  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath("/leaderboards");
  revalidateAdmin();
  if (courseId) {
    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/admin/courses/${courseId}`);
  }
}

function revalidateReview(courseId: string, offeringId: string) {
  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
  revalidatePath(`/offerings/${offeringId}`);
  revalidatePath("/leaderboards");
  revalidatePath("/me/reviews");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin/reports");
}

export async function upsertCourseAction(
  input: CourseInput,
): Promise<ActionResult<{ courseId: string }>> {
  const parsed = courseInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("VALIDATION_ERROR", "请检查课程信息", fieldErrorsFrom(parsed.error));
  }
  const auth = await requireAdminActor();
  if (!auth.ok) {
    return auth.error;
  }

  const data = parsed.data;
  try {
    const college = await prisma.college.upsert({
      where: { name: data.college },
      update: {},
      create: { name: data.college },
    });

    const course = await prisma.$transaction(async (tx) => {
      const saved = data.id
        ? await tx.course.update({
            where: { id: data.id },
            data: {
              code: data.code,
              name: data.name,
              credits: data.credits ?? null,
              type: data.type as CourseType,
              collegeId: college.id,
              description: data.description || null,
            },
          })
        : await tx.course.create({
            data: {
              code: data.code,
              name: data.name,
              credits: data.credits ?? null,
              type: data.type as CourseType,
              collegeId: college.id,
              description: data.description || null,
            },
          });

      await writeAudit(tx, {
        actorId: auth.userId,
        action: data.id ? "COURSE_UPDATE" : "COURSE_CREATE",
        targetType: "Course",
        targetId: saved.id,
        metadata: { code: saved.code },
      });
      return saved;
    });

    revalidateCourse(course.id);
    return { ok: true, data: { courseId: course.id } };
  } catch (error) {
    if (isUniqueError(error)) {
      return actionError("CONFLICT", "课程代码已经存在");
    }
    throw error;
  }
}

export async function deleteCourseAction(
  courseId: string,
): Promise<ActionResult<{ deleted: true }>> {
  const auth = await requireAdminActor();
  if (!auth.ok) {
    return auth.error;
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, code: true, _count: { select: { offerings: true } } },
  });
  if (!course) {
    return actionError("NOT_FOUND", "课程不存在");
  }
  if (course._count.offerings > 0) {
    return actionError("HAS_OFFERINGS", "先删除这门课下的班次，再删除课程");
  }

  await prisma.$transaction(async (tx) => {
    await tx.course.delete({ where: { id: courseId } });
    await writeAudit(tx, {
      actorId: auth.userId,
      action: "COURSE_DELETE",
      targetType: "Course",
      targetId: courseId,
      metadata: { code: course.code },
    });
  });

  revalidateCourse();
  return { ok: true, data: { deleted: true } };
}

export async function upsertOfferingAction(
  input: OfferingInput,
): Promise<ActionResult<{ offeringId: string }>> {
  const parsed = offeringInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("VALIDATION_ERROR", "请检查班次信息", fieldErrorsFrom(parsed.error));
  }
  const auth = await requireAdminActor();
  if (!auth.ok) {
    return auth.error;
  }

  const data = parsed.data;
  const course = await prisma.course.findUnique({
    where: { id: data.courseId },
    select: { id: true, collegeId: true },
  });
  if (!course) {
    return actionError("NOT_FOUND", "课程不存在");
  }

  const instructorNames = Array.from(new Set(data.instructorNames));

  try {
    const offering = await prisma.$transaction(async (tx) => {
      const term = await tx.term.upsert({
        where: { name: data.term },
        update: {},
        create: { name: data.term },
      });

      const instructorIds: string[] = [];
      for (const name of instructorNames) {
        let instructor = await tx.instructor.findFirst({
          where: { name, collegeId: course.collegeId },
          select: { id: true },
        });
        if (!instructor) {
          instructor = await tx.instructor.create({
            data: { name, collegeId: course.collegeId },
            select: { id: true },
          });
        }
        instructorIds.push(instructor.id);
      }

      const saved = data.id
        ? await tx.offering.update({
            where: { id: data.id },
            data: {
              termId: term.id,
              section: data.section,
              campus: data.campus || null,
            },
          })
        : await tx.offering.create({
            data: {
              courseId: course.id,
              termId: term.id,
              section: data.section,
              campus: data.campus || null,
            },
          });

      if (data.id) {
        await tx.offeringInstructor.deleteMany({ where: { offeringId: saved.id } });
      }

      await tx.offeringInstructor.createMany({
        data: instructorIds.map((instructorId) => ({
          offeringId: saved.id,
          instructorId,
        })),
        skipDuplicates: true,
      });

      await writeAudit(tx, {
        actorId: auth.userId,
        action: data.id ? "OFFERING_UPDATE" : "OFFERING_CREATE",
        targetType: "Offering",
        targetId: saved.id,
        metadata: { courseId: course.id, term: data.term, section: data.section },
      });

      return saved;
    });

    revalidateCourse(course.id);
    revalidatePath(`/offerings/${offering.id}`);
    return { ok: true, data: { offeringId: offering.id } };
  } catch (error) {
    if (isUniqueError(error)) {
      return actionError("CONFLICT", "同一课程、学期和班次只能有一条记录");
    }
    throw error;
  }
}

export async function deleteOfferingAction(
  offeringId: string,
): Promise<ActionResult<{ deleted: true }>> {
  const auth = await requireAdminActor();
  if (!auth.ok) {
    return auth.error;
  }

  const offering = await prisma.offering.findUnique({
    where: { id: offeringId },
    select: {
      id: true,
      courseId: true,
      _count: { select: { reviews: true } },
    },
  });
  if (!offering) {
    return actionError("NOT_FOUND", "班次不存在");
  }
  if (offering._count.reviews > 0) {
    return actionError("HAS_REVIEWS", "先处理这个班次下的评价，再删除班次");
  }

  await prisma.$transaction(async (tx) => {
    await tx.offering.delete({ where: { id: offeringId } });
    await writeAudit(tx, {
      actorId: auth.userId,
      action: "OFFERING_DELETE",
      targetType: "Offering",
      targetId: offeringId,
      metadata: { courseId: offering.courseId },
    });
  });

  revalidateCourse(offering.courseId);
  return { ok: true, data: { deleted: true } };
}

export async function hideReviewAction(
  input: HideReviewInput,
): Promise<ActionResult<{ hidden: true }>> {
  const parsed = hideReviewSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("VALIDATION_ERROR", "请填写隐藏原因", fieldErrorsFrom(parsed.error));
  }
  const auth = await requireAdminActor();
  if (!auth.ok) {
    return auth.error;
  }

  const data = parsed.data;
  const review = await prisma.review.findUnique({
    where: { id: data.reviewId },
    select: {
      id: true,
      offeringId: true,
      offering: { select: { courseId: true } },
    },
  });
  if (!review) {
    return actionError("NOT_FOUND", "评价不存在");
  }

  await prisma.$transaction(async (tx) => {
    await tx.review.update({
      where: { id: data.reviewId },
      data: {
        status: ReviewStatus.HIDDEN,
        hiddenAt: new Date(),
        hiddenReason: data.reason,
      },
    });
    await writeAudit(tx, {
      actorId: auth.userId,
      action: "REVIEW_HIDE",
      targetType: "Review",
      targetId: data.reviewId,
      metadata: { reason: data.reason },
    });
  });

  revalidateReview(review.offering.courseId, review.offeringId);
  return { ok: true, data: { hidden: true } };
}

export async function restoreReviewAction(
  reviewId: string,
): Promise<ActionResult<{ restored: true }>> {
  const auth = await requireAdminActor();
  if (!auth.ok) {
    return auth.error;
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      offeringId: true,
      offering: { select: { courseId: true } },
    },
  });
  if (!review) {
    return actionError("NOT_FOUND", "评价不存在");
  }

  await prisma.$transaction(async (tx) => {
    await tx.review.update({
      where: { id: reviewId },
      data: {
        status: ReviewStatus.PUBLISHED,
        hiddenAt: null,
        hiddenReason: null,
      },
    });
    await writeAudit(tx, {
      actorId: auth.userId,
      action: "REVIEW_RESTORE",
      targetType: "Review",
      targetId: reviewId,
    });
  });

  revalidateReview(review.offering.courseId, review.offeringId);
  return { ok: true, data: { restored: true } };
}

export async function publishReviewAction(
  reviewId: string,
): Promise<ActionResult<{ published: true }>> {
  const auth = await requireAdminActor();
  if (!auth.ok) {
    return auth.error;
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      offeringId: true,
      offering: { select: { courseId: true } },
    },
  });
  if (!review) {
    return actionError("NOT_FOUND", "评价不存在");
  }

  await prisma.$transaction(async (tx) => {
    await tx.review.update({
      where: { id: reviewId },
      data: {
        status: ReviewStatus.PUBLISHED,
        hiddenAt: null,
        hiddenReason: null,
      },
    });
    await writeAudit(tx, {
      actorId: auth.userId,
      action: "REVIEW_PUBLISH",
      targetType: "Review",
      targetId: reviewId,
    });
  });

  revalidateReview(review.offering.courseId, review.offeringId);
  return { ok: true, data: { published: true } };
}

export async function adminDeleteReviewAction(
  reviewId: string,
): Promise<ActionResult<{ deleted: true }>> {
  const auth = await requireAdminActor();
  if (!auth.ok) {
    return auth.error;
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      offeringId: true,
      offering: { select: { courseId: true } },
    },
  });
  if (!review) {
    return actionError("NOT_FOUND", "评价不存在");
  }

  await prisma.$transaction(async (tx) => {
    await tx.review.update({
      where: { id: reviewId },
      data: { status: ReviewStatus.DELETED },
    });
    await writeAudit(tx, {
      actorId: auth.userId,
      action: "REVIEW_DELETE",
      targetType: "Review",
      targetId: reviewId,
    });
  });

  revalidateReview(review.offering.courseId, review.offeringId);
  return { ok: true, data: { deleted: true } };
}

export async function resolveReportAction(
  input: ReportResolveInput,
): Promise<ActionResult<{ resolved: true }>> {
  const parsed = reportResolveSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("VALIDATION_ERROR", "请检查处理信息", fieldErrorsFrom(parsed.error));
  }
  const auth = await requireAdminActor();
  if (!auth.ok) {
    return auth.error;
  }

  const data = parsed.data;
  const report = await prisma.report.findUnique({
    where: { id: data.reportId },
    select: {
      id: true,
      reviewId: true,
      review: {
        select: {
          offeringId: true,
          offering: { select: { courseId: true } },
        },
      },
    },
  });
  if (!report) {
    return actionError("NOT_FOUND", "举报不存在");
  }

  const resolved = data.status === "RESOLVED" || data.status === "REJECTED";

  await prisma.$transaction(async (tx) => {
    await tx.report.update({
      where: { id: data.reportId },
      data: {
        status: data.status as ReportStatus,
        handledById: auth.userId,
        handledAt: resolved ? new Date() : null,
        resolutionNote: data.note || null,
      },
    });
    await writeAudit(tx, {
      actorId: auth.userId,
      action: `REPORT_${data.status}`,
      targetType: "Report",
      targetId: data.reportId,
      metadata: { reviewId: report.reviewId, note: data.note || null },
    });
  });

  revalidateReview(report.review.offering.courseId, report.review.offeringId);
  revalidatePath("/admin/reports");
  return { ok: true, data: { resolved: true } };
}

export async function setUserRoleAction(
  input: UserRoleInput,
): Promise<ActionResult<{ updated: true }>> {
  const parsed = userRoleSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("VALIDATION_ERROR", "请选择有效角色");
  }
  const auth = await requireAdminActor();
  if (!auth.ok) {
    return auth.error;
  }
  if (parsed.data.userId === auth.userId) {
    return actionError("FORBIDDEN", "不能修改自己的角色");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: parsed.data.userId },
      data: { role: parsed.data.role as UserRole },
    });
    await writeAudit(tx, {
      actorId: auth.userId,
      action: "USER_ROLE_UPDATE",
      targetType: "User",
      targetId: parsed.data.userId,
      metadata: { role: parsed.data.role },
    });
  });

  revalidateAdmin();
  return { ok: true, data: { updated: true } };
}

export async function setUserStatusAction(
  input: UserStatusInput,
): Promise<ActionResult<{ updated: true }>> {
  const parsed = userStatusSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("VALIDATION_ERROR", "请填写封禁原因", fieldErrorsFrom(parsed.error));
  }
  const auth = await requireAdminActor();
  if (!auth.ok) {
    return auth.error;
  }
  if (parsed.data.userId === auth.userId) {
    return actionError("FORBIDDEN", "不能封禁自己");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: parsed.data.userId },
      data: { status: parsed.data.status as UserStatus },
    });
    if (parsed.data.status === "SUSPENDED") {
      await tx.session.deleteMany({ where: { userId: parsed.data.userId } });
    }
    await writeAudit(tx, {
      actorId: auth.userId,
      action: parsed.data.status === "SUSPENDED" ? "USER_SUSPEND" : "USER_UNSUSPEND",
      targetType: "User",
      targetId: parsed.data.userId,
      metadata: { reason: parsed.data.reason },
    });
  });

  revalidateAdmin();
  return { ok: true, data: { updated: true } };
}

export async function upsertTagAction(input: TagInput): Promise<ActionResult<{ tagId: string }>> {
  const parsed = tagInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("VALIDATION_ERROR", "请检查标签信息", fieldErrorsFrom(parsed.error));
  }
  const auth = await requireAdminActor();
  if (!auth.ok) {
    return auth.error;
  }

  const data = parsed.data;
  try {
    const tag = await prisma.$transaction(async (tx) => {
      const saved = data.id
        ? await tx.tag.update({
            where: { id: data.id },
            data: {
              name: data.name,
              isActive: data.isActive ?? true,
            },
          })
        : await tx.tag.create({
            data: {
              name: data.name,
              slug: `tag-${randomUUID().slice(0, 8)}`,
              isActive: data.isActive ?? true,
            },
          });

      await writeAudit(tx, {
        actorId: auth.userId,
        action: data.id ? "TAG_UPDATE" : "TAG_CREATE",
        targetType: "Tag",
        targetId: saved.id,
        metadata: { name: saved.name, isActive: saved.isActive },
      });
      return saved;
    });

    revalidateAdmin();
    return { ok: true, data: { tagId: tag.id } };
  } catch (error) {
    if (isUniqueError(error)) {
      return actionError("CONFLICT", "标签名已经存在");
    }
    throw error;
  }
}

export async function setTagActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult<{ updated: true }>> {
  const parsed = tagActiveSchema.safeParse({ id, isActive });
  if (!parsed.success) {
    return actionError("VALIDATION_ERROR", "标签参数不正确");
  }
  const auth = await requireAdminActor();
  if (!auth.ok) {
    return auth.error;
  }

  await prisma.$transaction(async (tx) => {
    await tx.tag.update({
      where: { id: parsed.data.id },
      data: { isActive: parsed.data.isActive },
    });
    await writeAudit(tx, {
      actorId: auth.userId,
      action: parsed.data.isActive ? "TAG_ENABLE" : "TAG_DISABLE",
      targetType: "Tag",
      targetId: parsed.data.id,
    });
  });

  revalidateAdmin();
  return { ok: true, data: { updated: true } };
}

export async function previewCsvAction(csvText: string): Promise<ActionResult<CsvPreview>> {
  const parsed = csvTextSchema.safeParse(csvText);
  if (!parsed.success) {
    return actionError("VALIDATION_ERROR", "CSV 内容为空或过大");
  }
  const auth = await requireAdminActor();
  if (!auth.ok) {
    return auth.error;
  }

  try {
    const preview = await previewCsv(parsed.data);
    return { ok: true, data: preview };
  } catch (error) {
    return actionError(
      "CSV_PARSE_ERROR",
      `CSV 解析失败：${error instanceof Error ? error.message : "未知错误"}`,
    );
  }
}

export async function importCoursesCsvAction(
  csvText: string,
): Promise<ActionResult<{ rows: number; courses: number; offerings: number }>> {
  const parsed = csvTextSchema.safeParse(csvText);
  if (!parsed.success) {
    return actionError("VALIDATION_ERROR", "CSV 内容为空或过大");
  }
  const auth = await requireAdminActor();
  if (!auth.ok) {
    return auth.error;
  }

  try {
    const stats = await importCsv(parsed.data);
    await prisma.auditLog.create({
      data: {
        actorId: auth.userId,
        action: "CSV_IMPORT",
        targetType: "Course",
        metadata: {
          rows: stats.rows,
          courses: stats.courses,
          offerings: stats.offerings,
        },
      },
    });
    revalidateCourse();
    revalidatePath("/admin/audit");
    return {
      ok: true,
      data: {
        rows: stats.rows,
        courses: stats.courses,
        offerings: stats.offerings,
      },
    };
  } catch (error) {
    return actionError("CSV_IMPORT_FAILED", error instanceof Error ? error.message : "导入失败");
  }
}
