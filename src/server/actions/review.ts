"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { ReviewStatus } from "@/generated/prisma/client";
import { type ActionResult, actionError } from "@/lib/action-result";
import { EDIT_WINDOW_DAYS, NEW_ACCOUNT, RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { canEditReview } from "@/lib/review-window";
import { getSession } from "@/lib/session";
import {
  type ReviewInput,
  type ReviewUpdateInput,
  reviewCreateSchema,
  reviewUpdateSchema,
} from "@/lib/validation/review";

function fieldErrorsFrom(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() ?? "form";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return fieldErrors;
}

async function requireActiveSession() {
  const session = await getSession();
  if (!session?.user?.id) {
    return { ok: false, error: actionError("UNAUTHENTICATED", "请先登录") } as const;
  }
  const status = (session.user as { status?: string }).status ?? "ACTIVE";
  if (status !== "ACTIVE") {
    return { ok: false, error: actionError("ACCOUNT_DISABLED", "账号当前不可用") } as const;
  }
  return { ok: true, session } as const;
}

async function determineStatus(userId: string) {
  if (process.env.REVIEW_MODERATION_ENABLED !== "true") {
    return { ok: true, status: ReviewStatus.PUBLISHED } as const;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });
  if (!user) {
    return { ok: false, error: actionError("NOT_FOUND", "用户不存在") } as const;
  }
  const cooldownMs = NEW_ACCOUNT.cooldownMinutes * 60 * 1000;
  if (Date.now() - user.createdAt.getTime() < cooldownMs) {
    return {
      ok: false,
      error: actionError(
        "ACCOUNT_COOLDOWN",
        `注册后 ${NEW_ACCOUNT.cooldownMinutes} 分钟内不能发布评价`,
      ),
    } as const;
  }

  const count = await prisma.reviewAuthor.count({ where: { userId } });
  return {
    ok: true,
    status: count < NEW_ACCOUNT.pendingReviewCount ? ReviewStatus.PENDING : ReviewStatus.PUBLISHED,
  } as const;
}

async function resolveTagIds(names: string[]) {
  const unique = Array.from(new Set(names.map((name) => name.trim()).filter(Boolean)));
  if (unique.length === 0) {
    return { ok: true, ids: [] as string[] } as const;
  }
  const tags = await prisma.tag.findMany({
    where: { name: { in: unique }, isActive: true },
    select: { id: true, name: true },
  });
  if (tags.length !== unique.length) {
    return {
      ok: false,
      error: actionError("INVALID_TAG", "包含不可用的标签，请刷新后重试"),
    } as const;
  }
  return { ok: true, ids: tags.map((tag) => tag.id) } as const;
}

function revalidateReviewPaths(courseId: string, offeringId: string): void {
  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
  revalidatePath(`/offerings/${offeringId}`);
  revalidatePath("/me");
  revalidatePath("/me/reviews");
  revalidatePath("/leaderboards");
}

export async function createReviewAction(
  input: ReviewInput,
): Promise<ActionResult<{ reviewId: string; status: ReviewStatus }>> {
  const parsed = reviewCreateSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("VALIDATION_ERROR", "请检查表单", fieldErrorsFrom(parsed.error));
  }

  const auth = await requireActiveSession();
  if (!auth.ok) {
    return auth.error;
  }

  const userId = auth.session.user.id;
  const hourly = checkRateLimit(
    `review:hour:${userId}`,
    RATE_LIMITS.reviewsPerHour,
    60 * 60 * 1000,
  );
  if (!hourly.ok) {
    return actionError("RATE_LIMITED", "发评价太频繁，请稍后再试");
  }
  const daily = checkRateLimit(
    `review:day:${userId}`,
    RATE_LIMITS.reviewsPerDay,
    24 * 60 * 60 * 1000,
  );
  if (!daily.ok) {
    return actionError("RATE_LIMITED", "今天发评价次数已达上限");
  }

  const data = parsed.data;

  const offering = await prisma.offering.findUnique({
    where: { id: data.offeringId },
    select: { id: true, courseId: true },
  });
  if (!offering) {
    return actionError("NOT_FOUND", "班次不存在");
  }

  const existing = await prisma.reviewAuthor.findUnique({
    where: { userId_offeringId: { userId, offeringId: data.offeringId } },
    select: { reviewId: true },
  });
  if (existing) {
    return actionError("ALREADY_REVIEWED", "你已经评价过这个班次，可以编辑原评价", {
      offeringId: ["同一班次只能写一条评价"],
    });
  }

  const moderation = await determineStatus(userId);
  if (!moderation.ok) {
    return moderation.error;
  }

  const tags = await resolveTagIds(data.tags ?? []);
  if (!tags.ok) {
    return tags.error;
  }

  const review = await prisma.review.create({
    data: {
      offeringId: data.offeringId,
      difficulty: data.difficulty,
      workload: data.workload,
      recommendation: data.recommendation,
      grading: data.grading ?? null,
      teaching: data.teaching ?? null,
      assessment: data.assessment,
      content: data.content,
      status: moderation.status,
      author: {
        create: {
          userId,
          offeringId: data.offeringId,
        },
      },
      tags:
        tags.ids.length > 0
          ? {
              create: tags.ids.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
    },
    select: { id: true, status: true },
  });

  revalidateReviewPaths(offering.courseId, data.offeringId);
  return { ok: true, data: { reviewId: review.id, status: review.status } };
}

export async function updateReviewAction(
  input: ReviewUpdateInput,
): Promise<ActionResult<{ status: ReviewStatus }>> {
  const parsed = reviewUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("VALIDATION_ERROR", "请检查表单", fieldErrorsFrom(parsed.error));
  }

  const auth = await requireActiveSession();
  if (!auth.ok) {
    return auth.error;
  }

  const userId = auth.session.user.id;
  const edits = checkRateLimit(
    `review:edit:${userId}`,
    RATE_LIMITS.editsPerDay,
    24 * 60 * 60 * 1000,
  );
  if (!edits.ok) {
    return actionError("RATE_LIMITED", "今天编辑次数已达上限");
  }

  const data = parsed.data;

  const author = await prisma.reviewAuthor.findUnique({
    where: { reviewId: data.reviewId },
    select: {
      userId: true,
      offeringId: true,
      review: {
        select: {
          createdAt: true,
          status: true,
          offering: { select: { courseId: true } },
        },
      },
    },
  });

  if (!author) {
    return actionError("NOT_FOUND", "评价不存在");
  }
  if (author.userId !== userId) {
    return actionError("FORBIDDEN", "只能编辑自己的评价");
  }
  if (
    author.review.status === ReviewStatus.DELETED ||
    author.review.status === ReviewStatus.HIDDEN
  ) {
    return actionError("NOT_EDITABLE", "这条评价当前不可编辑");
  }
  if (!canEditReview(author.review.createdAt)) {
    return actionError(
      "EDIT_WINDOW_EXPIRED",
      `发布后 ${EDIT_WINDOW_DAYS} 天内可以编辑，请联系管理员`,
    );
  }

  const tags = await resolveTagIds(data.tags ?? []);
  if (!tags.ok) {
    return tags.error;
  }

  await prisma.$transaction(async (tx) => {
    await tx.review.update({
      where: { id: data.reviewId },
      data: {
        difficulty: data.difficulty,
        workload: data.workload,
        recommendation: data.recommendation,
        grading: data.grading ?? null,
        teaching: data.teaching ?? null,
        assessment: data.assessment,
        content: data.content,
        editedAt: new Date(),
      },
    });

    await tx.reviewTag.deleteMany({ where: { reviewId: data.reviewId } });
    if (tags.ids.length > 0) {
      await tx.reviewTag.createMany({
        data: tags.ids.map((tagId) => ({ reviewId: data.reviewId, tagId })),
      });
    }
  });

  revalidateReviewPaths(author.review.offering.courseId, author.offeringId);
  return { ok: true, data: { status: author.review.status } };
}

export async function deleteReviewAction(
  reviewId: string,
): Promise<ActionResult<{ deleted: true }>> {
  const auth = await requireActiveSession();
  if (!auth.ok) {
    return auth.error;
  }

  const userId = auth.session.user.id;
  const author = await prisma.reviewAuthor.findUnique({
    where: { reviewId },
    select: {
      userId: true,
      offeringId: true,
      review: {
        select: {
          status: true,
          offering: { select: { courseId: true } },
        },
      },
    },
  });

  if (!author) {
    return actionError("NOT_FOUND", "评价不存在");
  }
  if (author.userId !== userId) {
    return actionError("FORBIDDEN", "只能删除自己的评价");
  }
  if (author.review.status === ReviewStatus.DELETED) {
    return { ok: true, data: { deleted: true } };
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: { status: ReviewStatus.DELETED },
  });

  revalidateReviewPaths(author.review.offering.courseId, author.offeringId);
  return { ok: true, data: { deleted: true } };
}
