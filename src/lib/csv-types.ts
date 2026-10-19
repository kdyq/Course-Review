import type { CourseTypeValue } from "@/lib/constants";

export type CsvPreviewRow = {
  rowNumber: number;
  courseCode: string;
  courseName: string;
  credits: number | null;
  courseType: CourseTypeValue;
  college: string;
  instructor: string;
  term: string;
  section: string;
  action: "create" | "update" | "error";
  errors: string[];
};

export type CsvPreview = {
  rows: CsvPreviewRow[];
  total: number;
  create: number;
  update: number;
  errors: number;
};
