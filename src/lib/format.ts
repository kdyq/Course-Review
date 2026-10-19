import { ASSESSMENT_OPTIONS, COURSE_TYPE_LABELS, MIN_SAMPLE_SIZE } from "@/lib/constants";

export function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "样本不足";
  }
  return value.toFixed(1);
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("zh-CN").format(value);
}

export function formatTerm(code: string): string {
  const match = /^(\d{4})-(\d{4})-([12])$/.exec(code);
  if (!match) {
    return code;
  }
  const startYear = Number(match[1]);
  const endYear = Number(match[2]);
  const half = match[3];
  const year = half === "1" ? startYear : endYear;
  return `${year} ${half === "1" ? "秋" : "春"}`;
}

export function formatMonth(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return `${value.getFullYear()} 年 ${value.getMonth() + 1} 月`;
}

export function formatDate(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
}

export function courseTypeLabel(type: string): string {
  return COURSE_TYPE_LABELS[type] ?? type;
}

export function assessmentLabel(value: string): string {
  return ASSESSMENT_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function distributionOf(values: number[]): number[] {
  const distribution = [0, 0, 0, 0, 0];
  for (const value of values) {
    if (value >= 1 && value <= 5) {
      distribution[value - 1] += 1;
    }
  }
  return distribution;
}

export function hasEnoughSamples(count: number, minimum = MIN_SAMPLE_SIZE): boolean {
  return count >= minimum;
}

export function formatScoreOrSample(value: number | null | undefined, count: number): string {
  return hasEnoughSamples(count) ? formatScore(value) : "样本不足";
}

export function padNumber(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}…`;
}
