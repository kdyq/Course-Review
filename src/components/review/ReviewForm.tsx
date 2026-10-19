"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Control, Controller, useForm } from "react-hook-form";
import { StarRating } from "@/components/zine/StarRating";
import { zineCardClass } from "@/components/zine/ZineCard";
import {
  ASSESSMENT_OPTIONS,
  type AssessmentValue,
  MAX_TAGS_PER_REVIEW,
  REVIEW_CONTENT_MAX,
  REVIEW_CONTENT_MIN,
  SCORE_HINTS,
  SCORE_LABELS,
} from "@/lib/constants";
import { type ReviewFormValues, reviewFormSchema } from "@/lib/validation/review";
import { createReviewAction, updateReviewAction } from "@/server/actions/review";

export type ReviewFormInitial = {
  reviewId: string;
  difficulty: number;
  workload: number;
  recommendation: number;
  grading: number | null;
  teaching: number | null;
  assessment: string[];
  content: string;
  tags: string[];
};

type ScoreName = "difficulty" | "workload" | "recommendation" | "grading" | "teaching";

function ScoreField({
  control,
  name,
  optional = false,
  error,
}: {
  control: Control<ReviewFormValues>;
  name: ScoreName;
  optional?: boolean;
  error?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="field">
          <span className="label">
            {SCORE_LABELS[name]}
            {optional ? <span>（可选）</span> : null}
          </span>
          <div className="row">
            <StarRating
              mode="input"
              value={field.value ?? 0}
              onChange={(value) => field.onChange(value)}
              label={SCORE_LABELS[name]}
            />
            {optional && field.value ? (
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => field.onChange(null)}
              >
                清除
              </button>
            ) : null}
          </div>
          <span className="form-hint">{SCORE_HINTS[name]}</span>
          {error ? <span className="form-error">{error}</span> : null}
        </div>
      )}
    />
  );
}

export function ReviewForm({
  offeringId,
  initial,
  tagOptions,
}: {
  offeringId: string;
  initial?: ReviewFormInitial;
  tagOptions: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const editMode = Boolean(initial);
  const [serverError, setServerError] = useState<string | null>(null);
  const [tagHint, setTagHint] = useState<string | null>(null);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      difficulty: initial?.difficulty ?? 0,
      workload: initial?.workload ?? 0,
      recommendation: initial?.recommendation ?? 0,
      grading: initial?.grading ?? null,
      teaching: initial?.teaching ?? null,
      assessment: (initial?.assessment ?? []) as ReviewFormValues["assessment"],
      content: initial?.content ?? "",
      tags: initial?.tags ?? [],
    },
  });

  const assessment = form.watch("assessment");
  const selectedTags = form.watch("tags") ?? [];
  const content = form.watch("content");

  function toggleAssessment(value: AssessmentValue) {
    const next: AssessmentValue[] = assessment.includes(value)
      ? assessment.filter((item) => item !== value)
      : [...assessment, value];
    form.setValue("assessment", next, { shouldValidate: true, shouldDirty: true });
  }

  function toggleTag(name: string) {
    if (selectedTags.includes(name)) {
      setTagHint(null);
      form.setValue(
        "tags",
        selectedTags.filter((item) => item !== name),
        { shouldValidate: true, shouldDirty: true },
      );
      return;
    }
    if (selectedTags.length >= MAX_TAGS_PER_REVIEW) {
      setTagHint(`最多选择 ${MAX_TAGS_PER_REVIEW} 个标签`);
      return;
    }
    setTagHint(null);
    form.setValue("tags", [...selectedTags, name], {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  async function onSubmit(values: ReviewFormValues) {
    setServerError(null);

    const result =
      editMode && initial
        ? await updateReviewAction({
            reviewId: initial.reviewId,
            difficulty: values.difficulty,
            workload: values.workload,
            recommendation: values.recommendation,
            grading: values.grading ?? null,
            teaching: values.teaching ?? null,
            assessment: values.assessment,
            content: values.content,
            tags: values.tags ?? [],
          })
        : await createReviewAction({
            offeringId,
            difficulty: values.difficulty,
            workload: values.workload,
            recommendation: values.recommendation,
            grading: values.grading ?? null,
            teaching: values.teaching ?? null,
            assessment: values.assessment,
            content: values.content,
            tags: values.tags ?? [],
          });

    if (!result.ok) {
      setServerError(result.error.message);
      if (result.error.fieldErrors) {
        for (const [field, messages] of Object.entries(result.error.fieldErrors)) {
          if (field in values) {
            form.setError(field as keyof ReviewFormValues, { message: messages[0] });
          }
        }
      }
      return;
    }

    router.push(`/offerings/${offeringId}`);
    router.refresh();
  }

  const errors = form.formState.errors;

  return (
    <form className="stack" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className={zineCardClass({ pad: true, className: "stack" })}>
        <h2>三项必填评分</h2>
        <ScoreField control={form.control} name="difficulty" error={errors.difficulty?.message} />
        <ScoreField control={form.control} name="workload" error={errors.workload?.message} />
        <ScoreField
          control={form.control}
          name="recommendation"
          error={errors.recommendation?.message}
        />

        <h2 className="section-action">两项可选评分</h2>
        <div className="field-row">
          <ScoreField
            control={form.control}
            name="grading"
            optional
            error={errors.grading?.message}
          />
          <ScoreField
            control={form.control}
            name="teaching"
            optional
            error={errors.teaching?.message}
          />
        </div>
      </div>

      <div className={zineCardClass({ pad: true, className: "stack" })}>
        <h2>考核方式</h2>
        <p className="form-hint">可以多选。写清楚考试、论文、实验和平时分的比例更有用。</p>
        <fieldset className="chip-group">
          <legend className="sr-only">考核方式</legend>
          {ASSESSMENT_OPTIONS.map((option) => {
            const active = assessment.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                className={`chip${active ? " chip--active" : ""}`}
                aria-pressed={active}
                onClick={() => toggleAssessment(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </fieldset>
      </div>

      <div className={zineCardClass({ pad: true, className: "stack" })}>
        <h2>标签</h2>
        <p className="form-hint">
          最多选择 {MAX_TAGS_PER_REVIEW} 个。已选 {selectedTags.length} 个。
        </p>
        <fieldset className="chip-group">
          <legend className="sr-only">标签</legend>
          {tagOptions.map((tag) => {
            const active = selectedTags.includes(tag.name);
            return (
              <button
                key={tag.id}
                type="button"
                className={`chip${active ? " chip--active" : ""}`}
                aria-pressed={active}
                onClick={() => toggleTag(tag.name)}
              >
                {tag.name}
              </button>
            );
          })}
        </fieldset>
        {tagHint ? (
          <p className="form-error" role="status">
            {tagHint}
          </p>
        ) : null}
      </div>

      <div className={zineCardClass({ pad: true, className: "stack" })}>
        <h2>评价正文</h2>
        <label className="label" htmlFor="review-content">
          写下你的真实体验
        </label>
        <textarea
          id="review-content"
          className="textarea"
          maxLength={REVIEW_CONTENT_MAX}
          aria-invalid={Boolean(errors.content)}
          aria-describedby="review-content-hint"
          {...form.register("content")}
        />
        <div className="row-between">
          <span className="form-hint" id="review-content-hint">
            至少 {REVIEW_CONTENT_MIN} 个字符，最多 {REVIEW_CONTENT_MAX}{" "}
            个。不要写个人隐私和人身攻击。
          </span>
          <span className="mono muted">
            {content.length} / {REVIEW_CONTENT_MAX}
          </span>
        </div>
        {errors.content ? <span className="form-error">{errors.content.message}</span> : null}
      </div>

      {serverError ? (
        <p className="form-error" role="alert" aria-live="polite">
          {serverError}
        </p>
      ) : null}

      <div className="row-between">
        <div className="row">
          <button type="submit" className="btn btn-primary" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "保存中..." : editMode ? "保存修改" : "发布评价"}
          </button>
          <Link href={`/offerings/${offeringId}`} className="btn btn-secondary">
            取消
          </Link>
        </div>
        <span className="form-hint">发布后 7 天内可以编辑。</span>
      </div>
    </form>
  );
}
