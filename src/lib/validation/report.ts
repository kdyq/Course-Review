import { z } from "zod";
import { REPORT_REASON_VALUES } from "@/lib/constants";

export const reportInputSchema = z.object({
  reviewId: z.string().min(1),
  reason: z.enum(REPORT_REASON_VALUES),
  detail: z.string().trim().max(500, "补充说明最多 500 个字符").optional(),
});

export type ReportInput = z.infer<typeof reportInputSchema>;
