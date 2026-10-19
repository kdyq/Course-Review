"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { COURSE_TYPE_LABELS, COURSE_TYPE_VALUES, type CourseTypeValue } from "@/lib/constants";
import { upsertCourseAction } from "@/server/actions/admin";

export type CourseFormInitial = {
  id: string;
  code: string;
  name: string;
  credits: number | null;
  type: CourseTypeValue;
  college: string;
  description: string | null;
};

export function CourseForm({
  colleges,
  initial,
}: {
  colleges: string[];
  initial?: CourseFormInitial;
}) {
  const router = useRouter();
  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [credits, setCredits] = useState(
    initial?.credits === null || initial?.credits === undefined ? "" : String(initial.credits),
  );
  const [type, setType] = useState<CourseTypeValue>(initial?.type ?? "ELECTIVE");
  const [college, setCollege] = useState(initial?.college ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const creditsValue = credits.trim() === "" ? null : Number(credits);
    if (
      creditsValue !== null &&
      (!Number.isFinite(creditsValue) || creditsValue < 0 || creditsValue > 10)
    ) {
      setError("学分必须是 0 到 10 的数字");
      return;
    }

    setPending(true);
    try {
      const result = await upsertCourseAction({
        id: initial?.id,
        code,
        name,
        credits: creditsValue,
        type,
        college,
        description,
      });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      if (initial) {
        router.refresh();
      } else {
        router.push(`/admin/courses/${result.data.courseId}`);
      }
    } catch {
      setError("保存失败，请稍后再试");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit} noValidate>
      <div className="field-row">
        <div className="field">
          <label className="label" htmlFor="course-code">
            课程代码
          </label>
          <input
            id="course-code"
            className="input"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
            maxLength={20}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="course-credits">
            学分 <span>（可选）</span>
          </label>
          <input
            id="course-credits"
            className="input"
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={credits}
            onChange={(event) => setCredits(event.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="course-name">
          课程名称
        </label>
        <input
          id="course-name"
          className="input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={100}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label className="label" htmlFor="course-type">
            课程类型
          </label>
          <select
            id="course-type"
            className="select"
            value={type}
            onChange={(event) => setType(event.target.value as CourseTypeValue)}
          >
            {COURSE_TYPE_VALUES.map((value) => (
              <option key={value} value={value}>
                {COURSE_TYPE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="course-college">
            学院
          </label>
          <input
            id="course-college"
            className="input"
            list="college-options"
            value={college}
            onChange={(event) => setCollege(event.target.value)}
            required
            maxLength={50}
          />
          <datalist id="college-options">
            {colleges.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="course-description">
          课程简介 <span>（可选）</span>
        </label>
        <textarea
          id="course-description"
          className="textarea"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={2000}
        />
      </div>

      {error ? (
        <p className="form-error" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}

      <div className="row">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "保存中..." : initial ? "保存课程" : "创建课程"}
        </button>
      </div>
    </form>
  );
}
