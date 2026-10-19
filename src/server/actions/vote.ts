"use server";

import { revalidatePath } from "next/cache";
import { ReviewStatus } from "@/generated/prisma/client";
import { type ActionResult, actionError } from "@/lib/action-result";
import { RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

function revalidateVotePaths(courseId: string, offeringId: string): void {
  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
  revalidatePath(`/offerings/${offeringId}`);
  revalidatePath("/me/reviews");
}

export async function toggleHelpfulAction(
  reviewId: string,
): Promise<ActionResult<{ active: boolean; helpfulCount: number }>> {
  const session = await getSession();
  if (!session?.user?.id) {
    return actionError("UNAUTHENTICATED", "请先登录");
  }

  const status = (session.user as { status?: string }).status;
  if (status && status !== "ACTIVE") {
    return actionError("ACCOUNT_DISABLED", "账号当前不可用");
  }

  const userId = session.user.id;
  const voteLimit = checkRateLimit(`vote:hour:${userId}`, RATE_LIMITS.votesPerHour, 60 * 60 * 1000);
  if (!voteLimit.ok) {
    return actionError("RATE_LIMITED", "点有用太频繁，请稍后再试");
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      status: true,
      offeringId: true,
      offering: { select: { courseId: true } },
      author: { select: { userId: true } },
    },
  });

  if (!review) {
    return actionError("NOT_FOUND", "评价不存在");
  }
  if (review.status !== ReviewStatus.PUBLISHED) {
    return actionError("NOT_AVAILABLE", "这条评价当前不可投票");
  }
  if (review.author?.userId === userId) {
    return actionError("FORBIDDEN", "不能给自己的评价投票");
  }

  const existing = await prisma.reviewVote.findUnique({
    where: { reviewId_userId: { reviewId, userId } },
    select: { reviewId: true },
  });

  if (existing) {
    const [, updated] = await prisma.$transaction([
      prisma.reviewVote.delete({ where: { reviewId_userId: { reviewId, userId } } }),
      prisma.review.update({
        where: { id: reviewId },
        data: { helpfulCount: { decrement: 1 } },
        select: { helpfulCount: true },
      }),
    ]);
    revalidateVotePaths(review.offering.courseId, review.offeringId);
    return {
      ok: true,
      data: { active: false, helpfulCount: Math.max(0, updated.helpfulCount) },
    };
  }

  const [, updated] = await prisma.$transaction([
    prisma.reviewVote.create({ data: { reviewId, userId } }),
    prisma.review.update({
      where: { id: reviewId },
      data: { helpfulCount: { increment: 1 } },
      select: { helpfulCount: true },
    }),
  ]);

  revalidateVotePaths(review.offering.courseId, review.offeringId);
  return { ok: true, data: { active: true, helpfulCount: updated.helpfulCount } };
}
