import { z } from "zod";
import {
  ASSESSMENT_VALUES,
  MAX_TAGS_PER_REVIEW,
  REVIEW_CONTENT_MAX,
  REVIEW_CONTENT_MIN,
} from "@/lib/constants";

const score = z.number().int().min(1, "请选择 1 到 5 分").max(5, "请选择 1 到 5 分");

const optionalScore = z
  .number()
  .int()
  .min(1, "请选择 1 到 5 分")
  .max(5, "请选择 1 到 5 分")
  .nullable()
  .optional();

export const reviewInputSchema = z.object({
  offeringId: z.string().min(1),
  difficulty: score,
  workload: score,
  recommendation: score,
  grading: optionalScore,
  teaching: optionalScore,
  assessment: z.array(z.enum(ASSESSMENT_VALUES)).max(8),
  content: z
    .string()
    .trim()
    .min(REVIEW_CONTENT_MIN, `评价正文至少 ${REVIEW_CONTENT_MIN} 个字符`)
    .max(REVIEW_CONTENT_MAX, `评价正文最多 ${REVIEW_CONTENT_MAX} 个字符`),
  tags: z.array(z.string().trim().min(1)).max(MAX_TAGS_PER_REVIEW).optional(),
});

export type ReviewInput = z.infer<typeof reviewInputSchema>;

export const reviewFormSchema = reviewInputSchema.omit({ offeringId: true });
export type ReviewFormValues = z.infer<typeof reviewFormSchema>;

export const reviewCreateSchema = reviewInputSchema;

export const reviewUpdateSchema = reviewInputSchema
  .omit({ offeringId: true })
  .extend({ reviewId: z.string().min(1) });

export type ReviewUpdateInput = z.infer<typeof reviewUpdateSchema>;
