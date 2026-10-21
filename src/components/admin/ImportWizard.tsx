"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, useState } from "react";
import type { CsvPreview } from "@/lib/csv-types";
import { importCoursesCsvAction, previewCsvAction } from "@/server/actions/admin";

const SAMPLE_CSV = [
  "course_code,course_name,credits,course_type,college,instructor,term,section",
  "CS330,人机交互,3,ELECTIVE,计算机学院,王砚秋,2026-2027-2,01",
  "ECON330,产业组织理论,2,ELECTIVE,经济学院,周明远,2026-2027-2,01",
].join("\n");

const ACTION_LABELS: Record<string, string> = {
  create: "新增",
  update: "更新",
  error: "错误",
};

export function ImportWizard() {
  const router = useRouter();
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setCsvText(await file.text());
    setPreview(null);
    setError(null);
    setMessage(null);
  }

  async function handlePreview() {
    setError(null);
    setMessage(null);
    setPreviewing(true);
    try {
      const result = await previewCsvAction(csvText);
      if (!result.ok) {
        setError(result.error.message);
        setPreview(null);
        return;
      }
      setPreview(result.data);
    } catch {
      setError("预览失败，请稍后再试");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleImport() {
    if (!preview) {
      setError("请先预览 CSV");
      return;
    }
    if (preview.errors > 0) {
      setError("有错误行，修正后再导入");
      return;
    }
    setError(null);
    setMessage(null);
    setImporting(true);
    try {
      const result = await importCoursesCsvAction(csvText);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setMessage(
        `导入完成：${result.data.rows} 行，${result.data.courses} 门课程，${result.data.offerings} 个班次。`,
      );
      setPreview(null);
      setCsvText("");
      router.refresh();
    } catch {
      setError("导入失败，请稍后再试");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="stack">
      <p className="form-hint">
        CSV 列：course_code、course_name、credits、course_type、college、instructor、term、section。
        重复课程按课程代码合并，重复班次按课程代码、学期和班次合并。
      </p>

      <div className="row">
        <label className="btn btn-sm btn-secondary" htmlFor="csv-file">
          选择 CSV 文件
        </label>
        <input
          id="csv-file"
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={handleFile}
        />
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => {
            setCsvText(SAMPLE_CSV);
            setPreview(null);
            setError(null);
            setMessage(null);
          }}
        >
          填入模板
        </button>
      </div>

      <div className="field">
        <label className="label" htmlFor="csv-text">
          CSV 内容
        </label>
        <textarea
          id="csv-text"
          className="textarea"
          value={csvText}
          onChange={(event) => {
            setCsvText(event.target.value);
            setPreview(null);
          }}
          placeholder={SAMPLE_CSV}
        />
      </div>

      <div className="row">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handlePreview}
          disabled={previewing || csvText.trim().length === 0}
        >
          {previewing ? "预览中..." : "预览前 20 行"}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleImport}
          disabled={importing || !preview || preview.errors > 0}
        >
          {importing ? "导入中..." : "提交导入"}
        </button>
      </div>

      {error ? (
        <p className="form-error" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="form-message" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}

      {preview ? (
        <div className="stack">
          <div className="preview-stats">
            <span>总行数 {preview.total}</span>
            <span>新增 {preview.create}</span>
            <span>更新 {preview.update}</span>
            <span>错误 {preview.errors}</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>行</th>
                  <th>课程</th>
                  <th>学期 / 班次</th>
                  <th>教师</th>
                  <th>状态</th>
                  <th>错误</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.rowNumber}>
                    <td>{row.rowNumber}</td>
                    <td>
                      {row.courseCode}
                      <br />
                      <span className="muted">{row.courseName}</span>
                    </td>
                    <td>
                      {row.term}
                      <br />
                      <span className="muted">{row.section} 班</span>
                    </td>
                    <td>{row.instructor}</td>
                    <td>{ACTION_LABELS[row.action] ?? row.action}</td>
                    <td className="form-error">{row.errors.join("；")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
