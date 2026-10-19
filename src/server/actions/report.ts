"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";
import { ReportStatus, ReviewStatus } from "@/generated/prisma/client";
import { type ActionResult, actionError } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { type ReportInput, reportInputSchema } from "@/lib/validation/report";

function fieldErrorsFrom(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() ?? "form";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return fieldErrors;
}

export async function createReportAction(
  input: ReportInput,
): Promise<ActionResult<{ reported: true }>> {
  const parsed = reportInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("VALIDATION_ERROR", "请检查举报内容", fieldErrorsFrom(parsed.error));
  }

  const session = await getSession();
  if (!session?.user?.id) {
    return actionError("UNAUTHENTICATED", "请先登录");
  }

  const status = (session.user as { status?: string }).status;
  if (status && status !== "ACTIVE") {
    return actionError("ACCOUNT_DISABLED", "账号当前不可用");
  }

  const userId = session.user.id;
  const data = parsed.data;
  const review = await prisma.review.findUnique({
    where: { id: data.reviewId },
    select: {
      status: true,
      author: { select: { userId: true } },
    },
  });

  if (!review) {
    return actionError("NOT_FOUND", "评价不存在");
  }
  if (review.author?.userId === userId) {
    return actionError("FORBIDDEN", "不能举报自己的评价");
  }
  if (review.status !== ReviewStatus.PUBLISHED) {
    return actionError("NOT_AVAILABLE", "这条评价当前不可举报");
  }

  const existing = await prisma.report.findFirst({
    where: {
      reviewId: data.reviewId,
      reporterId: userId,
      status: { in: [ReportStatus.PENDING, ReportStatus.REVIEWING] },
    },
    select: { id: true },
  });
  if (existing) {
    return actionError("ALREADY_REPORTED", "你已经举报过这条评价，管理员会处理");
  }

  await prisma.report.create({
    data: {
      reviewId: data.reviewId,
      reporterId: userId,
      reason: data.reason,
      detail: data.detail || null,
      status: ReportStatus.PENDING,
    },
  });

  revalidatePath("/admin/reports");
  return { ok: true, data: { reported: true } };
}
