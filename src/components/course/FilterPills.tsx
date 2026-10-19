import Link from "next/link";
import { buildQuery } from "@/lib/search-params";

type FilterOption = { label: string; value: string };

export function FilterPills({
  label,
  param,
  options,
  currentValue,
  baseParams,
}: {
  label: string;
  param: string;
  options: FilterOption[];
  currentValue: string;
  baseParams: Record<string, string | undefined>;
}) {
  return (
    <div className="filter-group">
      <span className="filter-label">{label}</span>
      <Link
        href={`/courses${buildQuery(baseParams, { [param]: undefined })}`}
        className={`pill${currentValue ? "" : " pill--active"}`}
      >
        全部
      </Link>
      {options.map((option) => {
        const isActive = currentValue === option.value;
        return (
          <Link
            key={option.value}
            href={`/courses${buildQuery(baseParams, {
              [param]: isActive ? undefined : option.value,
            })}`}
            className={`pill${isActive ? " pill--active" : ""}`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
