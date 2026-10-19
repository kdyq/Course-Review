import "server-only";
import type { Prisma } from "@/generated/prisma/client";

export type AuditInput = {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

/**
 * 审计日志只记录操作、目标 ID 和必要元数据，不记录评价正文和用户邮箱。
 */
export async function writeAudit(tx: Prisma.TransactionClient, input: AuditInput): Promise<void> {
  await tx.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      metadata: input.metadata,
    },
  });
}
