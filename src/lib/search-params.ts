export const DEFAULT_PAGE_SIZE = 12;

export type RawSearchParams = Record<string, string | string[] | undefined>;

export function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function parsePage(value: string | string[] | undefined): number {
  const raw = firstParam(value);
  const page = Number(raw);
  return Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
}

export type CourseListParams = {
  q: string;
  college: string;
  type: string;
  term: string;
  sort: "relevance" | "recommendation" | "reviews" | "latest";
  page: number;
  pageSize: number;
};

export function parseCourseListParams(searchParams: RawSearchParams): CourseListParams {
  const q = (firstParam(searchParams.q) ?? "").trim().slice(0, 60);
  const college = (firstParam(searchParams.college) ?? "").trim();
  const type = (firstParam(searchParams.type) ?? "").trim();
  const term = (firstParam(searchParams.term) ?? "").trim();
  const sortRaw = firstParam(searchParams.sort);
  const allowedSorts = ["relevance", "recommendation", "reviews", "latest"] as const;
  const sort = allowedSorts.includes(sortRaw as (typeof allowedSorts)[number])
    ? (sortRaw as (typeof allowedSorts)[number])
    : q
      ? "relevance"
      : "recommendation";

  return {
    q,
    college,
    type,
    term,
    sort,
    page: parsePage(searchParams.page),
    pageSize: DEFAULT_PAGE_SIZE,
  };
}

export function buildQuery(
  current: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>,
  options: { resetPage?: boolean } = {},
): string {
  const next = { ...current, ...overrides };
  if (options.resetPage !== false && !("page" in overrides)) {
    next.page = undefined;
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value) {
      search.set(key, value);
    }
  }
  const result = search.toString();
  return result ? `?${result}` : "";
}

export function toQueryRecord(params: CourseListParams): Record<string, string | undefined> {
  return {
    q: params.q || undefined,
    college: params.college || undefined,
    type: params.type || undefined,
    term: params.term || undefined,
    sort: params.sort === "recommendation" && !params.q ? undefined : params.sort,
    page: params.page > 1 ? String(params.page) : undefined,
  };
}
