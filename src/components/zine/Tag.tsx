import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

type TagProps = HTMLAttributes<HTMLSpanElement> & {
  soft?: boolean;
  children: ReactNode;
};

export function Tag({ soft = false, className, children, ...props }: TagProps) {
  return (
    <span className={clsx("tag", soft && "tag--soft", className)} {...props}>
      {children}
    </span>
  );
}

export function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return null;
  }
  return (
    <div className="tag-list">
      {tags.map((tag) => (
        <Tag key={tag}>{tag}</Tag>
      ))}
    </div>
  );
}
