import "server-only";
import { parse } from "csv-parse/sync";
import type { CourseType } from "@/generated/prisma/client";
import { COURSE_TYPE_LABELS, type CourseTypeValue } from "@/lib/constants";
import type { CsvPreview, CsvPreviewRow } from "@/lib/csv-types";
import { prisma } from "@/lib/prisma";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseRecords(csvText: string): Array<Record<string, unknown>> {
  return parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
  }) as Array<Record<string, unknown>>;
}

async function buildRows(csvText: string): Promise<CsvPreviewRow[]> {
  const records = parseRecords(csvText);
  const rows: CsvPreviewRow[] = [];

  for (const [index, record] of records.entries()) {
    const rowNumber = index + 2;
    const courseCode = text(record.course_code);
    const courseName = text(record.course_name);
    const creditsRaw = text(record.credits);
    const courseTypeRaw = (text(record.course_type) || "ELECTIVE").toUpperCase();
    const college = text(record.college);
    const instructor = text(record.instructor);
    const term = text(record.term);
    const section = text(record.section) || "01";

    const errors: string[] = [];
    if (!courseCode) errors.push("course_code 必填");
    if (!courseName) errors.push("course_name 必填");
    if (!college) errors.push("college 必填");
    if (!instructor) errors.push("instructor 必填");
    if (!term) errors.push("term 必填");

    let credits: number | null = null;
    if (creditsRaw) {
      const parsed = Number(creditsRaw);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10) {
        errors.push("credits 必须是 0 到 10 的数字");
      } else {
        credits = parsed;
      }
    }

    if (!(courseTypeRaw in COURSE_TYPE_LABELS)) {
      errors.push("course_type 必须是 REQUIRED、ELECTIVE、GENERAL 或 PRACTICE");
    }
    const courseType = (
      courseTypeRaw in COURSE_TYPE_LABELS ? courseTypeRaw : "ELECTIVE"
    ) as CourseTypeValue;

    let action: CsvPreviewRow["action"] = "error";
    if (errors.length === 0) {
      const existing = await prisma.course.findUnique({
        where: { code: courseCode },
        select: {
          id: true,
          offerings: {
            where: { term: { name: term }, section },
            select: { id: true },
          },
        },
      });
      action = existing ? "update" : "create";
    }

    rows.push({
      rowNumber,
      courseCode,
      courseName,
      credits,
      courseType,
      college,
      instructor,
      term,
      section,
      action,
      errors,
    });
  }

  return rows;
}

export async function previewCsv(csvText: string): Promise<CsvPreview> {
  const rows = await buildRows(csvText);
  return {
    rows: rows.slice(0, 20),
    total: rows.length,
    create: rows.filter((row) => row.action === "create").length,
    update: rows.filter((row) => row.action === "update").length,
    errors: rows.filter((row) => row.action === "error").length,
  };
}

export async function importCsv(csvText: string): Promise<{
  rows: number;
  courses: number;
  offerings: number;
  instructors: number;
}> {
  const rows = await buildRows(csvText);
  const invalid = rows.filter((row) => row.action === "error");
  if (invalid.length > 0) {
    const message = invalid
      .slice(0, 5)
      .map((row) => `第 ${row.rowNumber} 行：${row.errors.join("；")}`)
      .join(" ");
    throw new Error(`有 ${invalid.length} 行错误，未导入。${message}`);
  }

  const courseCodes = new Set<string>();
  const instructorKeys = new Set<string>();

  await prisma.$transaction(
    async (tx) => {
      for (const row of rows) {
        courseCodes.add(row.courseCode);
        instructorKeys.add(`${row.instructor}@${row.college}`);

        const college = await tx.college.upsert({
          where: { name: row.college },
          update: {},
          create: { name: row.college },
        });

        const course = await tx.course.upsert({
          where: { code: row.courseCode },
          update: {
            name: row.courseName,
            credits: row.credits,
            type: row.courseType as CourseType,
            collegeId: college.id,
          },
          create: {
            code: row.courseCode,
            name: row.courseName,
            credits: row.credits,
            type: row.courseType as CourseType,
            collegeId: college.id,
          },
        });

        let instructor = await tx.instructor.findFirst({
          where: { name: row.instructor, collegeId: college.id },
          select: { id: true },
        });
        if (!instructor) {
          instructor = await tx.instructor.create({
            data: { name: row.instructor, collegeId: college.id },
            select: { id: true },
          });
        }

        const term = await tx.term.upsert({
          where: { name: row.term },
          update: {},
          create: { name: row.term },
        });

        const offering = await tx.offering.upsert({
          where: {
            courseId_termId_section: {
              courseId: course.id,
              termId: term.id,
              section: row.section,
            },
          },
          update: {},
          create: {
            courseId: course.id,
            termId: term.id,
            section: row.section,
          },
        });

        await tx.offeringInstructor.upsert({
          where: {
            offeringId_instructorId: {
              offeringId: offering.id,
              instructorId: instructor.id,
            },
          },
          update: {},
          create: {
            offeringId: offering.id,
            instructorId: instructor.id,
          },
        });
      }
    },
    { timeout: 30000 },
  );

  return {
    rows: rows.length,
    courses: courseCodes.size,
    offerings: rows.length,
    instructors: instructorKeys.size,
  };
}
