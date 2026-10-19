export function SortSelect({
  current,
  baseParams,
  hasQuery,
}: {
  current: string;
  baseParams: Record<string, string | undefined>;
  hasQuery: boolean;
}) {
  return (
    <form action="/courses" method="get" className="row">
      {Object.entries(baseParams).map(([key, value]) =>
        value && key !== "sort" && key !== "page" ? (
          <input key={key} type="hidden" name={key} value={value} />
        ) : null,
      )}
      <label className="filter-label" htmlFor="course-sort">
        排序
      </label>
      <select id="course-sort" name="sort" defaultValue={current} className="select select--inline">
        {hasQuery ? <option value="relevance">相关度</option> : null}
        <option value="recommendation">推荐度</option>
        <option value="reviews">评价数</option>
        <option value="latest">最新</option>
      </select>
      <button type="submit" className="btn btn-sm btn-secondary">
        应用
      </button>
    </form>
  );
}
