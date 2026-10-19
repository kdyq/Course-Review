import { z } from "zod";
import { COURSE_TYPE_VALUES } from "@/lib/constants";

export const courseInputSchema = z.object({
  id: z.string().min(1).optional(),
  code: z.string().trim().min(1, "课程代码必填").max(20),
  name: z.string().trim().min(1, "课程名称必填").max(100),
  credits: z.number().min(0, "学分不能小于 0").max(10, "学分不能大于 10").nullable().optional(),
  type: z.enum(COURSE_TYPE_VALUES),
  college: z.string().trim().min(1, "学院必填").max(50),
  description: z.string().trim().max(2000, "简介最多 2000 个字符").optional(),
});

export type CourseInput = z.infer<typeof courseInputSchema>;

export const offeringInputSchema = z.object({
  id: z.string().min(1).optional(),
  courseId: z.string().min(1),
  term: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{4}-[12]$/, "学期格式应为 2026-2027-1"),
  section: z.string().trim().min(1).max(10).default("01"),
  campus: z.string().trim().max(50).optional(),
  instructorNames: z
    .array(z.string().trim().min(1).max(50))
    .min(1, "至少填写一位教师")
    .max(3, "最多三位教师"),
});

export type OfferingInput = z.infer<typeof offeringInputSchema>;

export const hideReviewSchema = z.object({
  reviewId: z.string().min(1),
  reason: z.string().trim().min(1, "隐藏原因必填").max(500),
});

export type HideReviewInput = z.infer<typeof hideReviewSchema>;

export const reportResolveSchema = z.object({
  reportId: z.string().min(1),
  status: z.enum(["REVIEWING", "RESOLVED", "REJECTED"]),
  note: z.string().trim().max(500).optional(),
});

export type ReportResolveInput = z.infer<typeof reportResolveSchema>;

export const userRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["STUDENT", "ADMIN"]),
});

export type UserRoleInput = z.infer<typeof userRoleSchema>;

export const userStatusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
  reason: z.string().trim().min(1, "封禁原因必填").max(200),
});

export type UserStatusInput = z.infer<typeof userStatusSchema>;

export const tagInputSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1, "标签名必填").max(20),
  isActive: z.boolean().optional(),
});

export type TagInput = z.infer<typeof tagInputSchema>;

export const tagActiveSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean(),
});

export const csvTextSchema = z.string().min(1, "CSV 内容为空").max(200_000);
