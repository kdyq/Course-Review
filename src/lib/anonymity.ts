export type PublicReviewTag = {
  id: string;
  name: string;
};

export type PublicReview = {
  id: string;
  offeringId: string;
  difficulty: number;
  workload: number;
  recommendation: number;
  grading: number | null;
  teaching: number | null;
  assessment: string[];
  content: string;
  tags: PublicReviewTag[];
  helpfulCount: number;
  createdAt: string;
  editedAt: string | null;
  status: "PUBLISHED";
  instructorResponse: { content: string } | null;
};

type ReviewLike = {
  id: string;
  offeringId: string;
  difficulty: number;
  workload: number;
  recommendation: number;
  grading: number | null;
  teaching: number | null;
  assessment: string[];
  content: string;
  helpfulCount: number;
  createdAt: Date;
  editedAt: Date | null;
  tags: Array<{ tag: PublicReviewTag }>;
  response: { content: string } | null;
};

/**
 * 公开评价 DTO。只允许这里列出的字段进入公开页面，禁止直接返回 Prisma 实体。
 */
export function toPublicReview(review: ReviewLike): PublicReview {
  return {
    id: review.id,
    offeringId: review.offeringId,
    difficulty: review.difficulty,
    workload: review.workload,
    recommendation: review.recommendation,
    grading: review.grading,
    teaching: review.teaching,
    assessment: review.assessment,
    content: review.content,
    tags: review.tags.map((item) => ({ id: item.tag.id, name: item.tag.name })),
    helpfulCount: review.helpfulCount,
    createdAt: review.createdAt.toISOString(),
    editedAt: review.editedAt ? review.editedAt.toISOString() : null,
    status: "PUBLISHED",
    instructorResponse: review.response ? { content: review.response.content } : null,
  };
}
