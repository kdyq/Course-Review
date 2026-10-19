import Link from "next/link";
import { buildQuery } from "@/lib/search-params";

function pageNumbers(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const numbers = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = Array.from(numbers)
    .filter((value) => value >= 1 && value <= total)
    .sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];

  for (let index = 0; index < sorted.length; index += 1) {
    const value = sorted[index];
    const previous = sorted[index - 1];
    if (previous && value - previous > 1) {
      result.push("ellipsis");
    }
    result.push(value);
  }

  return result;
}

function renderPageNumbers(
  page: number,
  totalPages: number,
  baseParams: Record<string, string | undefined>,
) {
  let ellipsisCount = 0;

  return pageNumbers(page, totalPages).map((value) => {
    if (value === "ellipsis") {
      ellipsisCount += 1;
      return (
        <span key={`ellipsis-${ellipsisCount}`} aria-hidden="true">
          ...
        </span>
      );
    }

    if (value === page) {
      return (
        <span key={value} className="is-current" aria-current="page">
          {value}
        </span>
      );
    }

    return (
      <Link
        key={value}
        href={`/courses${buildQuery(baseParams, { page: String(value) }, { resetPage: false })}`}
      >
        {value}
      </Link>
    );
  });
}

export function Pagination({
  page,
  totalPages,
  baseParams,
}: {
  page: number;
  totalPages: number;
  baseParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="pagination" aria-label="分页">
      {page > 1 ? (
        <Link
          href={`/courses${buildQuery(baseParams, { page: String(page - 1) }, { resetPage: false })}`}
        >
          上一页
        </Link>
      ) : (
        <span aria-disabled="true">上一页</span>
      )}

      {renderPageNumbers(page, totalPages, baseParams)}

      {page < totalPages ? (
        <Link
          href={`/courses${buildQuery(baseParams, { page: String(page + 1) }, { resetPage: false })}`}
        >
          下一页
        </Link>
      ) : (
        <span aria-disabled="true">下一页</span>
      )}
    </nav>
  );
}
