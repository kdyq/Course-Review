export function SearchInput({
  id = "course-search",
  action = "/courses",
  defaultValue = "",
  placeholder = "课程名、教师或课程代码",
  label = "搜索课程、教师或课程代码",
  hiddenParams,
}: {
  id?: string;
  action?: string;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  hiddenParams?: Record<string, string | undefined>;
}) {
  return (
    <search>
      <form action={action} className="search-form">
        <label className="sr-only" htmlFor={id}>
          {label}
        </label>
        {hiddenParams
          ? Object.entries(hiddenParams).map(([key, value]) =>
              value ? <input key={key} type="hidden" name={key} value={value} /> : null,
            )
          : null}
        <input
          id={id}
          name="q"
          className="input"
          type="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary">
          搜索
        </button>
      </form>
    </search>
  );
}
