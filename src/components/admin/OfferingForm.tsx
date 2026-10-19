"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { upsertOfferingAction } from "@/server/actions/admin";

export type OfferingFormInitial = {
  id: string;
  termName: string;
  section: string;
  campus: string | null;
  instructors: string[];
};

export function OfferingForm({
  courseId,
  terms,
  initial,
}: {
  courseId: string;
  terms: string[];
  initial?: OfferingFormInitial;
}) {
  const router = useRouter();
  const [term, setTerm] = useState(initial?.termName ?? "");
  const [section, setSection] = useState(initial?.section ?? "01");
  const [campus, setCampus] = useState(initial?.campus ?? "");
  const [instructors, setInstructors] = useState(initial?.instructors.join("、") ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formKey = initial?.id ?? "new";
  const termListId = `term-options-${formKey}`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const instructorNames = instructors
      .split(/[，,、]/)
      .map((name) => name.trim())
      .filter(Boolean);
    if (instructorNames.length === 0) {
      setError("至少填写一位教师");
      return;
    }

    setPending(true);
    try {
      const result = await upsertOfferingAction({
        id: initial?.id,
        courseId,
        term,
        section,
        campus,
        instructorNames,
      });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      if (!initial) {
        setTerm("");
        setSection("01");
        setCampus("");
        setInstructors("");
      }
      router.refresh();
    } catch {
      setError("保存失败，请稍后再试");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="stack-sm" onSubmit={handleSubmit} noValidate>
      <div className="field-row">
        <div className="field">
          <label className="label" htmlFor={`term-${formKey}`}>
            学期
          </label>
          <input
            id={`term-${formKey}`}
            className="input"
            list={termListId}
            placeholder="2026-2027-1"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            required
          />
          <datalist id={termListId}>
            {terms.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </div>
        <div className="field">
          <label className="label" htmlFor={`section-${formKey}`}>
            班次
          </label>
          <input
            id={`section-${formKey}`}
            className="input"
            value={section}
            onChange={(event) => setSection(event.target.value)}
            maxLength={10}
            required
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label className="label" htmlFor={`campus-${formKey}`}>
            校区 <span>（可选）</span>
          </label>
          <input
            id={`campus-${formKey}`}
            className="input"
            value={campus}
            onChange={(event) => setCampus(event.target.value)}
            maxLength={50}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor={`instructors-${formKey}`}>
            教师
          </label>
          <input
            id={`instructors-${formKey}`}
            className="input"
            placeholder="多位教师用、分隔"
            value={instructors}
            onChange={(event) => setInstructors(event.target.value)}
            required
          />
          <span className="form-hint">最多三位教师，用中文顿号或逗号分隔。</span>
        </div>
      </div>

      {error ? (
        <p className="form-error" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}

      <div className="row">
        <button type="submit" className="btn btn-sm btn-primary" disabled={pending}>
          {pending ? "保存中..." : initial ? "保存班次" : "添加班次"}
        </button>
      </div>
    </form>
  );
}
